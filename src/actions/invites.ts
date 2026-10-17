"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInviteCode, hashInviteCode, INVITE_EXPIRY_DAYS } from "@/lib/invite";
import { writeAuditLog } from "@/lib/audit";

export type InviteSlip = { id: string; code: string; name: string; role: string; expiresAt: string; slug: string };
export type InviteState = { error?: string; slips?: InviteSlip[]; message?: string };
const relationships = ["STUDENT", "ANNE", "BABA", "VELI"];
export async function manageInvites(_state: InviteState, data: FormData): Promise<InviteState> {
  const actor = await requireUser(["TEACHER"]);
  const operation = String(data.get("operation") ?? "");
  const studentId = String(data.get("studentId") ?? "");
  const classId = String(data.get("classId") ?? "");
  const relation = String(data.get("relation") ?? "");
  const id = String(data.get("id") ?? "");
  if ([studentId, classId, id].some((v) => v.length > 100) || !["create", "bulk", "revoke"].includes(operation)) return { error: "Geçersiz işlem." };
  if (operation === "revoke") {
    const result = await prisma.inviteCode.updateMany({ where: { id, usedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
    if (!result.count) return { error: "Kod iptal edilemedi." };
    await writeAuditLog({ actorId: actor.id, action: "INVITE_REVOKE", entityType: "InviteCode", entityId: id });
    revalidatePath("/ogretmen/yonetim/davet-kodlari");
    return { message: "Kod iptal edildi." };
  }
  if (operation === "create" && !relationships.includes(relation)) return { error: "Davet türü seçin." };
  const students = await prisma.student.findMany({ where: operation === "bulk" ? { classId } : { id: studentId }, include: { parents: true } });
  if (!students.length || students.length > 500) return { error: "Öğrenci/şube bulunamadı veya şube 500 öğrenci sınırını aşıyor." };
  const slips: InviteSlip[] = [];
  const revoked: string[] = [];
  try {
    await prisma.$transaction(async (tx) => {
      for (const student of students) {
        const kinds = operation === "bulk" ? ["STUDENT", "ANNE", "BABA"] : [relation];
        for (const rel of kinds) {
          if ((rel === "STUDENT" && student.userId) || (rel !== "STUDENT" && rel !== "VELI" && student.parents.some((p) => p.yakinlik === rel))) continue;
          const kind = rel === "STUDENT" ? "STUDENT" : "PARENT";
          const yakinlik = kind === "STUDENT" ? null : rel;
          const scope = { studentId: student.id, kind, yakinlik, usedAt: null, revokedAt: null };
          if (operation === "bulk" && await tx.inviteCode.findFirst({ where: { ...scope, expiresAt: { gt: new Date() } } })) continue;
          revoked.push(...(await tx.inviteCode.findMany({ where: scope, select: { id: true } })).map((i) => i.id));
          await tx.inviteCode.updateMany({ where: scope, data: { revokedAt: new Date() } });
          const code = generateInviteCode();
          const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 86400000);
          const invite = await tx.inviteCode.create({ data: { studentId: student.id, kind, yakinlik, expiresAt, createdById: actor.id, codeHash: hashInviteCode(code) } });
          slips.push({ id: invite.id, code, name: student.name, role: rel === "STUDENT" ? "Öğrenci" : rel === "ANNE" ? "Anne" : rel === "BABA" ? "Baba" : "Diğer veli", expiresAt: expiresAt.toISOString(), slug: kind === "STUDENT" ? "ogrenci" : "veli" });
        }
      }
    }, { timeout: 30000 });
  } catch { return { error: "Kodlar oluşturulamadı. Lütfen tekrar deneyin." }; }
  for (const slip of slips) await writeAuditLog({ actorId: actor.id, action: "INVITE_CREATE", entityType: "InviteCode", entityId: slip.id });
  for (const id of revoked) await writeAuditLog({ actorId: actor.id, action: "INVITE_REVOKE", entityType: "InviteCode", entityId: id, meta: { regenerated: true } });
  revalidatePath("/ogretmen/yonetim/davet-kodlari");
  return { slips, message: slips.length ? "Kodları şimdi kopyalayın veya yazdırın; daha sonra tekrar gösterilmez." : "Eksik hesap için yeni kod gerekmiyor. Mevcut kodları tek tek yenileyebilirsiniz." };
}
