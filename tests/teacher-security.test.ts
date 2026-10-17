import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  session: { deleteMany: vi.fn() },
  audit: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.requireAdmin, hashPassword: vi.fn(async () => "hash"), createSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: mocks.user, $transaction: async (fn: (tx: unknown) => unknown) => fn({ user: mocks.user, session: mocks.session }) } }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: mocks.audit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
import { manageTeacher } from "@/actions/teachers";
import { registerAction } from "@/app/kayit/actions";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
describe("Öğretmen hesap güvenliği", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.requireAdmin.mockResolvedValue({ id: "admin" }); });
  it("sahte öğretmen kayıt isteğini veritabanına erişmeden reddeder", async () => {
    const state = await registerAction({}, form({ rol: "ogretmen", name: "Sahte Öğretmen", email: "test@example.com", password: "password123", password2: "password123" }));
    expect(state.error).toBeTruthy();
    expect(mocks.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.user.create).not.toHaveBeenCalled();
  });
  it("yetkisiz kullanıcıyı işlemden önce reddeder", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("redirect"));
    await expect(manageTeacher({}, form({ operation: "create" }))).rejects.toThrow("redirect");
    expect(mocks.user.create).not.toHaveBeenCalled();
  });
  it("yöneticinin kendisini pasifleştirmesini engeller", async () => {
    mocks.user.findUnique.mockResolvedValue({ id: "admin", isAdmin: true, role: "TEACHER", disabledAt: null });
    const state = await manageTeacher({}, form({ operation: "disable", id: "admin" }));
    expect(state.error).toContain("Kendi");
    expect(mocks.user.update).not.toHaveBeenCalled();
  });
  it("son etkin yöneticinin yetkisini kaldıramaz", async () => {
    mocks.user.findUnique.mockResolvedValue({ isAdmin: true, role: "TEACHER", disabledAt: null });
    mocks.user.count.mockResolvedValue(1);
    const state = await manageTeacher({}, form({ operation: "update", id: "other" }));
    expect(state.error).toContain("Son etkin yönetici");
    expect(mocks.user.update).not.toHaveBeenCalled();
  });
  it("yeni öğretmene tek seferlik geçici şifre ve zorunlu değişim atar", async () => {
    mocks.user.findUnique.mockResolvedValueOnce({ isAdmin: true, role: "TEACHER" }).mockResolvedValueOnce(null);
    mocks.user.create.mockResolvedValue({ id: "new" });
    const state = await manageTeacher({}, form({ operation: "create", name: "Yeni Öğretmen", email: "new@example.com" }));
    expect(state.password).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789]{14}$/);
    expect(mocks.user.create).toHaveBeenCalledWith({ data: expect.objectContaining({ mustChangePassword: true, role: "TEACHER" }) });
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "TEACHER_CREATE" }));
    expect(JSON.stringify(mocks.audit.mock.calls)).not.toContain(state.password);
  });
  it("şifre sıfırlarken tüm eski oturumları kapatır", async () => {
    mocks.user.findUnique.mockResolvedValue({ isAdmin: true, role: "TEACHER" });
    const state = await manageTeacher({}, form({ operation: "reset", id: "teacher" }));
    expect(state.password).toHaveLength(14);
    expect(mocks.session.deleteMany).toHaveBeenCalledWith({ where: { userId: "teacher" } });
    expect(mocks.user.update).toHaveBeenCalledWith({ where: { id: "teacher" }, data: expect.objectContaining({ mustChangePassword: true }) });
  });
});
