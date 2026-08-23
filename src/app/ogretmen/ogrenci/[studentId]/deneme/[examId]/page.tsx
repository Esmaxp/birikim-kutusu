import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { assertCanAccessStudent, requireUser } from "@/lib/auth";
import {
  emptyExamSessionInput,
  getExamSession,
  toExamSessionInput,
} from "@/lib/exam-session";
import ExamSessionForm from "@/components/ExamSessionForm";

export default async function ExamSessionPage({
  params,
}: {
  params: Promise<{ studentId: string; examId: string }>;
}) {
  const user = await requireUser(["TEACHER"]);
  const { studentId, examId } = await params;
  await assertCanAccessStudent(user, studentId);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true },
  });
  if (!student) notFound();

  const danismanlar = await prisma.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, title: true },
  });

  const isNew = examId === "yeni";
  const existing = isNew ? null : await getExamSession(examId);
  if (!isNew && (!existing || existing.studentId !== studentId)) notFound();

  const initialData = existing
    ? toExamSessionInput(existing)
    : emptyExamSessionInput(user.id);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <ExamSessionForm
        key={examId}
        studentId={studentId}
        examId={isNew ? null : examId}
        student={{
          id: student.id,
          name: student.name,
          no: student.no,
          sube: student.class.name,
          photoUrl: student.photoUrl,
        }}
        initialData={initialData}
        danismanlar={danismanlar}
        confirm={
          existing
            ? {
                ogrenciOnayAt: existing.ogrenciOnayAt,
                ogrenciAdi: existing.student.name,
                rehberOnayAt: existing.rehberOnayAt,
                rehberAdi: existing.danismanAdi,
              }
            : null
        }
      />
    </div>
  );
}
