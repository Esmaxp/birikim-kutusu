"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { assertCanAccessStudent, requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function addAbsence(formData: FormData) {
  const user = await requireUser(["TEACHER"]);

  const studentId = String(formData.get("studentId") ?? "");
  await assertCanAccessStudent(user, studentId);

  const dateRaw = String(formData.get("date") ?? "");
  if (!dateRaw) throw new Error("Tarih zorunludur.");

  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) throw new Error("Geçersiz tarih.");

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Öğrenci bulunamadı.");

  const reason = String(formData.get("reason") ?? "").trim();

  const absence = await prisma.absence.create({
    data: {
      studentId,
      date,
      reason: reason ? reason.slice(0, 200) : "Belirtilmedi",
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "ABSENCE_CREATE",
    entityType: "Absence",
    entityId: absence.id,
    studentId,
    meta: { date: date.toISOString(), reason: absence.reason },
  });

  revalidatePath("/ogretmen", "layout");
  revalidatePath("/ogrenci", "layout");
  revalidatePath("/veli", "layout");
}

export async function deleteAbsence(absenceId: string) {
  const user = await requireUser(["TEACHER"]);
  const absence = await prisma.absence.findUnique({ where: { id: absenceId } });
  if (!absence) throw new Error("Devamsızlık kaydı bulunamadı.");

  await assertCanAccessStudent(user, absence.studentId);
  await prisma.absence.delete({ where: { id: absenceId } });

  await writeAuditLog({
    actorId: user.id,
    action: "ABSENCE_DELETE",
    entityType: "Absence",
    entityId: absenceId,
    studentId: absence.studentId,
  });

  revalidatePath("/ogretmen", "layout");
  revalidatePath("/ogrenci", "layout");
}
