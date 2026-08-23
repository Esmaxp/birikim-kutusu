import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireStudentProfile } from "@/lib/auth";
import { getExamSession } from "@/lib/exam-session";
import ExamSessionView from "@/components/ExamSessionView";

export default async function OgrenciDenemeDetayPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { student } = await requireStudentProfile();
  const { examId } = await params;

  const exam = await getExamSession(examId);
  if (!exam || exam.studentId !== student.id || !exam.visibleToStudent) notFound();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <Link
        href="/ogrenci/deneme-analizi"
        className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-700 w-fit"
      >
        <ArrowLeft size={13} /> Deneme listesine dön
      </Link>

      <ExamSessionView data={exam} canConfirmAsStudent />
    </div>
  );
}
