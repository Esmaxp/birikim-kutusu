/**
 * Rate limiter arayüzü — şimdilik bellek içi; üretimde Redis ile değiştirilebilir.
 */
export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

type WindowEntry = {
  timestamps: number[];
};

/**
 * Sliding-window sayaç. Tek süreç / tek instance için uygundur.
 * Çok instance'lı üretimde Redis (veya benzeri) implementasyonu bağlanmalı.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly store = new Map<string, WindowEntry>();

  async check(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const cutoff = now - windowMs;
    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= limit) {
      const oldest = entry.timestamps[0] ?? now;
      const retryAfterSec = Math.max(
        1,
        Math.ceil((oldest + windowMs - now) / 1000)
      );
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: Math.max(0, limit - entry.timestamps.length),
      retryAfterSec: 0,
    };
  }
}

/** Uygulama genelinde paylaşılan limiter (hot-reload'da tek örnek). */
const globalForLimiter = globalThis as unknown as {
  rateLimiter?: RateLimiter;
};

export const rateLimiter: RateLimiter =
  globalForLimiter.rateLimiter ?? new InMemoryRateLimiter();

if (process.env.NODE_ENV !== "production") {
  globalForLimiter.rateLimiter = rateLimiter;
}

/**
 * Geliştirmede sınırlar bol tutulur; deneme yaparken kilitlenmemek için.
 * Üretimde gerçek değerler geçerlidir.
 */
const IS_PROD = process.env.NODE_ENV === "production";

export const LOGIN_LIMIT = IS_PROD ? 5 : 100;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 dk
// Aynı evden/okuldan anne-baba arka arkaya kayıt olabilir; sınır buna göre.
export const REGISTER_LIMIT = IS_PROD ? 10 : 100;
export const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 saat
export const UPLOAD_LIMIT = 30;
export const UPLOAD_WINDOW_MS = 60 * 60 * 1000; // 1 saat
