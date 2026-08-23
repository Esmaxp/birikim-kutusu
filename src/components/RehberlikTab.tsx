import { StickyNote } from "lucide-react";

import { deleteNote } from "@/actions/notes";
import { RED, formatDateTime } from "@/lib/constants";
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
          <StickyNote size={14} style={{ color: RED }} /> Not Geçmişi ({notes.length})
        </div>
        {notes.length === 0 ? (
          <div className="text-[12px] text-slate-400">Bu öğrenci için not yok.</div>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {notes.map((n) => (
              <div key={n.id} className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-slate-700">
                    {n.title ?? "Not"}
                  </span>
                  {n.canDelete && (
                    <form action={deleteNote.bind(null, n.id)}>
                      <button className="text-[11px] text-slate-400 hover:text-red-500">
                        Sil
                      </button>
                    </form>
                  )}
                </div>
                <p className="text-[12px] text-slate-500 mt-0.5 whitespace-pre-wrap">
                  {n.body}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-400">
                    {n.authorName} · {n.authorTitle ?? "Öğretmen"} ·{" "}
                    {formatDateTime(n.createdAt)}
                  </span>
                  <span
                    className={
                      "text-[10px] " +
                      (n.visibleToStudent ? "text-green-600" : "text-slate-400")
                    }
                  >
                    {n.visibleToStudent ? "Öğrenciye açık" : "Gizli"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
