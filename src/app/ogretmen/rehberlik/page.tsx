import Link from "next/link";
import { StickyNote } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { RED, formatDateTime } from "@/lib/constants";
import Avatar from "@/components/Avatar";
import RehberlikNoteForm from "./RehberlikNoteForm";
import { deleteNote } from "@/actions/notes";

export default async function RehberlikPage({
  searchParams,
}: {
  searchParams: Promise<{ sube?: string; ogrenci?: string }>;
}) {
  const user = await requireUser(["TEACHER"]);
  const sp = await searchParams;

  const classes = await prisma.schoolClass.findMany({ orderBy: { order: "asc" } });
  const subeAdi = sp.sube ?? classes[0]?.name;

  const students = subeAdi
    ? await prisma.student.findMany({
        where: { class: { name: subeAdi } },
        orderBy: { no: "asc" },
      })
    : [];

  const selectedId = sp.ogrenci ?? null;
  const selected = selectedId
    ? students.find((s) => s.id === selectedId) ?? null
    : null;

  const notes = selected
    ? await prisma.note.findMany({
        where: { studentId: selected.id },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true, title: true } } },
      })
    : [];

  const base = (params: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    if (params.sube) usp.set("sube", params.sube);
    if (params.ogrenci) usp.set("ogrenci", params.ogrenci);
    const q = usp.toString();
    return "/ogretmen/rehberlik" + (q ? `?${q}` : "");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <div>
        <div className="text-[18px] font-bold text-slate-800">Rehberlik</div>
        <p className="text-[12px] text-slate-400">
          Şube ve öğrenci seçip görüşme notu yazın; notun tüm geçmişi sağda listelenir.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {classes.map((c) => {
          const active = c.name === subeAdi;
          return (
            <Link
              key={c.id}
              href={base({ sube: c.name })}
              className={
                "text-[12px] px-3 py-1.5 rounded-full border " +
                (active
                  ? "text-white border-transparent"
                  : "text-slate-600 border-slate-200 bg-white")
              }
              style={active ? { background: RED } : undefined}
            >
              {c.name}
            </Link>
          );
        })}
      </div>

      <div className="flex gap-5 items-start flex-col lg:flex-row">
        <div className="flex-1 min-w-0 w-full">
          <div className="text-[15px] font-semibold text-slate-700 mb-3">
            {subeAdi} Şubesi
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {students.map((s) => {
              const active = s.id === selectedId;
              return (
                <Link
                  key={s.id}
                  href={base({ sube: subeAdi, ogrenci: s.id })}
                  className={
                    "bg-white rounded-xl border p-3 flex flex-col items-center gap-2 hover:shadow-sm " +
                    (active ? "" : "border-slate-200")
                  }
                  style={
                    active
                      ? { borderColor: RED, boxShadow: `0 0 0 1px ${RED}` }
                      : undefined
                  }
                >
                  <Avatar name={s.name} size={48} />
                  <div className="text-[12px] font-semibold text-slate-700 text-center leading-tight">
                    {s.name}
                  </div>
                  <div className="text-[11px] text-slate-400">No: {s.no}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {selected && (
          <div className="w-full lg:w-[380px] shrink-0 space-y-4">
            <RehberlikNoteForm
              studentId={selected.id}
              studentName={selected.name}
            />

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <StickyNote size={14} style={{ color: RED }} /> Not Geçmişi (
                {notes.length})
              </div>
              {notes.length === 0 ? (
                <div className="text-[12px] text-slate-400">
                  Bu öğrenci için not yok.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {notes.map((n) => (
                    <div key={n.id} className="bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-medium text-slate-700">
                          {n.title ?? "Not"}
                        </span>
                        {n.authorId === user.id && (
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
                          {n.author?.name ?? "-"} ·{" "}
                          {n.author?.title ?? "Öğretmen"} ·{" "}
                          {formatDateTime(n.createdAt)}
                        </span>
                        <span
                          className={
                            "text-[10px] " +
                            (n.visibleToStudent
                              ? "text-green-600"
                              : "text-slate-400")
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
        )}
      </div>
    </div>
  );
}
