import { createHmac, randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";

export const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const INVITE_EXPIRY_DAYS = 14;
export const INVITE_ERROR = "Davet kodu geçersiz, süresi dolmuş veya daha önce kullanılmış.";
const runtime = globalThis as typeof globalThis & { inviteWarning?: boolean };
export function inviteSecret() {
  const secret = process.env.INVITE_CODE_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("INVITE_CODE_SECRET üretimde zorunludur.");
  if (!runtime.inviteWarning) { console.warn("[invite] INVITE_CODE_SECRET eksik; yalnızca geliştirme için sabit anahtar kullanılıyor."); runtime.inviteWarning = true; }
  return "birikim-development-invite-secret-only";
}
export function normalizeCode(value: string): string | null {
  if (value.length > 100) return null;
  const code = value.toUpperCase().replace(/[\s-]/g, "");
  return code.length === 10 && [...code].every((c) => INVITE_ALPHABET.includes(c)) ? code : null;
}
export function generateInviteCode() {
  const code = Array.from({ length: 10 }, () => INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)]).join("");
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}
export function hashInviteCode(value: string) {
  const normalized = normalizeCode(value);
  if (!normalized) throw new Error(INVITE_ERROR);
  return createHmac("sha256", inviteSecret()).update(normalized).digest("hex");
}
export async function redeemInvite(tx: Prisma.TransactionClient, code: string, kind: "STUDENT" | "PARENT", userId: string) {
  const invite = await tx.inviteCode.findUnique({ where: { codeHash: hashInviteCode(code) }, include: { student: true } });
  if (!invite || invite.kind !== kind) throw new Error(INVITE_ERROR);
  const now = new Date();
  const claimed = await tx.inviteCode.updateMany({ where: { id: invite.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } }, data: { usedAt: now, usedById: userId } });
  if (claimed.count !== 1) throw new Error(INVITE_ERROR);
  if (kind === "STUDENT") {
    const linked = await tx.student.updateMany({ where: { id: invite.studentId, userId: null }, data: { userId } });
    if (linked.count !== 1) throw new Error(INVITE_ERROR);
    await tx.user.update({ where: { id: userId }, data: { name: invite.student.name } });
  } else {
    if (!["ANNE", "BABA", "VELI"].includes(invite.yakinlik ?? "")) throw new Error(INVITE_ERROR);
    if (await tx.studentParent.findFirst({ where: { studentId: invite.studentId, OR: [{ parentId: userId }, ...(invite.yakinlik === "VELI" ? [] : [{ yakinlik: invite.yakinlik! }])] } })) throw new Error(INVITE_ERROR);
    await tx.studentParent.create({ data: { studentId: invite.studentId, parentId: userId, yakinlik: invite.yakinlik! } });
  }
  return invite;
}
