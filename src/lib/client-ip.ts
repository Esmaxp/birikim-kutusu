import { isIP } from "node:net";
const runtime = globalThis as typeof globalThis & { proxyWarning?: boolean };
export function warnProxyConfiguration() {
  if (process.env.NODE_ENV === "production" && !process.env.TRUST_PROXY && !runtime.proxyWarning) {
    console.warn("[rate-limit] TRUST_PROXY tanımsız; IP tabanlı sınırlama devre dışı.");
    runtime.proxyWarning = true;
  }
}
export function getClientIp(h: Headers): string | null {
  const mode = process.env.TRUST_PROXY ?? "none";
  let ip: string | undefined | null;
  if (mode === "cloudflare") ip = h.get("cf-connecting-ip")?.trim();
  else if (/^hops:[1-9]\d*$/.test(mode)) {
    const hops = Number(mode.slice(5));
    const chain = h.get("x-forwarded-for")?.split(",").map((part) => part.trim());
    if (chain && hops <= chain.length) ip = chain[chain.length - hops];
  }
  return ip && isIP(ip) ? ip : null;
}
