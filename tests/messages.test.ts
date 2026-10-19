import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), session: vi.fn(), access: vi.fn(), conversation: vi.fn(), upsert: vi.fn(), student: vi.fn(), account: vi.fn(),
  create: vi.fn(), update: vi.fn(), mark: vi.fn(), find: vi.fn(), transaction: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.user, getCurrentUser: mocks.session, assertCanAccessStudent: mocks.access }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  conversation: { findUnique: mocks.conversation, upsert: mocks.upsert },
  student: { findUnique: mocks.student }, user: { findUnique: mocks.account }, $transaction: mocks.transaction,
} }));
import { ensureConversation, fetchAndMarkRead, sendMessage, sendChatMessage, loadChatMessages } from "@/actions/messages";

const teacher = { id: "teacher", role: "TEACHER", name: "Teacher", disabledAt: null };
const participant = { id: "student-user", role: "STUDENT", name: "Student", disabledAt: null };
const conversation = {
  id: "chat", kind: "OGRENCI", studentId: "student", teacherId: teacher.id, participantId: participant.id,
  teacher, participant, student: { id: "student", userId: participant.id, parents: [] },
};
let caseId = 0;
describe("Conversation security and delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    caseId++;
    mocks.user.mockResolvedValue(teacher);
    mocks.session.mockResolvedValue(teacher);
    mocks.access.mockResolvedValue(undefined);
    mocks.conversation.mockResolvedValue(conversation);
    mocks.student.mockResolvedValue(conversation.student);
    mocks.account.mockImplementation(({ where }: { where: { id: string } }) => Promise.resolve(where.id === teacher.id ? teacher : participant));
    mocks.create.mockResolvedValue({ id: "message", senderId: teacher.id, body: "Merhaba", createdAt: new Date(), readAt: null });
    mocks.find.mockResolvedValue([]);
    mocks.mark.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback) => callback({ message: { create: mocks.create, updateMany: mocks.mark, findMany: mocks.find }, conversation: { update: mocks.update } }));
  });

  it("rejects nonparticipants before sending or reading", async () => {
    mocks.user.mockResolvedValue({ id: "outsider", role: "TEACHER" });
    await expect(sendMessage("chat", "Merhaba")).rejects.toThrow();
    await expect(fetchAndMarkRead("chat")).rejects.toThrow();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns useful session and permission errors to the chat client", async () => {
    mocks.session.mockResolvedValue(null);
    expect(await sendChatMessage("chat", "Merhaba")).toMatchObject({ ok: false, error: expect.stringContaining("Oturumunuz") });
    expect(await loadChatMessages("chat")).toMatchObject({ ok: false, error: expect.stringContaining("Oturumunuz") });
    expect(mocks.transaction).not.toHaveBeenCalled();
    mocks.session.mockResolvedValue(teacher);
    mocks.user.mockResolvedValue({ id: "outsider", role: "TEACHER" });
    expect(await sendChatMessage("chat", "Merhaba")).toMatchObject({ ok: false, error: expect.stringContaining("yetkiniz") });
  });

  it("does not expose internal database errors through client results", async () => {
    mocks.transaction.mockRejectedValue(new Error("database file and connection details"));
    expect(await sendChatMessage("chat", "Merhaba")).toEqual({ ok: false, error: "Mesaj gönderilemedi. Lütfen tekrar deneyin." });
    expect(await loadChatMessages("chat")).toEqual({ ok: false, error: "Mesajlar yüklenemedi. Lütfen tekrar deneyin." });
  });

  it("rejects an unlinked parent even when the student guard permits access", async () => {
    mocks.user.mockResolvedValue({ id: "parent", role: "PARENT" });
    mocks.account.mockImplementation(({ where }: { where: { id: string } }) => Promise.resolve(where.id === teacher.id ? teacher : { id: "parent", role: "PARENT", disabledAt: null }));
    await expect(ensureConversation("VELI", "student", "teacher", "parent")).rejects.toThrow();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("does not allow a student to create a parent conversation", async () => {
    mocks.user.mockResolvedValue(participant);
    await expect(ensureConversation("VELI", "student", "teacher", participant.id)).rejects.toThrow();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("does not allow teachers to impersonate other teachers", async () => {
    await expect(ensureConversation("OGRENCI", "student", "other-teacher", participant.id)).rejects.toThrow();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("upserts the authorized tuple and rejects inactive teachers", async () => {
    await ensureConversation("OGRENCI", "student", "teacher", participant.id);
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { kind: "OGRENCI", studentId: "student", teacherId: "teacher", participantId: participant.id }, update: {} }));
    mocks.account.mockResolvedValue({ ...teacher, disabledAt: new Date() });
    await expect(ensureConversation("OGRENCI", "student", "teacher", participant.id)).rejects.toThrow();
  });

  it("revokes an existing conversation after unlinking the student", async () => {
    mocks.conversation.mockResolvedValue({ ...conversation, student: { ...conversation.student, userId: null } });
    await expect(fetchAndMarkRead("chat")).rejects.toThrow();
    await expect(sendMessage("chat", "Merhaba")).rejects.toThrow();
  });

  it("marks only incoming unread messages and returns the latest 200 chronologically", async () => {
    const now = new Date();
    mocks.find.mockResolvedValue([
      { id: "new", senderId: teacher.id, body: "Yeni", createdAt: now, readAt: null },
      { id: "old", senderId: participant.id, body: "Eski", createdAt: now, readAt: now },
    ]);
    const result = await fetchAndMarkRead("chat");
    expect(mocks.mark).toHaveBeenCalledWith({ where: { conversationId: "chat", senderId: { not: teacher.id }, readAt: null }, data: { readAt: expect.any(Date) } });
    expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ take: 200, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }));
    expect(result.me).toBe(teacher.id);
    expect(result.messages.map((m) => m.id)).toEqual(["old", "new"]);
    expect(result.messages[1].readAt).toBeNull();
  });

  it("rejects blank or oversized text and normalizes line endings", async () => {
    await expect(sendMessage("chat", " \r\n ")).rejects.toThrow();
    await expect(sendMessage("chat", "a".repeat(2001))).rejects.toThrow();
    expect(mocks.create).not.toHaveBeenCalled();
    await sendMessage("chat", "  İlk\r\nİkinci\rÜçüncü  ");
    expect(mocks.create).toHaveBeenCalledWith({ data: { conversationId: "chat", senderId: teacher.id, body: "İlk\nİkinci\nÜçüncü" } });
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it("allows 20 messages per user per minute, blocks the 21st, and expires the window", async () => {
    const actor = { ...teacher, id: `rate-teacher-${caseId}` };
    mocks.user.mockResolvedValue(actor);
    mocks.conversation.mockResolvedValue({ ...conversation, teacherId: actor.id, teacher: actor });
    const clock = vi.spyOn(Date, "now").mockReturnValue(100000);
    try {
      for (let i = 0; i < 20; i++) await sendMessage("chat", "Merhaba");
      await expect(sendMessage("chat", "Merhaba")).rejects.toThrow("20");
      expect(mocks.create).toHaveBeenCalledTimes(20);
      clock.mockReturnValue(160001);
      await sendMessage("chat", "Merhaba");
      expect(mocks.create).toHaveBeenCalledTimes(21);
    } finally { clock.mockRestore(); }
  });
});
