import { CalendarX } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/auth";
import { RED, formatDate } from "@/lib/constants";

/** Salt-okunur devamsızlık listesi. Öğrenci bu veriyi hiçbir koşulda değiştiremez. */
export default async function OgrenciDevamsizlikPage() {
  const { student } = await requireStudentProfile();

  const absences = await prisma.absence.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-5">
        <div className="text-[18px] font-bold text-slate-800">Devamsızlığım</div>
        <p className="text-[12px] text-slate-400">
          Öğretmeninin girdiği devamsızlık kayıtları — salt-okunur.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
            <CalendarX size={14} style={{ color: RED }} /> Devamsızlıklar
          </div>
          <span
            className="text-[11px] text-white rounded-full px-2 py-0.5"
            style={{ background: RED }}
          >
            Toplam {absences.length} gün
          </span>
        </div>

        {absences.length === 0 ? (
          <div className="text-[12px] text-slate-400 py-8 text-center">
            Henüz devamsızlık kaydın yok.
          </div>
        ) : (
          <div className="space-y-1.5">
            {absences.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-[12px] text-slate-600 bg-slate-50 rounded-lg px-3 py-2"
              >
                <span>{formatDate(a.date)}</span>
                <span className="text-slate-400">{a.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
