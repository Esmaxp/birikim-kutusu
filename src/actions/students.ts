"use server";

import { requireUploadUrl } from "@/lib/upload-url";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { assertCanAccessStudent, requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

/**
 * Öğrenci fotoğrafını günceller. URL yalnızca /api/upload'ın ürettiği
 * biçimde kabul edilir; keyfi harici adresler reddedilir.
 */
export async function updateStudentPhoto(studentId: string, photoUrl: string | null) {
  const user = await requireUser(["TEACHER"]);
  await assertCanAccessStudent(user, studentId);

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Öğrenci bulunamadı.");

  const url =
    requireUploadUrl(photoUrl, "image");

  await prisma.student.update({
    where: { id: studentId },
    data: { photoUrl: url },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "STUDENT_PHOTO_UPDATE",
    entityType: "Student",
    entityId: studentId,
    studentId,
    meta: { photoUrl: url },
  });

  revalidatePath("/ogretmen", "layout");
  revalidatePath("/ogrenci", "layout");
  revalidatePath("/veli", "layout");
}
