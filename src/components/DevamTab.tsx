import { FeedbackForm } from "@/components/ui/feedback";
import AbsenceList from "./AbsenceList";

import { CalendarX } from "lucide-react";

import { addAbsence } from "@/actions/absences";


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
      <FeedbackForm
        action={addAbsence}
        className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 h-fit"
      >
        <div className="text-[13px] font-semibold text-slate-700 mb-1">
          Devamsızlık Kaydet
        </div>
        <input type="hidden" name="studentId" value={studentId} />
        <input
          required
          aria-label="Devamsızlık tarihi" type="date"
          name="date"
          className="w-full text-[13px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none"
        />
        <input aria-label="Sebep"
          name="reason"
          placeholder="Sebep"
          className="w-full text-[13px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none"
        />
        <button
          type="submit"
          className="w-full text-[13px] text-white rounded-md py-1.5 bg-birikim"

        >
          Kaydet
        </button>
      </FeedbackForm>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 mb-3">
          <CalendarX size={14}  className="text-birikim" /> Devamsızlıklar (
          {absences.length})
        </div>
        <AbsenceList absences={absences} editable />
      </div>
    </div>
  );
}
