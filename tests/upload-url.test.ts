import { expect, it } from "vitest";
import { parseUploadUrl, requireUploadUrl, sanitizeFileName } from "@/lib/upload-url";
const base = "/uploads/1700000000000-abcdef0123456789";
it("yalnızca üretilen dosya adını ve doğru türü kabul eder", () => {
  expect(parseUploadUrl(`${base}.jpg`, "image")).toBe(`${base}.jpg`);
  expect(parseUploadUrl(`${base}.pdf`, "document")).toBe(`${base}.pdf`);
  expect(parseUploadUrl(`${base}.epub`, "document")).toBe(`${base}.epub`);
  for (const url of ["/uploads/../x", "https://evil.example", "javascript:alert(1)", `${base}.svg`, `${base}.JPG`, `${base}.jpg\n`, `${base}.jpg?q=1`, "/uploads/%2e%2e/x.jpg"]) expect(parseUploadUrl(url, "any")).toBeNull();
  expect(parseUploadUrl(`${base}.pdf`, "image")).toBeNull();
  expect(parseUploadUrl(`${base}.jpg`, "document")).toBeNull();
  expect(() => requireUploadUrl("https://evil.example", "image")).toThrow("Geçersiz dosya adresi.");
  expect(sanitizeFileName("abc\n\x00.pdf")).toBe("abc.pdf");
});
