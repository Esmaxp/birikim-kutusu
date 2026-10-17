"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, currentSessionToken, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimiter } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { ROLE_HOME } from "@/lib/constants";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/client-ip";

export async function changePassword(_state: { error?: string }, data: FormData): Promise<{ error?: string }> {
  const user = await requireUser(undefined, true);
  const limit = await rateLimiter.check(`password:${user.id}`, 10, 15 * 60 * 1000);
  const ip = getClientIp(await headers());
  const ipLimit = ip ? await rateLimiter.check(`password:ip:${ip}`, 30, 15 * 60 * 1000) : null;
  if (!limit.allowed || (ipLimit && !ipLimit.allowed)) return { error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." };
  const current = String(data.get("current") ?? "");
  const password = String(data.get("password") ?? "");
  if (!current || current.length > 72 || password.length < 8 || Buffer.byteLength(password) > 72 || password !== data.get("confirmation") || current === password) return { error: "Mevcut şifrenizi ve en az 8 karakterlik farklı yeni şifrenizi kontrol edin. Şifre tekrarları eşleşmelidir." };
  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(current, record.passwordHash))) return { error: "Mevcut şifre hatalı." };
  const token = await currentSessionToken();
  if (!token) redirect("/login");
  const passwordHash = await hashPassword(password);
  const changed = await prisma.$transaction(async (tx) => {
    const result = await tx.user.updateMany({ where: { id: user.id, passwordHash: record.passwordHash, disabledAt: null }, data: { passwordHash, mustChangePassword: false } });
    if (result.count !== 1) return false;
    await tx.session.deleteMany({ where: { userId: user.id, token: { not: token } } });
    return true;
  });
  if (!changed) return { error: "Hesabınız değişti. Yeniden giriş yapın." };
  await writeAuditLog({ actorId: user.id, action: "PASSWORD_CHANGE", entityType: "User", entityId: user.id });
  revalidatePath("/", "layout");
  redirect(ROLE_HOME[user.role] ?? "/login");
}
