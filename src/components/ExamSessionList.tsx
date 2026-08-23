import Link from "next/link";
import { LayoutDashboard, Plus } from "lucide-react";

import { RED, formatDate } from "@/lib/constants";

export type TabExamSession = {
  id: string;
  sinavAdi: string;
  sinavTarihi: string;
  toplamNet: number | null;
  puan: number | null;
  yuzdelikDilim: number | null;
};

/** Deneme Analizi sekmesi: öğrencinin ExamSession kayıtları, en yeniden en eskiye. */
export default function ExamSessionList({
  basePath,
  examSessions,
}: {
  basePath: string;
  examSessions: TabExamSession[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
          <LayoutDashboard size={14} style={{ color: RED }} /> Deneme Analizleri (
          {examSessions.length})
        </div>
        <Link
          href={`${basePath}/yeni`}
          className="flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg"
          style={{ background: RED }}
        >
          <Plus size={13} /> Yeni Analiz
        </Link>
      </div>

      {examSessions.length === 0 ? (
        <div className="text-[12px] text-slate-400 py-6 text-center">
          Henüz deneme analizi kaydı yok.
        </div>
      ) : (
        <div className="space-y-2">
          {examSessions.map((e) => (
            <Link
              key={e.id}
              href={`${basePath}/${e.id}`}
              className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-slate-700 truncate">
                  {e.sinavAdi}
                </div>
                <div className="text-[11px] text-slate-400">
                  {formatDate(e.sinavTarihi)}
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 shrink-0">
                <div className="text-center">
                  <div className="font-semibold text-slate-700">
                    {e.toplamNet ?? "-"}
                  </div>
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
  );
}
