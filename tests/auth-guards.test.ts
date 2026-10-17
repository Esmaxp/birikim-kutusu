import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ find: vi.fn(), remove: vi.fn(), cookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("@/lib/prisma", () => ({ prisma: { session: { findUnique: mocks.find, deleteMany: mocks.remove } } }));
import { getCurrentUser, requireUser, requireAdmin } from "@/lib/auth";
function session(overrides: Record<string, unknown> = {}) {
  return { id: "session", userId: "user", expiresAt: new Date(Date.now() + 7 * 86400000), user: { id: "user", role: "TEACHER", isAdmin: false, mustChangePassword: false, disabledAt: null, ...overrides } };
}
describe("Oturum korumaları", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.cookie.mockReturnValue({ value: "token" }); });
  it("pasif kullanıcının tüm oturumlarını siler", async () => {
    mocks.find.mockResolvedValue(session({ disabledAt: new Date() }));
    expect(await getCurrentUser()).toBeNull();
    expect(mocks.remove).toHaveBeenCalledWith({ where: { userId: "user" } });
  });
  it("geçici şifreyle panel erişimini engeller", async () => {
    mocks.find.mockResolvedValue(session({ mustChangePassword: true }));
    await expect(requireUser(["TEACHER"])).rejects.toThrow("redirect:/hesap/sifre");
    expect(await requireUser(undefined, true)).toMatchObject({ mustChangePassword: true });
  });
  it("yönetici olmayan öğretmeni yönetim ekranından uzaklaştırır", async () => {
    mocks.find.mockResolvedValue(session());
    await expect(requireAdmin()).rejects.toThrow("redirect:/ogretmen");
  });
});
