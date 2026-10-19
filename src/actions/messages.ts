"use server";

import { prisma } from "@/lib/prisma";
import { assertCanAccessStudent, getCurrentUser, requireUser } from "@/lib/auth";
import { rateLimiter } from "@/lib/rate-limit";
import { canUseConversation, conversationAccessInclude, MessageError } from "@/lib/messages";

function validId(value: unknown): asserts value is string {
  if (typeof value !== "string" || !value.trim() || value.length > 128) throw new Error("Geçersiz kayıt bilgisi.");
}

export async function ensureConversation(kind: string, studentId: string, teacherId: string, participantId: string) {
  const user = await requireUser(["TEACHER", "STUDENT", "PARENT"]);
  [studentId, teacherId, participantId].forEach(validId);
  if (kind !== "OGRENCI" && kind !== "VELI") throw new Error("Geçersiz görüşme türü.");
  await assertCanAccessStudent(user, studentId);
  if (user.role === "TEACHER" ? teacherId !== user.id : participantId !== user.id || kind !== (user.role === "STUDENT" ? "OGRENCI" : "VELI")) {
    throw new Error("Bu görüşmeye erişim yetkiniz yok.");
  }
  const [student, teacher, participant] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { userId: true, parents: { select: { parentId: true } } } }),
    prisma.user.findUnique({ where: { id: teacherId }, select: { role: true, disabledAt: true } }),
    prisma.user.findUnique({ where: { id: participantId }, select: { role: true, disabledAt: true } }),
  ]);
  if (!student || !teacher || teacher.role !== "TEACHER" || teacher.disabledAt || !participant || participant.disabledAt) {
    throw new Error("Görüşme için etkin hesaplar bulunamadı.");
  }
  if (kind === "OGRENCI"
    ? participant.role !== "STUDENT" || student.userId !== participantId
    : participant.role !== "PARENT" || !student.parents.some((p) => p.parentId === participantId)) {
    throw new Error("Bu hesap öğrenciyle bağlantılı değil.");
  }
  return prisma.conversation.upsert({
    where: { kind_studentId_teacherId_participantId: { kind, studentId, teacherId, participantId } },
    create: { kind, studentId, teacherId, participantId }, update: {}, select: { id: true },
  });
}

async function requireConversation(conversationId: string) {
  const user = await requireUser(["TEACHER", "STUDENT", "PARENT"]);
  validId(conversationId);
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, include: conversationAccessInclude });
  if (!conversation || !canUseConversation(user, conversation)) throw new MessageError("Bu görüşmeye erişim yetkiniz yok. Hesabınızın öğrenci veya veli bağlantısını kontrol edin.");
  await assertCanAccessStudent(user, conversation.studentId);
  return { user, conversation };
}

export async function sendMessage(conversationId: string, body: string) {
  const { user } = await requireConversation(conversationId);
  if (typeof body !== "string") throw new MessageError("Mesaj metni geçersiz.");
  const normalized = body.replace(/\r\n?/g, "\n").trim();
  if (!normalized || normalized.length > 2000) throw new MessageError("Mesaj 1–2000 karakter arasında olmalıdır.");
  const limit = await rateLimiter.check(`messages:${user.id}`, 20, 60_000);
  if (!limit.allowed) throw new MessageError("Dakikada en fazla 20 mesaj gönderebilirsiniz. Lütfen biraz bekleyin.");
  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({ data: { conversationId, senderId: user.id, body: normalized } });
    await tx.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: message.createdAt } });
    return { ...message, createdAt: message.createdAt.toISOString(), readAt: message.readAt?.toISOString() ?? null };
  });
}

export async function fetchAndMarkRead(conversationId: string) {
  const { user } = await requireConversation(conversationId);
  const { messages, markedCount } = await prisma.$transaction(async (tx) => {
    const marked = await tx.message.updateMany({ where: { conversationId, senderId: { not: user.id }, readAt: null }, data: { readAt: new Date() } });
    const messages = await tx.message.findMany({ where: { conversationId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 200 });
    return { messages, markedCount: marked.count };
  });
  return { me: user.id, markedCount, messages: messages.reverse().map((m) => ({
    id: m.id, senderId: m.senderId, body: m.body, createdAt: m.createdAt.toISOString(), readAt: m.readAt?.toISOString() ?? null,
  })) };
}

export async function listConversationsForUser() {
  const user = await requireUser(["TEACHER", "STUDENT", "PARENT"]);
  const conversations = await prisma.conversation.findMany({
    where: user.role === "TEACHER" ? { teacherId: user.id } : { participantId: user.id },
    include: {
      ...conversationAccessInclude,
      messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { body: true } },
      _count: { select: { messages: { where: { senderId: { not: user.id }, readAt: null } } } },
    },
    orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
  });
  return conversations.filter((c) => canUseConversation(user, c)).map((c) => ({
    id: c.id, studentId: c.studentId, studentName: c.student.name, kind: c.kind,
    teacherId: c.teacherId, participantId: c.participantId,
    name: user.id === c.teacherId ? c.participant.name : c.teacher.name,
    preview: c.messages[0]?.body.slice(0, 120) ?? "Henüz mesaj yok.", unread: c._count.messages,
  }));
}

export async function getUnreadCounts() {
  const conversations = await listConversationsForUser();
  return { total: conversations.reduce((sum, c) => sum + c.unread, 0), conversations: conversations.map(({ id, studentId, participantId, kind, unread }) => ({ id, studentId, participantId, kind, unread })) };
}

async function sessionError() {
  const user = await getCurrentUser();
  if (!user) return "Oturumunuz sona erdi. Lütfen yeniden giriş yapın.";
  if (user.mustChangePassword) return "Devam etmek için önce hesap şifrenizi değiştirin.";
  if (!["TEACHER", "STUDENT", "PARENT"].includes(user.role)) return "Mesajlaşma yetkiniz bulunmuyor.";
}

// Return expected errors explicitly so production does not redact useful feedback.
export async function sendChatMessage(conversationId: string, body: string) {
  const error = await sessionError();
  if (error) return { ok: false as const, error };
  try {
    return { ok: true as const, message: await sendMessage(conversationId, body) };
  } catch (error) {
    return { ok: false as const, error: error instanceof MessageError ? error.message : "Mesaj gönderilemedi. Lütfen tekrar deneyin." };
  }
}

export async function loadChatMessages(conversationId: string) {
  const error = await sessionError();
  if (error) return { ok: false as const, error };
  try {
    return { ok: true as const, ...await fetchAndMarkRead(conversationId) };
  } catch (error) {
    return { ok: false as const, error: error instanceof MessageError ? error.message : "Mesajlar yüklenemedi. Lütfen tekrar deneyin." };
  }
}
