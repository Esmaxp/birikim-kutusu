import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarX,
  HeartHandshake,
  Quote as QuoteIcon,
  TrendingUp,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/auth";
import { examOrtalama, examTrend } from "@/lib/exam";
import { RED, formatDate } from "@/lib/constants";

export default async function OgrenciOzet() {
  const { user, student } = await requireStudentProfile();

  const [kitaplar, sozler, notlar, devamsizlik, examSessions] = await Promise.all([
    prisma.book.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.quote.count({ where: { studentId: student.id } }),
    prisma.note.findMany({
      where: { studentId: student.id, visibleToStudent: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { author: { select: { name: true, title: true } } },
    }),
    prisma.absence.count({ where: { studentId: student.id } }),
    prisma.examSession.findMany({
      where: { studentId: student.id, visibleToStudent: true },
      orderBy: { sinavTarihi: "asc" },
      select: { puan: true },
    }),
  ]);

  const kitapSayisi = await prisma.book.count({
    where: { studentId: student.id },
  });
  const okunanSayisi = await prisma.book.count({
    where: { studentId: student.id, status: "Okundu" },
  });

  const puanlar = examSessions
    .filter((e) => e.puan !== null)
    .map((e) => ({ puan: e.puan as number }));
  const ortalama = examOrtalama(puanlar);
  const trend = examTrend(puanlar);
  const okunmamisNot = notlar.filter((n) => !n.readAt).length;

  const kartlar = [
    {
      label: "Kitaplarım",
      value: `${okunanSayisi}/${kitapSayisi}`,
      alt: "okundu",
      icon: BookOpen,
      href: "/ogrenci/kitap-kosesi",
    },
    {
      label: "Kayıtlı Sözler",
      value: sozler,
      alt: "söz",
      icon: QuoteIcon,
      href: "/ogrenci/kitap-kosesi",
    },
    {
      label: "Deneme Ortalaması",
      value: ortalama,
      alt: `${trend >= 0 ? "+" : ""}${trend} gelişim`,
      icon: TrendingUp,
      href: "/ogrenci/deneme-analizi",
    },
    {
      label: "Devamsızlık",
      value: devamsizlik,
      alt: "gün",
      icon: CalendarX,
      href: "/ogrenci",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <div>
        <div className="text-[18px] font-bold text-slate-800">
          Merhaba {user.name.split(" ")[0]} 👋
        </div>
        <div className="text-[12px] text-slate-400">
          {student.class.name} · Okul No: {student.no}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kartlar.map(({ label, value, alt, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Icon size={16} style={{ color: RED }} />
              <ArrowRight size={13} className="text-slate-300" />
            </div>
            <div className="text-[20px] font-bold text-slate-800 leading-none">
              {value}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {label} <span className="text-slate-300">· {alt}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
              <HeartHandshake size={14} style={{ color: RED }} /> PDR
              Öğretmenimden Notlar
              {okunmamisNot > 0 && (
                <span
                  className="text-[10px] text-white rounded-full px-1.5 py-0.5"
                  style={{ background: RED }}
                >
                  {okunmamisNot} yeni
                </span>
              )}
            </div>
            <Link
              href="/ogrenci/pdr-notlari"
              className="text-[12px]"
              style={{ color: RED }}
            >
              Tümü
            </Link>
          </div>
          {notlar.length === 0 ? (
            <div className="text-[12px] text-slate-400">
              Henüz paylaşılmış bir not yok.
            </div>
          ) : (
            <div className="space-y-2">
              {notlar.map((n) => (
                <div key={n.id} className="bg-slate-50 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-slate-700">
                      {n.title ?? "Not"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 line-clamp-2 mt-0.5">
                    {n.body}
                  </p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {n.author?.name ?? "Öğretmen"} ·{" "}
                    {n.author?.title ?? "Öğretmen"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
              <BookOpen size={14} style={{ color: RED }} /> Son Eklenen Kitaplar
            </div>
            <Link
              href="/ogrenci/kitap-kosesi"
              className="text-[12px]"
              style={{ color: RED }}
            >
              Kitap Köşem
            </Link>
          </div>
          {kitaplar.length === 0 ? (
            <div className="text-[12px] text-slate-400">
              Henüz kitap eklemedin.
            </div>
          ) : (
            <div className="space-y-2">
              {kitaplar.map((b) => (
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
      </div>
    </div>
  );
}
