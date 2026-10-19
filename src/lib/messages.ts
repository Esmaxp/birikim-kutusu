import type { Prisma } from "@prisma/client";
import type { SessionUser } from "./auth";

export class MessageError extends Error {}

export const conversationAccessInclude = {
  teacher: { select: { id: true, name: true, role: true, disabledAt: true } },
  participant: { select: { id: true, name: true, role: true, disabledAt: true } },
  student: { select: { id: true, name: true, userId: true, parents: { select: { parentId: true } } } },
} satisfies Prisma.ConversationInclude;

type AccessibleConversation = Prisma.ConversationGetPayload<{ include: typeof conversationAccessInclude }>;

// Recheck current links as well as membership: unlinking an account revokes access.
export function canUseConversation(user: SessionUser, conversation: AccessibleConversation) {
  const { teacher, participant, student } = conversation;
  if (teacher.role !== "TEACHER" || teacher.disabledAt || participant.disabledAt) return false;
  const validParticipant = conversation.kind === "OGRENCI"
    ? participant.role === "STUDENT" && student.userId === participant.id
    : conversation.kind === "VELI" && participant.role === "PARENT" && student.parents.some((p) => p.parentId === participant.id);
  return validParticipant && (
    (user.role === "TEACHER" && user.id === teacher.id) ||
    (user.id === participant.id && user.role === participant.role)
  );
}

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};
