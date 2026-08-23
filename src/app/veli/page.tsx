import Link from "next/link";
import { BookOpen, CalendarX, LayoutDashboard, Quote as QuoteIcon, StickyNote } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireParentChildren } from "@/lib/auth";
import { RED, formatDate, formatDateTime } from "@/lib/constants";
import Avatar from "@/components/Avatar";

export default async function VeliPage({
  searchParams,
}: {
  searchParams: Promise<{ ogrenci?: string }>;
}) {
  const { children } = await requireParentChildren();
  const sp = await searchParams;

  if (children.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="text-[14px] font-semibold text-slate-600">
            Hesabınıza bağlı öğrenci bulunamadı
          </div>
          <p className="text-[12px] text-slate-400 mt-1">
            Lütfen okul yönetimiyle iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  const student =
    children.find((c) => c.id === sp.ogrenci) ?? children[0];

  const [books, quotes, notes, absences, examSessions] = await Promise.all([
    prisma.book.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quote.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.note.findMany({
      where: { studentId: student.id, visibleToStudent: true },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true, title: true } } },
    }),
    prisma.absence.findMany({
      where: { studentId: student.id },
      orderBy: { date: "desc" },
    }),
    prisma.examSession.findMany({
      where: { studentId: student.id, visibleToStudent: true },
      orderBy: { sinavTarihi: "desc" },
      select: {
        id: true,
        sinavAdi: true,
        sinavTarihi: true,
        toplamNet: true,
        puan: true,
        yuzdelikDilim: true,
      },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((c) => {
            const active = c.id === student.id;
            return (
              <Link
                key={c.id}
                href={`/veli?ogrenci=${c.id}`}
                className={
                  "flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border " +
                  (active
                    ? "border-transparent text-white"
                    : "border-slate-200 text-slate-600 bg-white")
                }
                style={active ? { background: RED } : undefined}
              >
                <Avatar name={c.name} size={22} />
                <span className="text-[12px]">{c.name}</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
        <Avatar name={student.name} size={48} />
        <div>
          <div className="text-[15px] font-semibold text-slate-800">
            {student.name}
          </div>
          <div className="text-[12px] text-slate-400">
            {student.class.name} · No: {student.no} · {absences.length}{" "}
            devamsızlık
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
          <LayoutDashboard size={14} style={{ color: RED }} /> Deneme Analizleri (
          {examSessions.length})
        </div>
        {examSessions.length === 0 ? (
          <div className="text-[12px] text-slate-400">
            Henüz deneme analizi yayınlanmadı.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {examSessions.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-slate-700 truncate">
                    {e.sinavAdi}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {formatDate(e.sinavTarihi)}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
                  <span>Net: {e.toplamNet ?? "-"}</span>
                  <span>Puan: {e.puan ?? "-"}</span>
                  <span>Yüzdelik: {e.yuzdelikDilim ?? "-"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <BookOpen size={14} style={{ color: RED }} /> Kitap Köşesi (
            {books.length})
          </div>
          {books.length === 0 ? (
            <div className="text-[12px] text-slate-400">Kitap eklenmemiş.</div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {books.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-slate-700 truncate">
                      {b.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {b.author ?? "-"}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5 shrink-0">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <QuoteIcon size={14} style={{ color: RED }} /> Beğendiği Sözler
          </div>
          {quotes.length === 0 ? (
            <div className="text-[12px] text-slate-400">Söz kaydedilmemiş.</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {quotes.map((q) => (
                <div key={q.id} className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[12px] text-slate-600 italic">“{q.text}”</p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {q.source ?? "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <StickyNote size={14} style={{ color: RED }} /> Paylaşılan Notlar
          </div>
          {notes.length === 0 ? (
            <div className="text-[12px] text-slate-400">Not yok.</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notes.map((n) => (
                <div key={n.id} className="bg-slate-50 rounded-lg px-3 py-2">
                  <div className="text-[12px] font-medium text-slate-700">
                    {n.title ?? "Not"}
                  </div>
                  <p className="text-[12px] text-slate-500 whitespace-pre-wrap">
                    {n.body}
                  </p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {n.author?.name ?? "-"} ·{" "}
                    {n.author?.title ?? "Öğretmen"} ·{" "}
                    {formatDateTime(n.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <CalendarX size={14} style={{ color: RED }} /> Devamsızlıklar
          </div>
          {absences.length === 0 ? (
            <div className="text-[12px] text-slate-400">Devamsızlık yok.</div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {absences.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-[12px] bg-slate-50 rounded-lg px-3 py-2"
                >
                  <span className="text-slate-600">{formatDate(a.date)}</span>
                  <span className="text-slate-400">{a.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
