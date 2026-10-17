import { NetTrend } from "@/components/ExamProgressCharts";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarX, HeartHandshake, TrendingUp } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/auth";
import { examTrend } from "@/lib/exam";
import { formatDate } from "@/lib/constants";

export default async function OgrenciOzet() {
  const { user, student } = await requireStudentProfile();

  const [kitaplar, okunmamisNot, notlar, devamsizlik, examSessions] = await Promise.all([
    prisma.book.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.note.count({ where: { studentId: student.id, visibleToStudent: true, readAt: null } }),
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
      select: { puan: true, toplamNet: true, sinavAdi: true },
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
  const trend = examTrend(puanlar);


  const kartlar = [
    {
      label: "Kitaplarım",
      value: `${okunanSayisi}/${kitapSayisi}`,
      alt: "okundu",
      icon: BookOpen,
      href: "/ogrenci/kitap-kosesi",
    },
    {
      label: "Yeni Notlar",
      value: okunmamisNot,
      alt: "okunmamış",
      icon: HeartHandshake,
      href: "/ogrenci/pdr-notlari",
    },
    {
      label: "Son Deneme Puanı",
      value: examSessions.at(-1)?.puan?.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) ?? "—",
      alt: `${trend >= 0 ? "+" : ""}${trend} gelişim`,
      icon: TrendingUp,
      href: "/ogrenci/deneme-analizi",
    },
    {
      label: "Devamsızlık",
      value: devamsizlik,
      alt: "gün",
      icon: CalendarX,
      href: "/ogrenci/devamsizlik",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <div>
        <div className="text-2xl font-bold text-slate-800">
          Merhaba {user.name.split(" ")[0]} 👋
        </div>
        <div className="text-[13px] text-slate-600">
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
              <Icon size={16}  className="text-birikim" />
              <ArrowRight size={13} className="text-slate-600" />
            </div>
            <div className="text-[20px] font-bold text-slate-800 leading-none">
              {value}
            </div>
            <div className="text-[13px] text-slate-600 mt-1">
              {label} <span className="text-slate-600">· {alt}</span>
            </div>
          </Link>
        ))}
      </div>

      <NetTrend data={examSessions.filter((e) => e.toplamNet !== null).map((e) => ({ ad: e.sinavAdi, net: e.toplamNet! }))} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
              <HeartHandshake size={14}  className="text-birikim" /> PDR
              Öğretmenimden Notlar
              {okunmamisNot > 0 && (
                <span
                  className="text-[13px] text-white rounded-full px-1.5 py-0.5 bg-birikim"

                >
                  {okunmamisNot} yeni
                </span>
              )}
            </div>
            <Link
              href="/ogrenci/pdr-notlari"
              className="text-[13px] text-birikim"

            >
              Tümü
            </Link>
          </div>
          {notlar.length === 0 ? (
            <div className="text-[13px] text-slate-600">
              Henüz paylaşılmış bir not yok.
            </div>
          ) : (
            <div className="space-y-2">
              {notlar.map((n) => (
                <div key={n.id} className="bg-slate-50 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-slate-700">
                      {n.title ?? "Not"}
                    </span>
                    <span className="text-[13px] text-slate-600">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-600 line-clamp-2 mt-0.5">
                    {n.body}
                  </p>
                  <div className="text-[13px] text-slate-600 mt-1">
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
              <BookOpen size={14}  className="text-birikim" /> Son Eklenen Kitaplar
            </div>
            <Link
              href="/ogrenci/kitap-kosesi"
              className="text-[13px] text-birikim"

            >
              Kitap Köşem
            </Link>
          </div>
          {kitaplar.length === 0 ? (
            <div className="text-[13px] text-slate-600">
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
      </div>
    </div>
  );
}
