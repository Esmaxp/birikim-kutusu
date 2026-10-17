import Link from "next/link";
import { FileText, LayoutDashboard } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/auth";
import { formatDate } from "@/lib/constants";
import ExamSessionPuanChart from "@/components/ExamSessionPuanChart";

export default async function OgrenciDenemeAnaliziPage() {
  const { student } = await requireStudentProfile();

  const examSessions = await prisma.examSession.findMany({
    where: { studentId: student.id, visibleToStudent: true },
    orderBy: { sinavTarihi: "desc" },
    select: {
      id: true,
      sinavAdi: true,
      sinavTarihi: true,
      toplamNet: true,
      puan: true,
      yuzdelikDilim: true,
    },
  });

  const puanSeries = [...examSessions]
    .filter((e) => e.puan !== null)
    .sort((a, b) => a.sinavTarihi.getTime() - b.sinavTarihi.getTime())
    .map((e) => ({ ad: e.sinavAdi, puan: e.puan as number }));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <div>
        <div className="text-[18px] font-bold text-slate-800">Deneme Analizim</div>
        <p className="text-[13px] text-slate-600">
          Öğretmenin girdiği sınav sonuçlarının analizi.
        </p>
      </div>

      {puanSeries.length >= 2 && <ExamSessionPuanChart data={puanSeries} />}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 mb-3">
          <LayoutDashboard size={14}  className="text-birikim" /> Deneme Analizleri (
          {examSessions.length})
        </div>

        {examSessions.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-10 text-center">
            <FileText size={30} className="mx-auto mb-3 text-slate-600" />
            <div className="text-[14px] font-semibold text-slate-600">
              Henüz deneme analizi yayınlanmadı
            </div>
            <p className="text-[13px] text-slate-600 mt-1 max-w-sm mx-auto">
              Öğretmenin sınav sonuçlarını sisteme girmesinin ardından analizin
              burada görünecek.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {examSessions.map((e) => (
              <Link
                key={e.id}
                href={`/ogrenci/deneme-analizi/${e.id}`}
                className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-slate-700 truncate">
                    {e.sinavAdi}
                  </div>
                  <div className="text-[13px] text-slate-600">
                    {formatDate(e.sinavTarihi)}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[13px] text-slate-600 shrink-0">
                  <div className="text-center">
                    <div className="font-semibold text-slate-700">{e.toplamNet ?? "-"}</div>
                    <div>Net</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-700">{e.puan ?? "-"}</div>
                    <div>Puan</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-700">
                      {e.yuzdelikDilim ?? "-"}
                    </div>
                    <div>Yüzdelik</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
