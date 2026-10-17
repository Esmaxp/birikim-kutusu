import { afterEach, expect, it, vi } from "vitest";
import { getClientIp } from "@/lib/client-ip";
afterEach(() => vi.unstubAllEnvs());
it("varsayılan ve none kipinde sahte tüm başlıkları yok sayar", () => {
  for (const mode of [undefined, "none"]) { vi.stubEnv("TRUST_PROXY", mode); expect(getClientIp(new Headers({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "1.2.3.4", "cf-connecting-ip": "1.2.3.4" }))).toBeNull(); }
});
it("hops:1 ve hops:2 sağdan güvenilen atlamayı kullanır", () => {
  const h = new Headers({ "x-forwarded-for": "8.8.8.8, 1.2.3.4, 10.0.0.1" });
  vi.stubEnv("TRUST_PROXY", "hops:1"); expect(getClientIp(h)).toBe("10.0.0.1");
  vi.stubEnv("TRUST_PROXY", "hops:2"); expect(getClientIp(h)).toBe("1.2.3.4");
  expect(getClientIp(new Headers({ "x-forwarded-for": "1.2.3.4" }))).toBeNull();
  expect(getClientIp(new Headers({ "x-forwarded-for": "invalid,10.0.0.1" }))).toBeNull();
});
it("cloudflare yalnızca kendi başlığını kullanır ve IP doğrular", () => {
  vi.stubEnv("TRUST_PROXY", "cloudflare");
  expect(getClientIp(new Headers({ "cf-connecting-ip": "2001:db8::1" }))).toBe("2001:db8::1");
  expect(getClientIp(new Headers({ "cf-connecting-ip": "garbage", "x-real-ip": "1.2.3.4" }))).toBeNull();
});
