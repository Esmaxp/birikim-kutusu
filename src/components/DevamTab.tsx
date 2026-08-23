import { CalendarX, X } from "lucide-react";

import { addAbsence, deleteAbsence } from "@/actions/absences";
import { RED, formatDate } from "@/lib/constants";

export type TabAbsence = { id: string; date: string; reason: string };

/** Devamsızlık sekmesi: TeacherStudentPanel'deki form + liste mantığının taşınmış hali. */
export default function DevamTab({
  studentId,
  absences,
}: {
  studentId: string;
  absences: TabAbsence[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
      <form
        action={addAbsence}
        className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 h-fit"
      >
        <div className="text-[13px] font-semibold text-slate-700 mb-1">
          Devamsızlık Kaydet
        </div>
        <input type="hidden" name="studentId" value={studentId} />
        <input
          required
          type="date"
          name="date"
          className="w-full text-[12px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none"
        />
        <input
          name="reason"
          placeholder="Sebep"
          className="w-full text-[12px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none"
        />
        <button
          type="submit"
          className="w-full text-[12px] text-white rounded-md py-1.5"
          style={{ background: RED }}
        >
          Kaydet
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 mb-3">
          <CalendarX size={14} style={{ color: RED }} /> Devamsızlıklar (
          {absences.length})
        </div>
        {absences.length === 0 ? (
          <div className="text-[12px] text-slate-400">Kayıt yok.</div>
        ) : (
          <div className="space-y-1.5">
            {absences.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-[12px] text-slate-600 bg-slate-50 rounded-lg px-3 py-2"
              >
                <span>
                  {formatDate(a.date)} · {a.reason}
                </span>
                <form action={deleteAbsence.bind(null, a.id)}>
                  <button className="text-slate-300 hover:text-red-500">
                    <X size={13} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
