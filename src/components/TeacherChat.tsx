import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { assertCanAccessStudent, requireUser } from "@/lib/auth";
import { ensureConversation, getUnreadCounts } from "@/actions/messages";
import Chat from "./Chat";
import { Badge, EmptyState } from "./ui";
import { cn } from "@/lib/utils";

export default async function TeacherChat({ studentId, kind, parentId }: { studentId: string; kind: "OGRENCI" | "VELI"; parentId?: string }) {
  const user = await requireUser(["TEACHER"]);
  await assertCanAccessStudent(user, studentId);
  const student = await prisma.student.findUnique({ where: { id: studentId }, include: {
    user: { select: { id: true, role: true, disabledAt: true } },
    parents: { where: { parent: { role: "PARENT", disabledAt: null } }, include: { parent: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
  } });
  if (!student) return <EmptyState title="Öğrenci bulunamadı." />;
  if (kind === "OGRENCI") {
    if (!student.user) return <EmptyState title="Bu öğrenci henüz hesap oluşturmadı." />;
    if (student.user.disabledAt || student.user.role !== "STUDENT") return <EmptyState title="Öğrencinin hesabı etkin değil." />;
    const conversation = await ensureConversation(kind, studentId, user.id, student.user.id);
    return <Chat conversationId={conversation.id} title={`${student.name} · Öğrenci görüşmesi`} />;
  }
  if (!student.parents.length) return <EmptyState title="Bu öğrenciye bağlı etkin bir veli hesabı yok." />;
  const selected = student.parents.find((p) => p.parentId === parentId) ?? student.parents[0];
  const unread = await getUnreadCounts();
  const conversation = await ensureConversation(kind, studentId, user.id, selected.parentId);
  return <div className="space-y-4">
    <nav aria-label="Veli seçimi" className="flex flex-wrap gap-2">
      {student.parents.map((link) => {
        const count = unread.conversations.filter((c) => c.studentId === studentId && c.kind === "VELI" && c.participantId === link.parentId).reduce((sum, c) => sum + c.unread, 0);
        return <Link key={link.id} href={`/ogretmen/ogrenci/${studentId}?tab=veli-mesaj&veli=${encodeURIComponent(link.parentId)}`}
          aria-current={selected.id === link.id ? "page" : undefined}
          className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", selected.id === link.id ? "border-birikim bg-birikim-50 text-birikim-800" : "border-slate-200 bg-white")}>
          {link.yakinlik === "ANNE" ? "Anne" : link.yakinlik === "BABA" ? "Baba" : "Diğer veli"} · {link.parent.name}
          {count > 0 && <Badge>{count}</Badge>}
        </Link>;
      })}
    </nav>
    <Chat conversationId={conversation.id} title={`${selected.parent.name} · ${student.name}`} />
  </div>;
}
