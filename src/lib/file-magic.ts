/**
 * Dosya içeriğini magic-byte ile doğrular (tarayıcı MIME'ına güvenilmez).
 */

export type DetectedKind = "jpeg" | "png" | "webp" | "gif" | "pdf" | "epub";

const KIND_TO_EXT: Record<DetectedKind, string> = {
  jpeg: ".jpg",
  png: ".png",
  webp: ".webp",
  gif: ".gif",
  pdf: ".pdf",
  epub: ".epub",
};

const KIND_TO_MIME: Record<DetectedKind, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  epub: "application/epub+zip",
};

export function extForKind(kind: DetectedKind) {
  return KIND_TO_EXT[kind];
}

export function mimeForKind(kind: DetectedKind) {
  return KIND_TO_MIME[kind];
}

export function isImageKind(kind: DetectedKind) {
  return kind === "jpeg" || kind === "png" || kind === "webp" || kind === "gif";
}

/** ZIP (EPUB) yerel dosya başlığı: PK\x03\x04, PK\x05\x06 veya PK\x07\x08 */
function looksLikeZip(buf: Buffer) {
  return (
    buf.length >= 4 &&
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07) &&
    (buf[3] === 0x04 || buf[3] === 0x06 || buf[3] === 0x08)
  );
}

/**
 * EPUB aslında ZIP; mimetype girişinin uncompressed ve ilk kayıt olması beklenir.
 * Gevşek kontrol: ZIP + "mimetype" + "application/epub+zip" dizilerinin varlığı.
 */
function looksLikeEpub(buf: Buffer) {
  if (!looksLikeZip(buf)) return false;
  const head = buf.subarray(0, Math.min(buf.length, 512)).toString("utf8");
  return (
    head.includes("mimetype") && head.includes("application/epub+zip")
  );
}

export function detectFileKind(buf: Buffer): DetectedKind | null {
  if (buf.length < 12) return null;

  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";

  // PNG
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "png";
  }

  // GIF
  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38
  ) {
    return "gif";
  }

  // WEBP: RIFF....WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "webp";
  }

  // PDF: %PDF
  if (
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46
  ) {
    return "pdf";
  }

  if (looksLikeEpub(buf)) return "epub";

  return null;
}

/** Bildirilen MIME ile içerik uyumlu mu? */
export function declaredMimeMatches(
  declared: string,
  kind: DetectedKind
): boolean {
  const expected = mimeForKind(kind);
  if (declared === expected) return true;
  // Bazı tarayıcılar EPUB'ı application/zip olarak gönderir
  if (kind === "epub" && (declared === "application/zip" || declared === "application/x-zip-compressed")) {
    return true;
  }
  return false;
}
