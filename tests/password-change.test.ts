import { beforeEach, expect, it, vi } from "vitest";
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const mocks = vi.hoisted(() => ({ update: vi.fn(), remove: vi.fn(), verify: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: async () => ({ id: "user", role: "TEACHER" }), currentSessionToken: async () => "current-token", verifyPassword: mocks.verify, hashPassword: async () => "new-hash" }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUniqueOrThrow: async () => ({ passwordHash: "old-hash" }) }, $transaction: async (fn: (tx: unknown) => unknown) => fn({ user: { updateMany: mocks.update }, session: { deleteMany: mocks.remove } }) } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimiter: { check: async () => ({ allowed: true }) } }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: mocks.audit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
import { changePassword } from "@/app/hesap/sifre/actions";
function fields(password = "new-password-123") {
  const data = new FormData();
  data.set("current", "old-password"); data.set("password", password); data.set("confirmation", password);
  return data;
}
beforeEach(() => { vi.clearAllMocks(); mocks.verify.mockResolvedValue(true); mocks.update.mockResolvedValue({ count: 1 }); });
it("şifre değişiminde mevcut oturumu korur, diğerlerini kapatır", async () => {
  await expect(changePassword({}, fields())).rejects.toThrow("redirect:/ogretmen");
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "user", passwordHash: "old-hash", disabledAt: null }, data: { passwordHash: "new-hash", mustChangePassword: false } });
  expect(mocks.remove).toHaveBeenCalledWith({ where: { userId: "user", token: { not: "current-token" } } });
  expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "PASSWORD_CHANGE" }));
});
it("yanlış mevcut şifreyle değişiklik yapamaz", async () => {
  mocks.verify.mockResolvedValue(false);
  expect((await changePassword({}, fields())).error).toBeTruthy();
  expect(mocks.update).not.toHaveBeenCalled();
});
it("8 karakterden kısa şifreyi reddeder", async () => {
  expect((await changePassword({}, fields("short"))).error).toBeTruthy();
  expect(mocks.update).not.toHaveBeenCalled();
});
