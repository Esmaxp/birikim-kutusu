"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { ROLE_HOME, YAKINLIKLAR } from "@/lib/constants";
import { roleBySlug } from "@/lib/auth-roles";
import { writeAuditLog } from "@/lib/audit";
import {
  REGISTER_LIMIT,
  REGISTER_WINDOW_MS,
  rateLimiter,
} from "@/lib/rate-limit";

export type RegisterState = { error?: string };

/** Aynı öğrenciye yalnızca bir anne ve bir baba bağlanabilir; "VELI" birden çok olabilir. */
const TEK_OLAN_YAKINLIKLAR = new Set(["ANNE", "BABA"]);

const MIN_PASSWORD = 6;

function norm(s: string) {
  return s.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

/**
 * Türkçe karakterleri ASCII'ye indirger ("Zeynep Çelik" -> "zeynep celik").
 * Veli/öğrenci Türkçe klavye olmadan yazdığında da eşleşme sağlar.
 */
function sadelestir(s: string) {
  const map: Record<string, string> = { ı: "i", ç: "c", ğ: "g", ö: "o", ş: "s", ü: "u" };
  return norm(s)
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || "unknown";
}

type CommonFields = { name: string; email: string; password: string };

function readCommon(
  formData: FormData
): { ok: true; data: CommonFields } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (name.length < 3) {
    return { ok: false, error: "Ad soyad en az 3 karakter olmalıdır." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Geçerli bir e-posta adresi girin." };
  }
  if (password.length < MIN_PASSWORD) {
    return { ok: false, error: `Şifre en az ${MIN_PASSWORD} karakter olmalıdır.` };
  }
  if (password !== password2) {
    return { ok: false, error: "Şifreler eşleşmiyor." };
  }

  return { ok: true, data: { name, email, password } };
}

/**
 * Şube + okul no + ad ile mevcut öğrenci kaydını bulur.
 * Okul no şube içinde tek olduğu için ad, doğrulama amaçlı ikinci kontroldür.
 */
async function findStudent(sube: string, ad: string, no: number) {
  const students = await prisma.student.findMany({
    where: { class: { name: sube }, no },
    select: { id: true, name: true, no: true, userId: true },
  });
  const hedefNorm = norm(ad);
  const hedefSade = sadelestir(ad);
  return (
    students.find(
      (s) => norm(s.name) === hedefNorm || sadelestir(s.name) === hedefSade
    ) ?? null
  );
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const role = roleBySlug(String(formData.get("rol") ?? ""));
  if (!role) return { error: "Geçersiz kayıt türü." };

  const common = readCommon(formData);
  if (!common.ok) return { error: common.error };
  const { name, email, password } = common.data;

  const ip = await clientIp();
  const rl = await rateLimiter.check(
    `register:${ip}`,
    REGISTER_LIMIT,
    REGISTER_WINDOW_MS
  );
  if (!rl.allowed) {
    return {
      error: `Çok fazla kayıt denemesi. Lütfen ${Math.ceil(
        rl.retryAfterSec / 60
      )} dakika sonra tekrar deneyin.`,
    };
  }

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin." };
  }

  const passwordHash = await hashPassword(password);
  let userId: string;

  if (role.key === "TEACHER") {
    const title = String(formData.get("title") ?? "").trim();
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "TEACHER",
        title: title ? title.slice(0, 100) : null,
      },
    });
    userId = user.id;
  } else if (role.key === "STUDENT") {
    const sube = String(formData.get("sube") ?? "").trim();
    const no = Number(formData.get("no"));
    if (!sube) return { error: "Şube seçmelisiniz." };
    if (!Number.isInteger(no) || no <= 0) {
      return { error: "Geçerli bir okul numarası girin." };
    }

    const schoolClass = await prisma.schoolClass.findUnique({
      where: { name: sube },
      select: { id: true },
    });
    if (!schoolClass) return { error: "Seçilen şube bulunamadı." };

    const mevcut = await findStudent(sube, name, no);
    if (mevcut?.userId) {
      return {
        error: "Bu öğrenci için zaten bir hesap var. Giriş yapmayı deneyin.",
      };
    }

    if (!mevcut) {
      const noSahibi = await prisma.student.findFirst({
        where: { classId: schoolClass.id, no },
        select: { name: true },
      });
      if (noSahibi) {
        return {
          error: `${sube} şubesinde ${no} numara başka bir öğrenciye ait. Bilgilerinizi kontrol edin.`,
        };
      }
    }

    userId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, name, role: "STUDENT" },
      });
      if (mevcut) {
        await tx.student.update({
          where: { id: mevcut.id },
          data: { userId: user.id },
        });
      } else {
        await tx.student.create({
          data: { name, no, classId: schoolClass.id, userId: user.id },
        });
      }
      return user.id;
    });
  } else {
    // VELİ
    const yakinlik = String(formData.get("yakinlik") ?? "");
    if (!YAKINLIKLAR.some((y) => y.key === yakinlik)) {
      return { error: "Yakınlık derecesi seçmelisiniz." };
    }

    const subeler = formData.getAll("cocukSube").map((v) => String(v).trim());
    const adlar = formData.getAll("cocukAd").map((v) => String(v).trim());
    const numaralar = formData.getAll("cocukNo").map((v) => String(v).trim());

    if (!subeler.length) return { error: "En az bir çocuk eklemelisiniz." };

    const bulunanlar: { id: string; name: string }[] = [];
    for (let i = 0; i < subeler.length; i++) {
      const sira = subeler.length > 1 ? `${i + 1}. çocuk: ` : "";
      const sube = subeler[i];
      const ad = adlar[i] ?? "";
      const no = Number(numaralar[i]);

      if (!sube || !ad) {
        return { error: `${sira}şube ve öğrenci adı zorunludur.` };
      }
      if (!Number.isInteger(no) || no <= 0) {
        return { error: `${sira}geçerli bir okul numarası girin.` };
      }

      const student = await findStudent(sube, ad, no);
      if (!student) {
        return {
          error: `${sira}${sube} şubesinde "${ad}" adına ${no} numaralı öğrenci bulunamadı. Bilgileri okul kaydındaki gibi girin.`,
        };
      }
      if (bulunanlar.some((b) => b.id === student.id)) {
        return { error: `${sira}aynı öğrenciyi iki kez eklediniz.` };
      }

      if (TEK_OLAN_YAKINLIKLAR.has(yakinlik)) {
        const cakisan = await prisma.studentParent.findFirst({
          where: { studentId: student.id, yakinlik },
          select: { id: true },
        });
        if (cakisan) {
          const etiket = YAKINLIKLAR.find((y) => y.key === yakinlik)?.label;
          return {
            error: `${student.name} için zaten bir "${etiket}" kaydı var. Farklı bir yakınlık seçin.`,
          };
        }
      }

      bulunanlar.push({ id: student.id, name: student.name });
    }

    userId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, name, role: "PARENT" },
      });
      await tx.studentParent.createMany({
        data: bulunanlar.map((b) => ({
          studentId: b.id,
          parentId: user.id,
          yakinlik,
        })),
      });
      return user.id;
    });
  }

  await writeAuditLog({
    actorId: userId,
    action: "USER_REGISTER",
    entityType: "User",
    entityId: userId,
    meta: { role: role.key, email },
  });

  await createSession(userId);
  redirect(ROLE_HOME[role.key] ?? "/");
}
