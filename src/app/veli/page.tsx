import { NetTrend } from "@/components/ExamProgressCharts";
import { PageHeader, StatCard } from "@/components/ui";
import LinkChildForm from "./LinkChildForm";
import Link from "next/link";
import { BookOpen, CalendarX, LayoutDashboard, Quote as QuoteIcon, StickyNote } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireParentChildren } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/constants";
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
      <div className="max-w-3xl mx-auto p-6"><LinkChildForm />
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="text-[14px] font-semibold text-slate-600">
            HesabÄ±nÄ±za baÄŸlÄ± Ã¶ÄŸrenci bulunamadÄ±
          </div>
          <p className="text-[13px] text-slate-600 mt-1">
            LÃ¼tfen okul yÃ¶netimiyle iletiÅŸime geÃ§in.
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
    <div className="max-w-5xl mx-auto p-6 space-y-5"><PageHeader title="Ã‡ocuÄŸumun geliÅŸimi" subtitle="Okuldan gÃ¼ncel haberler ve geliÅŸim Ã¶zeti" />
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {children.map((c) => {
            const active = c.id === student.id;
            return (
              <Link
                key={c.id}
                href={`/veli?ogrenci=${c.id}`}
                className={
                  "flex shrink-0 items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border " +
                  (active
                    ? "border-transparent text-white bg-birikim"
                    : "border-slate-200 text-slate-600 bg-white")
                }
                aria-current={active ? "page" : undefined}
              >
                <Avatar name={c.name} size={32} />
                <span className="text-[13px]">{c.name}</span>
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
          <div className="text-[13px] text-slate-600">
            {student.class.name} Â· No: {student.no} Â· {absences.length}{" "}
            devamsÄ±zlÄ±k
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Okunan kitap" value={books.filter((b) => b.status === "Okundu").length} icon={BookOpen} />
        <StatCard label="Son deneme neti" value={examSessions[0]?.toplamNet?.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) ?? "â€”"} icon={LayoutDashboard} />
        <StatCard label="DevamsÄ±zlÄ±k" value={`${absences.length} gÃ¼n`} icon={CalendarX} />
        <StatCard label="Yeni notlar" value={notes.filter((n) => !n.readAt).length} icon={StickyNote} />
      </div>
      <NetTrend data={[...examSessions].reverse().filter((e) => e.toplamNet !== null).map((e) => ({ ad: e.sinavAdi, net: e.toplamNet! }))} />
      <details className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-medium">BaÅŸka bir Ã§ocuÄŸumu ekle</summary><div className="mt-4"><LinkChildForm /></div></details>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
          <LayoutDashboard size={14}  className="text-birikim" /> Deneme Analizleri (
          {examSessions.length})
        </div>
        {examSessions.length === 0 ? (
          <div className="text-[13px] text-slate-600">
            HenÃ¼z deneme analizi yayÄ±nlanmadÄ±.
          </div>
        ) : (
          <div tabIndex={0} role="region" aria-label="KayÄ±t listesi" className="space-y-1.5 max-h-64 overflow-y-auto">
            {examSessions.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-slate-700 truncate">
                    {e.sinavAdi}
                  </div>
                  <div className="text-[13px] text-slate-600">
                    {formatDate(e.sinavTarihi)}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-slate-600 shrink-0">
                  <span>Net: {e.toplamNet ?? "-"}</span>
                  <span>Puan: {e.puan ?? "-"}</span>
                  <span>YÃ¼zdelik: {e.yuzdelikDilim ?? "-"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <BookOpen size={14}  className="text-birikim" /> Kitap KÃ¶ÅŸesi (
            {books.length})
          </div>
          {books.length === 0 ? (
            <div className="text-[13px] text-slate-600">Kitap eklenmemiÅŸ.</div>
          ) : (
            <div tabIndex={0} role="region" aria-label="KayÄ±t listesi" className="space-y-1.5 max-h-64 overflow-y-auto">
              {books.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-slate-700 truncate">
                      {b.title}
                    </div>
                    <div className="text-[13px] text-slate-600 truncate">
                      {b.author ?? "-"}
                    </div>
                  </div>
                  <span className="text-[13px] text-slate-600 bg-white border border-slate-200 rounded-full px-2 py-0.5 shrink-0">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <QuoteIcon size={14}  className="text-birikim" /> BeÄŸendiÄŸi SÃ¶zler
          </div>
          {quotes.length === 0 ? (
            <div className="text-[13px] text-slate-600">SÃ¶z kaydedilmemiÅŸ.</div>
          ) : (
            <div tabIndex={0} role="region" aria-label="KayÄ±t listesi" className="space-y-2 max-h-64 overflow-y-auto">
              {quotes.map((q) => (
                <div key={q.id} className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-[13px] text-slate-600 italic">â€œ{q.text}â€</p>
                  <div className="text-[13px] text-slate-600 mt-1">
                    {q.source ?? "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <StickyNote size={14}  className="text-birikim" /> PaylaÅŸÄ±lan Notlar
          </div>
          {notes.length === 0 ? (
            <div className="text-[13px] text-slate-600">Not yok.</div>
          ) : (
            <div tabIndex={0} role="region" aria-label="KayÄ±t listesi" className="space-y-2 max-h-64 overflow-y-auto">
              {notes.map((n) => (
                <div key={n.id} className="bg-slate-50 rounded-lg px-3 py-2">
                  <div className="text-[13px] font-medium text-slate-700">
                    {n.title ?? "Not"}
                  </div>
                  <p className="text-[13px] text-slate-600 whitespace-pre-wrap">
                    {n.body}
                  </p>
                  <div className="text-[13px] text-slate-600 mt-1">
                    {n.author?.name ?? "-"} Â·{" "}
                    {n.author?.title ?? "Ã–ÄŸretmen"} Â·{" "}
                    {formatDateTime(n.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <CalendarX size={14}  className="text-birikim" /> DevamsÄ±zlÄ±klar
          </div>
          {absences.length === 0 ? (
            <div className="text-[13px] text-slate-600">DevamsÄ±zlÄ±k yok.</div>
          ) : (
            <div tabIndex={0} role="region" aria-label="KayÄ±t listesi" className="space-y-1.5 max-h-64 overflow-y-auto">
              {absences.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-[13px] bg-slate-50 rounded-lg px-3 py-2"
                >
                  <span className="text-slate-600">{formatDate(a.date)}</span>
                  <span className="text-slate-600">{a.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
