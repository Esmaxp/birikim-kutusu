"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { assertCanAccessStudent, requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

/** Öğretmen (rehber öğretmen dahil) öğrenciye not yazar. */
export async function addNote(formData: FormData) {
  const user = await requireUser(["TEACHER"]);

  const studentId = String(formData.get("studentId") ?? "");
  await assertCanAccessStudent(user, studentId);

  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Not metni boş olamaz.");

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Öğrenci bulunamadı.");

  const title = String(formData.get("title") ?? "").trim();
  // Rehberlik formunda kutu varsayılan işaretli gelir, öğretmen panelinde işaretsiz.
  const visibleToStudent = formData.get("visibleToStudent") === "on";

  const note = await prisma.note.create({
    data: {
      studentId,
      authorId: user.id,
      authorRole: user.role,
      title: title ? title.slice(0, 150) : null,
      body: body.slice(0, 5000),
      visibleToStudent,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "NOTE_CREATE",
    entityType: "Note",
    entityId: note.id,
    studentId,
    meta: { visibleToStudent, authorRole: user.role },
  });

  revalidatePath("/ogretmen", "layout");
  revalidatePath("/ogrenci", "layout");
  revalidatePath("/veli", "layout");
}

export async function deleteNote(noteId: string) {
  const user = await requireUser(["TEACHER"]);
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) throw new Error("Not bulunamadı.");

  // Herkes yalnızca kendi yazdığı notu silebilir.
  if (note.authorId !== user.id) {
    throw new Error("Yalnızca kendi yazdığınız notu silebilirsiniz.");
  }

  await assertCanAccessStudent(user, note.studentId);
  await prisma.note.delete({ where: { id: noteId } });

  await writeAuditLog({
    actorId: user.id,
    action: "NOTE_DELETE",
    entityType: "Note",
    entityId: noteId,
    studentId: note.studentId,
  });

  revalidatePath("/ogretmen", "layout");
  revalidatePath("/ogrenci", "layout");
}

/** Öğrenci notu okuduğunda okundu bilgisi işlenir. */
export async function markNoteRead(noteId: string) {
  const user = await requireUser(["STUDENT"]);
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { student: { select: { userId: true } } },
  });
  if (!note || note.student.userId !== user.id || !note.visibleToStudent) return;
  if (note.readAt) return;

  await prisma.note.update({
    where: { id: noteId },
    data: { readAt: new Date() },
  });

  revalidatePath("/ogrenci", "layout");
}
