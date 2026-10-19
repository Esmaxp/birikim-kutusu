import { prisma } from "./prisma";
import type { SessionUser } from "./auth";
import { canUseConversation, conversationAccessInclude } from "./messages";

export async function messageNotificationsFor(user: SessionUser) {
  const incoming = { senderId: { not: user.id }, readAt: null };
  const conversations = await prisma.conversation.findMany({
    where: {
      ...(user.role === "TEACHER" ? { teacherId: user.id } : { participantId: user.id }),
      messages: { some: incoming },
    },
    include: {
      ...conversationAccessInclude,
      messages: { where: incoming, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { id: true, body: true, createdAt: true } },
      _count: { select: { messages: { where: incoming } } },
    },
  });
  const items = conversations.filter((c) => canUseConversation(user, c) && c.messages.length).map((c) => {
    const message = c.messages[0];
    const studentId = encodeURIComponent(c.studentId);
    const href = user.role === "TEACHER"
      ? `/ogretmen/ogrenci/${studentId}?tab=${c.kind === "OGRENCI" ? "ogrenci-mesaj" : "veli-mesaj"}${c.kind === "VELI" ? `&veli=${encodeURIComponent(c.participantId)}` : ""}`
      : `/${user.role === "STUDENT" ? "ogrenci" : "veli"}/mesajlar?ogrenci=${studentId}&ogretmen=${encodeURIComponent(c.teacherId)}`;
    return {
      id: c.id, messageId: message.id, name: user.role === "TEACHER" ? c.participant.name : c.teacher.name,
      studentName: c.student.name, preview: message.body.slice(0, 120), unread: c._count.messages,
      createdAt: message.createdAt.toISOString(), href,
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.messageId.localeCompare(a.messageId));
  return { total: items.reduce((sum, item) => sum + item.unread, 0), items };
}

export type MessageNotifications = Awaited<ReturnType<typeof messageNotificationsFor>>;
