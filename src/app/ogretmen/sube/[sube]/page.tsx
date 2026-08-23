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
    include: { students: { orderBy: { no: "asc" } } },
  });
  if (!schoolClass) notFound();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-[15px] font-semibold text-slate-700 mb-4">
        {subeAdi} Şubesi Öğrenci Listesi
      </div>
      <p className="text-[12px] text-slate-400 mb-3">
        Devamsızlık, deneme analizi, rehberlik ve kitap köşesi kayıtları için
        bir öğrenci seçin.
      </p>

      <StudentGrid
        students={schoolClass.students}
        hrefFor={(id) => `/ogretmen/ogrenci/${id}`}
      />
    </div>
  );
}
