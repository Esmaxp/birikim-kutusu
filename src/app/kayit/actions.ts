"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, requireUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { roleBySlug } from "@/lib/auth-roles";
import { writeAuditLog } from "@/lib/audit";
import { REGISTER_LIMIT, REGISTER_WINDOW_MS, rateLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { INVITE_ERROR, redeemInvite } from "@/lib/invite";

export type RegisterState = { error?: string; message?: string };
async function allowAttempt(email: string) {
  const ip = getClientIp(await headers());
  const account = await rateLimiter.check(`redeem:email:${email}`, REGISTER_LIMIT, REGISTER_WINDOW_MS);
  const address = ip ? await rateLimiter.check(`redeem:ip:${ip}`, REGISTER_LIMIT * 3, REGISTER_WINDOW_MS) : null;
  return account.allowed && (!address || address.allowed);
}
export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const role = roleBySlug(String(formData.get("rol") ?? ""));
  if (!role?.registerEnabled || !["STUDENT", "PARENT"].includes(role.key)) return { error: "Geçersiz kayıt türü." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !await allowAttempt(email)) return { error: INVITE_ERROR };
  const password = String(formData.get("password") ?? "");
  const codes = formData.getAll("inviteCode").map(String);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || Buffer.byteLength(password) > 72 || password !== formData.get("password2")) return { error: "E-posta adresini ve en az 8 karakterlik eşleşen şifrelerinizi kontrol edin." };
  if (!codes.length || codes.length > 20 || (role.key === "STUDENT" && codes.length !== 1) || codes.some((c) => !c.trim() || c.length > 100)) return { error: INVITE_ERROR };
  const passwordHash = await hashPassword(password);
  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash, name: email.split("@")[0], role: role.key } });
      const invites = [];
      for (const code of codes) invites.push(await redeemInvite(tx, code, role.key as "STUDENT" | "PARENT", user.id));
      return { userId: user.id, invites };
    });
  } catch { return { error: INVITE_ERROR }; }
  for (const invite of result.invites) await writeAuditLog({ actorId: result.userId, action: "INVITE_REDEEM", entityType: "InviteCode", entityId: invite.id, studentId: invite.studentId });
  await writeAuditLog({ actorId: result.userId, action: "USER_REGISTER", entityType: "User", entityId: result.userId, meta: { role: role.key } });
  revalidatePath("/ogretmen/yonetim/davet-kodlari");
  await createSession(result.userId);
  redirect(ROLE_HOME[role.key] ?? "/");
}
export async function linkChildWithCode(_prev: RegisterState, data: FormData): Promise<RegisterState> {
  const user = await requireUser(["PARENT"]);
  if (!await allowAttempt(user.email)) return { error: INVITE_ERROR };
  const code = String(data.get("inviteCode") ?? "");
  if (code.length > 100) return { error: INVITE_ERROR };
  let invite;
  try { invite = await prisma.$transaction((tx) => redeemInvite(tx, code, "PARENT", user.id)); }
  catch { return { error: INVITE_ERROR }; }
  await writeAuditLog({ actorId: user.id, action: "INVITE_REDEEM", entityType: "InviteCode", entityId: invite.id, studentId: invite.studentId });
  revalidatePath("/veli");
  revalidatePath("/ogretmen/yonetim/davet-kodlari");
  return { message: "Çocuğunuz hesabınıza bağlandı." };
}
