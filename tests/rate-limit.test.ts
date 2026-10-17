import { expect, it, vi } from "vitest";
import { InMemoryRateLimiter } from "@/lib/rate-limit";
it("pencere dolunca reddeder ve süre bitince tekrar izin verir", async () => {
  const now = vi.spyOn(Date, "now").mockReturnValue(100000);
  try {
    const limiter = new InMemoryRateLimiter();
    expect((await limiter.check("email", 2, 1000)).allowed).toBe(true);
    expect((await limiter.check("email", 2, 1000)).allowed).toBe(true);
    expect((await limiter.check("email", 2, 1000)).allowed).toBe(false);
    now.mockReturnValue(101001);
    expect((await limiter.check("email", 2, 1000)).allowed).toBe(true);
  } finally { now.mockRestore(); }
});
it("anahtar sınırında etkin sayaçları silmez, boşalan anahtarları temizler", async () => {
  const now = vi.spyOn(Date, "now").mockReturnValue(100000);
  try {
    const limiter = new InMemoryRateLimiter();
    for (let i = 0; i < 50000; i++) await limiter.check(`key:${i}`, 1, 1000);
    expect((await limiter.check("overflow", 1, 1000)).allowed).toBe(false);
    expect((await limiter.check("key:0", 1, 1000)).allowed).toBe(false);
    now.mockReturnValue(102000);
    expect((await limiter.check("overflow", 1, 1000)).allowed).toBe(true);
  } finally { now.mockRestore(); }
});
