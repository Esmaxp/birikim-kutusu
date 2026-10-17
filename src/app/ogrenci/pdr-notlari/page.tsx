import NoteTimeline from "@/components/NoteTimeline";


import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/auth";

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
        <p className="text-[13px] text-slate-600">
          Rehberlik servisinin ve öğretmenlerinin seninle paylaştığı notlar.
        </p>
      </div>

      <NoteTimeline notes={notes.map((n) => ({ id: n.id, title: n.title, body: n.body, createdAt: n.createdAt.toISOString(), authorName: n.author?.name ?? "Öğretmen", authorTitle: n.author?.title ?? null, isNew: !n.readAt }))} />
    </div>
  );
}
