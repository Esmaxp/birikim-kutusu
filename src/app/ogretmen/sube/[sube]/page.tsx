import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import StudentGrid from "@/components/StudentGrid";

type Props = {
  params: Promise<{ sube: string }>;
};

export default async function SubePage({ params }: Props) {
  await requireUser(["TEACHER"]);
  const { sube } = await params;

  const subeAdi = decodeURIComponent(sube);

  const schoolClass = await prisma.schoolClass.findUnique({
    where: { name: subeAdi },
    include: { students: { orderBy: { no: "asc" }, include: { _count: { select: { absences: true } }, examSessions: { take: 2, orderBy: { sinavTarihi: "desc" }, select: { toplamNet: true } } } } },
  });
  if (!schoolClass) notFound();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-[15px] font-semibold text-slate-700 mb-4">
        {subeAdi} Şubesi Öğrenci Listesi
      </div>
      <p className="text-[13px] text-slate-600 mb-3">
        Devamsızlık, deneme analizi, rehberlik ve kitap köşesi kayıtları için
        bir öğrenci seçin.
      </p>

      <StudentGrid
        students={schoolClass.students.map((s) => ({ ...s, sinif: subeAdi, absenceCount: s._count.absences, latestNet: s.examSessions[0]?.toplamNet, netDelta: s.examSessions[0]?.toplamNet != null && s.examSessions[1]?.toplamNet != null ? s.examSessions[0].toplamNet - s.examSessions[1].toplamNet : null }))}
        hrefFor={(id) => `/ogretmen/ogrenci/${id}`}
      />
    </div>
  );
}
