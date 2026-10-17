import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  declaredMimeMatches,
  detectFileKind,
  extForKind,
  isImageKind,
} from "@/lib/file-magic";
import {
  rateLimiter,
  UPLOAD_LIMIT,
  UPLOAD_WINDOW_MS,
} from "@/lib/rate-limit";

/** İstek gövdesi için üst sınır (Content-Length kontrolü). */
const HARD_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
/** Görseller için daha sıkı limit. */
const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
/** PDF / EPUB için görselden daha sıkı (küçük) limit. */
const DOC_MAX_BYTES = 4 * 1024 * 1024; // 4 MB

const UPLOAD_ROLES = new Set(["STUDENT", "TEACHER"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) {
    return NextResponse.json({ error: "Yetkisiz istek." }, { status: 401 });
  }

  if (!UPLOAD_ROLES.has(user.role)) {
    return NextResponse.json(
      { error: "Bu rol dosya yükleyemez." },
      { status: 403 }
    );
  }

  const rl = await rateLimiter.check(
    `upload:${user.id}`,
    UPLOAD_LIMIT,
    UPLOAD_WINDOW_MS
  );
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Çok fazla yükleme. Lütfen ${rl.retryAfterSec} saniye sonra tekrar deneyin.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  // Mümkünse tamponu okumadan Content-Length ile reddet.
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 0 && contentLength > HARD_MAX_BYTES + 64 * 1024) {
    // multipart overhead için küçük pay bırakılır
    return NextResponse.json(
      { error: "Dosya boyutu en fazla 10 MB olabilir." },
      { status: 413 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }

  if (file.size > HARD_MAX_BYTES) {
    return NextResponse.json(
      { error: "Dosya boyutu en fazla 10 MB olabilir." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectFileKind(buffer);
  if (!kind) {
    return NextResponse.json(
      {
        error:
          "Dosya içeriği tanınamadı. Sadece JPG, PNG, WEBP, GIF, PDF ve EPUB yüklenebilir.",
      },
      { status: 400 }
    );
  }

  if (!declaredMimeMatches(file.type || "", kind)) {
    return NextResponse.json(
      {
        error:
          "Dosya türü ile içerik uyuşmuyor. Lütfen geçerli bir dosya yükleyin.",
      },
      { status: 400 }
    );
  }

  const maxForKind = isImageKind(kind) ? IMAGE_MAX_BYTES : DOC_MAX_BYTES;
  if (buffer.length > maxForKind) {
    const mb = Math.round(maxForKind / (1024 * 1024));
    return NextResponse.json(
      {
        error: isImageKind(kind)
          ? `Görsel boyutu en fazla ${mb} MB olabilir.`
          : `PDF/EPUB boyutu en fazla ${mb} MB olabilir.`,
      },
      { status: 400 }
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  // Dosya adı tamamen sunucuda üretilir; kullanıcı girdisi yol olarak kullanılmaz.
  const ext = extForKind(kind);
  const fileName = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  await writeFile(path.join(dir, fileName), buffer);

  // Orijinal ad yalnızca yanıtta gösterim için; diske yazılmaz.
  const safeDisplayName = String(file.name ?? "dosya")
    .replace(/[^\w.\-ığüşöçİĞÜŞÖÇ\s]/gi, "_")
    .slice(0, 200);

  return NextResponse.json({
    url: `/uploads/${fileName}`,
    name: safeDisplayName,
    size: buffer.length,
  });
}
