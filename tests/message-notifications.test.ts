import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/lib/auth";

const mocks = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.session }));
vi.mock("@/lib/prisma", () => ({ prisma: { conversation: { findMany: mocks.find } } }));
import { GET } from "@/app/api/messages/notifications/route";
import { messageNotificationsFor } from "@/lib/message-notifications";

const teacher = { id: "teacher", role: "TEACHER", name: "Teacher", disabledAt: null };
const participant = { id: "student-user", role: "STUDENT", name: "Student", disabledAt: null };
function conversation() {
  return {
    id: "chat", kind: "OGRENCI", studentId: "student", teacherId: teacher.id, participantId: participant.id,
    teacher, participant, student: { id: "student", name: "Student", userId: participant.id, parents: [] },
    messages: [{ id: "message", body: "Hello", createdAt: new Date("2026-10-19T10:00:00Z") }], _count: { messages: 2 },
  };
}
const actor = (user: typeof teacher | typeof participant) => ({ ...user, email: "test@example.test", title: null, isAdmin: false, mustChangePassword: false }) as SessionUser;

describe("Message notifications", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue(actor(teacher)); mocks.find.mockResolvedValue([conversation()]); });

  it("requires a session and blocks accounts requiring a password change", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    mocks.session.mockResolvedValue({ ...actor(teacher), mustChangePassword: true });
    expect((await GET()).status).toBe(403);
    expect(mocks.find).not.toHaveBeenCalled();
  });

  it("queries only incoming unread messages in the caller's conversations", async () => {
    const response = await GET();
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { teacherId: "teacher", messages: { some: { senderId: { not: "teacher" }, readAt: null } } },
    }));
    expect(await response.json()).toMatchObject({ total: 2, items: [{ href: "/ogretmen/ogrenci/student?tab=ogrenci-mesaj", unread: 2 }] });
  });

  it("filters foreign conversations and revoked links even if returned by the database", async () => {
    const chat = conversation();
    mocks.find.mockResolvedValue([
      { ...chat, teacher: { ...teacher, id: "other" }, teacherId: "other" },
      { ...chat, student: { ...chat.student, userId: null } },
      { ...chat, teacher: { ...teacher, disabledAt: new Date() } },
    ]);
    expect(await messageNotificationsFor(actor(teacher))).toEqual({ total: 0, items: [] });
  });

  it("links student and parent notifications to the correct child and teacher", async () => {
    const studentResult = await messageNotificationsFor(actor(participant));
    expect(studentResult.items[0].href).toBe("/ogrenci/mesajlar?ogrenci=student&ogretmen=teacher");
    const parent = { ...participant, id: "parent", role: "PARENT" };
    const chat = conversation();
    mocks.find.mockResolvedValue([{ ...chat, kind: "VELI", participantId: parent.id, participant: parent, student: { ...chat.student, parents: [{ parentId: parent.id }] } }]);
    expect((await messageNotificationsFor(actor(parent))).items[0].href).toBe("/veli/mesajlar?ogrenci=student&ogretmen=teacher");
    expect((await messageNotificationsFor(actor(teacher))).items[0].href).toBe("/ogretmen/ogrenci/student?tab=veli-mesaj&veli=parent");
  });
});
