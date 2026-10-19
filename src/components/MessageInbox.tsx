import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ensureConversation, listConversationsForUser } from "@/actions/messages";
import { cn } from "@/lib/utils";
import Chat from "./Chat";
import { Badge, EmptyState, PageHeader } from "./ui";

export type InboxSearchParams = { ogrenci?: string; ogretmen?: string };

export default async function MessageInbox({ kind, searchParams }: { kind: "OGRENCI" | "VELI"; searchParams: InboxSearchParams }) {
  const user = await requireUser([kind === "OGRENCI" ? "STUDENT" : "PARENT"]);
  const students = await prisma.student.findMany({
    where: kind === "OGRENCI" ? { userId: user.id } : { parents: { some: { parentId: user.id } } },
    select: { id: true, name: true }, orderBy: { name: "asc" },
  });
  const student = searchParams.ogrenci ? students.find((s) => s.id === searchParams.ogrenci) : students[0];
  if (searchParams.ogrenci && !student) notFound();
  const base = kind === "OGRENCI" ? "/ogrenci/mesajlar" : "/veli/mesajlar";
  const [teachers, conversations] = await Promise.all([
    prisma.user.findMany({ where: { role: "TEACHER", disabledAt: null }, select: { id: true, name: true, title: true }, orderBy: { name: "asc" } }),
    listConversationsForUser(),
  ]);
  const existing = conversations.filter((c) => c.studentId === student?.id);
  const selectedTeacherId = searchParams.ogretmen ?? existing[0]?.teacherId;
  const teacher = teachers.find((t) => t.id === selectedTeacherId);
  if (searchParams.ogretmen && !teacher) notFound();
  const conversation = student && teacher ? await ensureConversation(kind, student.id, teacher.id, user.id) : null;
  const orderedTeachers = [...teachers].sort((a, b) => {
    const ai = existing.findIndex((c) => c.teacherId === a.id);
    const bi = existing.findIndex((c) => c.teacherId === b.id);
    return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi) || a.name.localeCompare(b.name, "tr");
  });

  return <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
    <PageHeader title="Mesajlar" />
    {kind === "VELI" && students.length > 1 && <nav aria-label="Çocuk seçimi" className="flex flex-wrap gap-2">
      {students.map((child) => <Link key={child.id} href={`${base}?ogrenci=${encodeURIComponent(child.id)}`}
        aria-current={student?.id === child.id ? "page" : undefined}
        className={cn("rounded-lg border px-4 py-2 text-sm", student?.id === child.id ? "border-birikim bg-birikim-50 text-birikim-800" : "border-slate-200 bg-white")}>
        {child.name}
      </Link>)}
    </nav>}
    {!student ? <EmptyState title="Hesabınıza bağlı öğrenci bulunamadı." /> : !teachers.length ? <EmptyState title="Şu anda mesaj gönderebileceğiniz etkin bir öğretmen yok." /> : (
      <div className="grid min-w-0 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Öğretmen seçimi" className="max-h-64 space-y-2 overflow-y-auto lg:max-h-[70vh]">
          {orderedTeachers.map((item) => {
            const chat = existing.find((c) => c.teacherId === item.id);
            return <Link key={item.id} href={`${base}?ogrenci=${encodeURIComponent(student.id)}&ogretmen=${encodeURIComponent(item.id)}`}
              aria-current={teacher?.id === item.id ? "page" : undefined}
              className={cn("block rounded-xl border p-3 text-sm", teacher?.id === item.id ? "border-birikim bg-birikim-50" : "border-slate-200 bg-white hover:bg-slate-50")}>
              <span className="flex items-center justify-between gap-2 font-semibold">{item.name}{!!chat?.unread && <Badge>{chat.unread}</Badge>}</span>
              {item.title && <span className="mt-1 block text-xs text-slate-600">{item.title}</span>}
              <span className="mt-1 block truncate text-slate-600">{chat?.preview ?? "Görüşme başlat"}</span>
            </Link>;
          })}
        </nav>
        {conversation && teacher ? <Chat conversationId={conversation.id} title={`${teacher.name} · ${student.name}`} />
          : <EmptyState title="Bir öğretmen seçin" description="Mesajlaşmaya başlamak için öğretmen adına dokunun." />}
      </div>
    )}
  </div>;
}
