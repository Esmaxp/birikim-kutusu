import { Tabs } from "@/components/ui";
import TeacherChat from "@/components/TeacherChat";
import { getUnreadCounts } from "@/actions/messages";

import { notFound } from "next/navigation";
import { BookOpen, CalendarX, HeartHandshake, LayoutDashboard, Phone, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { assertCanAccessStudent, requireUser } from "@/lib/auth";

import StudentPhotoUpload from "@/components/StudentPhotoUpload";
import BookCorner from "@/components/BookCorner";
import DevamTab from "@/components/DevamTab";
import RehberlikTab from "@/components/RehberlikTab";
import ExamSessionList from "@/components/ExamSessionList";

type Props = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ tab?: string; veli?: string }>;
};

const TABS = [
  { key: "devam", label: "Devamsızlık", icon: CalendarX },
  { key: "deneme", label: "Deneme Analizi", icon: LayoutDashboard },
  { key: "rehberlik", label: "Rehberlik", icon: HeartHandshake },
  { key: "kitap", label: "Kitap Köşesi", icon: BookOpen },
  { key: "ogrenci-mesaj", label: "Ö-Ö-İ", icon: Users },
  { key: "veli-mesaj", label: "Ö-V-İ", icon: Users },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function OgrenciDetayPage({ params, searchParams }: Props) {
  const user = await requireUser(["TEACHER"]);
  const { studentId } = await params;
  await assertCanAccessStudent(user, studentId);

  const sp = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === sp.tab) ? (sp.tab as TabKey) : "devam";

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true, _count: { select: { absences: true, examSessions: true, notes: true, books: true } } },
  });
  if (!student) notFound();

  const base = `/ogretmen/ogrenci/${studentId}`;
  const unread = await getUnreadCounts();
  const countFor = (kind: string) => unread.conversations.filter((c) => c.studentId === studentId && c.kind === kind).reduce((sum, c) => sum + c.unread, 0);

  const [absences, examSessions, notes, books, quotes] = await Promise.all([
    tab === "devam"
      ? prisma.absence.findMany({
          where: { studentId },
          orderBy: { date: "desc" },
        })
      : Promise.resolve([]),
    tab === "deneme"
      ? prisma.examSession.findMany({
          where: { studentId },
          orderBy: { sinavTarihi: "desc" },
          select: {
            id: true,
            sinavAdi: true,
            sinavTarihi: true,
            toplamNet: true,
            puan: true,
            yuzdelikDilim: true,
          },
        })
      : Promise.resolve([]),
    tab === "rehberlik"
      ? prisma.note.findMany({
          where: { studentId },
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true, title: true } } },
        })
      : Promise.resolve([]),
    tab === "kitap"
      ? prisma.book.findMany({
          where: { studentId },
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { quotes: true } } },
        })
      : Promise.resolve([]),
    tab === "kitap"
      ? prisma.quote.findMany({
          where: { studentId },
          orderBy: [{ favorite: "desc" }, { createdAt: "desc" }],
          include: { book: { select: { title: true } } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 flex-wrap">
        <StudentPhotoUpload
          studentId={student.id}
          name={student.name}
          photoUrl={student.photoUrl}
        />
        <div className="flex-1 min-w-[200px]">
          <div className="text-[17px] font-bold text-slate-800">{student.name}</div>
          <div className="text-[13px] text-slate-600 flex items-center gap-1 mt-0.5">
            <Users size={12} /> {student.class.name} · No: {student.no}
          </div>
        </div>
        <div className="text-[13px] text-slate-600 space-y-1">
          <div>
            <span className="text-slate-600">Veli:</span> {student.veliAdi ?? "-"}
          </div>
          <div className="flex items-center gap-1">
            <Phone size={11} className="text-slate-600" /> {student.telefon ?? "-"}
          </div>
        </div>
      </div>

      <Tabs items={TABS.map(({ key, label }) => ({ label, href: `${base}?tab=${key}`, active: tab === key, count: ({ devam: student._count.absences, deneme: student._count.examSessions, rehberlik: student._count.notes, kitap: student._count.books, "ogrenci-mesaj": countFor("OGRENCI") || undefined, "veli-mesaj": countFor("VELI") || undefined })[key] }))} />

      {tab === "ogrenci-mesaj" && <TeacherChat studentId={studentId} kind="OGRENCI" />}
      {tab === "veli-mesaj" && <TeacherChat studentId={studentId} kind="VELI" parentId={sp.veli} />}

      {tab === "devam" && (
        <DevamTab
          studentId={student.id}
          absences={absences.map((a) => ({
            id: a.id,
            date: a.date.toISOString(),
            reason: a.reason,
          }))}
        />
      )}

      {tab === "deneme" && (
        <ExamSessionList
          basePath={`${base}/deneme`}
          examSessions={examSessions.map((e) => ({
            id: e.id,
            sinavAdi: e.sinavAdi,
            sinavTarihi: e.sinavTarihi.toISOString(),
            toplamNet: e.toplamNet,
            puan: e.puan,
            yuzdelikDilim: e.yuzdelikDilim,
          }))}
        />
      )}

      {tab === "rehberlik" && (
        <RehberlikTab
          studentId={student.id}
          studentName={student.name}
          notes={notes.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            authorName: n.author?.name ?? "Bilinmiyor",
            authorTitle: n.author?.title ?? null,
            createdAt: n.createdAt.toISOString(),
            visibleToStudent: n.visibleToStudent,
            canDelete: n.authorId === user.id,
          }))}
        />
      )}

      {tab === "kitap" && (
        <BookCorner
          studentId={student.id}
          books={books.map((b) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            status: b.status,
            pages: b.pages,
            rating: b.rating,
            review: b.review,
            coverUrl: b.coverUrl,
            fileUrl: b.fileUrl,
            fileName: b.fileName,
            createdAt: b.createdAt.toISOString(),
            quoteCount: b._count.quotes,
            addedByTeacher: b.addedById !== null && b.addedById !== student.userId,
          }))}
          quotes={quotes.map((q) => ({
            id: q.id,
            text: q.text,
            source: q.source,
            pageNo: q.pageNo,
            favorite: q.favorite,
            bookTitle: q.book?.title ?? null,
            createdAt: q.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
