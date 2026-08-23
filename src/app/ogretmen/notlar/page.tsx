import Link from "next/link";
import { StickyNote } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { RED, formatDateTime } from "@/lib/constants";
import { deleteNote } from "@/actions/notes";

export default async function OgretmenNotlarPage() {
  const user = await requireUser(["TEACHER"]);

  const notes = await prisma.note.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: { student: { include: { class: true } } },
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="text-[15px] font-semibold text-slate-700 mb-4">
        Yazdığım Notlar
      </div>

      {notes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <StickyNote size={30} className="mx-auto mb-3 text-slate-300" />
          <div className="text-[14px] font-semibold text-slate-600">
            Henüz not yazmadınız
          </div>
          <p className="text-[12px] text-slate-400 mt-1">
            Şube sayfasından bir öğrenci seçip &quot;Not Gir&quot; ile
            ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/ogretmen/sube/${encodeURIComponent(
                      n.student.class.name
                    )}?tab=kitap&ogrenci=${n.student.id}`}
                    className="text-[13px] font-semibold hover:underline"
                    style={{ color: RED }}
                  >
                    {n.student.name}
                  </Link>
                  <span className="text-[11px] text-slate-400 ml-2">
                    {n.student.class.name}
                  </span>
                </div>
                <form action={deleteNote.bind(null, n.id)}>
                  <button className="text-[11px] text-slate-400 hover:text-red-500">
                    Sil
                  </button>
                </form>
              </div>

              {n.title && (
                <div className="text-[13px] font-medium text-slate-700 mt-1">
                  {n.title}
                </div>
              )}
              <p className="text-[13px] text-slate-600 mt-1 whitespace-pre-wrap">
                {n.body}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  {formatDateTime(n.createdAt)}
                </span>
                <span
                  className={
                    "text-[11px] " +
                    (n.visibleToStudent ? "text-green-600" : "text-slate-400")
                  }
                >
                  {n.visibleToStudent ? "Öğrenciye açık" : "Gizli not"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
