import AbsenceList from "@/components/AbsenceList";
import { CalendarX } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/auth";


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
        <p className="text-[13px] text-slate-600">
          Öğretmeninin girdiği devamsızlık kayıtları — salt-okunur.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
            <CalendarX size={14}  className="text-birikim" /> Devamsızlıklar
          </div>
          <span
            className="text-[13px] text-white rounded-full px-2 py-0.5 bg-birikim"

          >
            Toplam {absences.length} gün
          </span>
        </div>

        <AbsenceList absences={absences.map((a) => ({ ...a, date: a.date.toISOString() }))} />
      </div>
    </div>
  );
}
