export const UPLOAD_URL_RE = /^\/uploads\/\d{13}-[a-f0-9]{16}\.(jpg|png|webp|gif|pdf|epub)$/;
export function parseUploadUrl(url: unknown, kind: "image" | "document" | "any"): string | null {
  if (typeof url !== "string") return null;
  const match = UPLOAD_URL_RE.exec(url);
  if (!match || match[0] !== url) return null;
  const image = ["jpg", "png", "webp", "gif"].includes(match[1]);
  return kind === "any" || (kind === "image" ? image : !image) ? url : null;
}
export function requireUploadUrl(value: unknown, kind: "image" | "document" | "any") {
  if (value === null || value === undefined || value === "") return null;
  const url = parseUploadUrl(value, kind);
  if (!url) throw new Error("Geçersiz dosya adresi.");
  return url;
}
export function sanitizeFileName(value: unknown) {
  const name = [...String(value ?? "")].filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127).join("").trim().slice(0, 250);
  return name || null;
}
