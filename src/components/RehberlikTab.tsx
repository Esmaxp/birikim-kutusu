import NoteTimeline from "./NoteTimeline";

import { StickyNote } from "lucide-react";



import RehberlikNoteForm from "@/app/ogretmen/rehberlik/RehberlikNoteForm";

export type TabNote = {
  id: string;
  title: string | null;
  body: string;
  authorName: string;
  authorTitle: string | null;
  createdAt: string;
  visibleToStudent: boolean;
  canDelete: boolean;
};

/** Rehberlik sekmesi: mevcut RehberlikNoteForm + not geçmişi listesi (rehberlik/page.tsx ile aynı desen). */
export default function RehberlikTab({
  studentId,
  studentName,
  notes,
}: {
  studentId: string;
  studentName: string;
  notes: TabNote[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
      <RehberlikNoteForm studentId={studentId} studentName={studentName} />

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
          <StickyNote size={14}  className="text-birikim" /> Not Geçmişi ({notes.length})
        </div>
        <NoteTimeline notes={notes} />
      </div>
    </div>
  );
}
