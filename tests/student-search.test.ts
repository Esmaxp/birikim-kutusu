import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), find: vi.fn(), limit: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.guard }));
vi.mock("@/lib/prisma", () => ({ prisma: { student: { findMany: mocks.find } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimiter: { check: mocks.limit } }));
import { GET } from "@/app/api/students/search/route";
describe("Student command search", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue({ id: "teacher" }); mocks.limit.mockResolvedValue({ allowed: true }); mocks.find.mockResolvedValue([]); });
  it("requires a teacher before querying data", async () => {
    mocks.guard.mockRejectedValue(new Error("unauthorized"));
    await expect(GET(new Request("http://localhost/api/students/search?q=Ada"))).rejects.toThrow("unauthorized");
    expect(mocks.guard).toHaveBeenCalledWith(["TEACHER"]);
    expect(mocks.find).not.toHaveBeenCalled();
  });
  it("caps results and selects only the public search fields", async () => {
    const response = await GET(new Request("http://localhost/api/students/search?q=123"));
    expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ take: 10, select: { id: true, name: true, no: true, class: { select: { name: true } }, photoUrl: true }, where: { OR: [{ name: { contains: "123" } }, { no: 123 }] } }));
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
  it("rejects oversized queries without a database lookup", async () => {
    const response = await GET(new Request(`http://localhost/api/students/search?q=${"a".repeat(81)}`));
    expect(await response.json()).toEqual([]); expect(mocks.find).not.toHaveBeenCalled();
  });
  it("returns retry information when rate limited", async () => {
    mocks.limit.mockResolvedValue({ allowed: false, retryAfterSec: 30 });
    const response = await GET(new Request("http://localhost/api/students/search?q=Ada"));
    expect(response.status).toBe(429); expect(response.headers.get("Retry-After")).toBe("30"); expect(mocks.find).not.toHaveBeenCalled();
  });
});
