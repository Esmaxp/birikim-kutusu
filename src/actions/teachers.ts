"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog, type AuditAction } from "@/lib/audit";

export type TeacherState = { error?: string; password?: string; message?: string };
const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
function temporaryPassword() {
  return Array.from({ length: 14 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

export async function manageTeacher(_previous: TeacherState, data: FormData): Promise<TeacherState> {
  const actor = await requireAdmin();
  const operation = String(data.get("operation") ?? "");
  const id = String(data.get("id") ?? "");
  if (id.length > 100 || !["create", "reset", "disable", "enable", "update"].includes(operation)) return { error: "Geçersiz işlem." };
  let password: string | undefined;
  let entityId = id;
  let action: AuditAction;
  try {
    await prisma.$transaction(async (tx) => {
      // Recheck inside the write transaction to serialize concurrent admin changes.
      const administrator = await tx.user.findUnique({ where: { id: actor.id } });
      if (!administrator?.isAdmin || administrator.role !== "TEACHER" || administrator.disabledAt || administrator.mustChangePassword) throw new Error("Yetkiniz bulunmuyor.");
      if (operation === "create") {
        const name = String(data.get("name") ?? "").trim();
        const email = String(data.get("email") ?? "").trim().toLowerCase();
        const title = String(data.get("title") ?? "").trim();
        if (name.length < 3 || name.length > 150 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || title.length > 100) throw new Error("Ad, e-posta ve unvan bilgilerini kontrol edin.");
        if (await tx.user.findUnique({ where: { email } })) throw new Error("Bu e-posta adresi zaten kullanılıyor.");
        password = temporaryPassword();
        const teacher = await tx.user.create({ data: { name, email, title: title || null, role: "TEACHER", isAdmin: data.get("isAdmin") === "on", mustChangePassword: true, passwordHash: await hashPassword(password) } });
        entityId = teacher.id;
        action = "TEACHER_CREATE";
        return;
      }
      const target = await tx.user.findUnique({ where: { id } });
      if (!target || target.role !== "TEACHER") throw new Error("Öğretmen bulunamadı.");
      const demoting = operation === "update" && data.get("isAdmin") !== "on";
      if (operation === "disable" || demoting) {
        if (id === actor.id) throw new Error("Kendi yönetici yetkinizi kaldıramaz veya hesabınızı kapatamazsınız.");
        if (target.isAdmin && !target.disabledAt && await tx.user.count({ where: { role: "TEACHER", isAdmin: true, disabledAt: null } }) <= 1) throw new Error("Son etkin yönetici kaldırılamaz.");
      }
      if (operation === "reset") {
        password = temporaryPassword();
        await tx.user.update({ where: { id }, data: { passwordHash: await hashPassword(password), mustChangePassword: true } });
        await tx.session.deleteMany({ where: { userId: id } });
        action = "PASSWORD_RESET_BY_ADMIN";
      } else if (operation === "update") {
        await tx.user.update({ where: { id }, data: { isAdmin: data.get("isAdmin") === "on" } });
        action = "TEACHER_UPDATE";
      } else {
        await tx.user.update({ where: { id }, data: { disabledAt: operation === "disable" ? new Date() : null } });
        if (operation === "disable") await tx.session.deleteMany({ where: { userId: id } });
        action = operation === "disable" ? "TEACHER_DISABLE" : "TEACHER_ENABLE";
      }
    });
  } catch (error) {
    return { error: error instanceof Error && !error.message.includes("prisma") ? error.message : "İşlem tamamlanamadı. Lütfen tekrar deneyin." };
  }
  await writeAuditLog({ actorId: actor.id, action: action!, entityType: "User", entityId });
  revalidatePath("/ogretmen/yonetim/ogretmenler");
  return { password, message: "İşlem tamamlandı." };
}
