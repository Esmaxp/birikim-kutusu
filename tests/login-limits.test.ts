import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ compare: vi.fn(), check: vi.fn(), headers: vi.fn() }));
vi.mock("@/lib/auth", () => ({ verifyPassword: mocks.compare, createSession: vi.fn(), destroyAllSessions: vi.fn(), destroySession: vi.fn(), getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: async () => null } } }));
vi.mock("@/lib/rate-limit", () => ({ LOGIN_LIMIT: 10, LOGIN_IP_LIMIT: 30, LOGIN_WINDOW_MS: 900000, rateLimiter: { check: mocks.check } }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
import { loginAction } from "@/app/login/actions";
beforeEach(() => { vi.clearAllMocks(); mocks.check.mockResolvedValue({ allowed: true }); });
it("sahte XFF değerleri hesap sayacını değiştirmez ve bilinmeyen hesapta bcrypt çalışır", async () => {
  vi.stubEnv("TRUST_PROXY", "none");
  try {
    for (const ip of ["1.2.3.4", "5.6.7.8"]) {
      mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": ip }));
      const data = new FormData(); data.set("email", "test@example.com"); data.set("password", "wrong-password");
      await loginAction({}, data);
    }
    expect(mocks.check.mock.calls.map((c) => c[0])).toEqual(["login:acct:test@example.com", "login:acct:test@example.com"]);
    expect(mocks.compare).toHaveBeenCalledTimes(2);
    expect(mocks.compare.mock.calls[0][1]).toMatch(/^\$2a\$10\$/);
  } finally { vi.unstubAllEnvs(); }
});
