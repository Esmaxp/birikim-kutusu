import Link from "next/link";
import { BookOpen, CalendarX, LayoutDashboard, StickyNote, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { RED, formatDate } from "@/lib/constants";

export default async function OgretmenDashboard() {
  await requireUser(["TEACHER"]);

  const [classes, ogrenciSayisi, kitapSayisi, sozSayisi, denemeSayisi, sonDevamsizliklar] =
    await Promise.all([
      prisma.schoolClass.findMany({
        orderBy: { order: "asc" },
        include: { _count: { select: { students: true } } },
      }),
      prisma.student.count(),
      prisma.book.count(),
      prisma.quote.count(),
      prisma.examAnalysis.count(),
      prisma.absence.findMany({
        take: 6,
        orderBy: { date: "desc" },
        include: { student: { include: { class: true } } },
      }),
    ]);

  const kartlar = [
    { label: "Öğrenci", value: ogrenciSayisi, icon: Users },
    { label: "Okunan/Okunacak Kitap", value: kitapSayisi, icon: BookOpen },
    { label: "Kaydedilen Söz", value: sozSayisi, icon: StickyNote },
    { label: "Deneme Analizi", value: denemeSayisi, icon: LayoutDashboard },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="text-[15px] font-semibold text-slate-700">Kontrol Paneli</div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kartlar.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
              style={{ background: RED }}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[20px] font-bold text-slate-800 leading-none">
                {value}
              </div>
              <div className="text-[11px] text-slate-400 truncate">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3">Şubeler</div>
          <div className="space-y-2">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/ogretmen/sube/${encodeURIComponent(c.name)}`}
                className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2"
              >
                <span className="text-[13px] font-medium text-slate-700 flex items-center gap-2">
                  <Users size={14} style={{ color: RED }} /> {c.name}
                </span>
                <span className="text-[12px] text-slate-400">
                  {c._count.students} öğrenci
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <CalendarX size={14} style={{ color: RED }} /> Son Devamsızlıklar
          </div>
          {sonDevamsizliklar.length === 0 ? (
            <div className="text-[12px] text-slate-400">Kayıt yok.</div>
          ) : (
            <div className="space-y-1.5">
              {sonDevamsizliklar.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-[12px] bg-slate-50 rounded-lg px-3 py-2"
                >
                  <span className="text-slate-600">
                    {a.student.name}{" "}
                    <span className="text-slate-400">({a.student.class.name})</span>
                  </span>
                  <span className="text-slate-400">
                    {formatDate(a.date)} · {a.reason}
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
