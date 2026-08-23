import { HeartHandshake, StickyNote } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/auth";
import { RED, formatDateTime } from "@/lib/constants";
import MarkNotesRead from "./MarkNotesRead";

export default async function PdrNotlariPage() {
  const { student } = await requireStudentProfile();

  const notes = await prisma.note.findMany({
    where: { studentId: student.id, visibleToStudent: true },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, title: true } } },
  });

  const okunmamis = notes.filter((n) => !n.readAt).map((n) => n.id);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <MarkNotesRead noteIds={okunmamis} />

      <div className="mb-5">
        <div className="text-[18px] font-bold text-slate-800">
          PDR Öğretmenimden Notlar
        </div>
        <p className="text-[12px] text-slate-400">
          Rehberlik servisinin ve öğretmenlerinin seninle paylaştığı notlar.
        </p>
      </div>

      {notes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <StickyNote size={30} className="mx-auto mb-3 text-slate-300" />
          <div className="text-[14px] font-semibold text-slate-600">
            Henüz not yok
          </div>
          <p className="text-[12px] text-slate-400 mt-1">
            PDR öğretmenin seninle bir not paylaştığında burada görünecek.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <article
              key={n.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
              style={!n.readAt ? { borderColor: RED } : undefined}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ background: RED }}
                  >
                    <HeartHandshake size={15} />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[13px] font-semibold text-slate-700">
                      {n.title ?? "Not"}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {n.author?.name ?? "Bilinmiyor"} ·{" "}
                      {n.author?.title ?? "Öğretmen"}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-400">
                    {formatDateTime(n.createdAt)}
                  </div>
                  {!n.readAt && (
                    <span
                      className="text-[10px] text-white rounded-full px-2 py-0.5 inline-block mt-1"
                      style={{ background: RED }}
                    >
                      Yeni
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                {n.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
