import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function loadLocalEnv() {
  if (existsSync(".env")) process.loadEnvFile(".env");
}
export function isProductionLike(env = process.env) {
  return env.NODE_ENV === "production" || !env.DATABASE_URL?.startsWith("file:");
}
export function assertDevOnly(noOverride = false, env = process.env) {
  if (isProductionLike(env) && (noOverride || env.ALLOW_SEED !== "true")) throw new Error(noOverride ? "Üretim benzeri ortamda veritabanı sıfırlama kesinlikle yasaktır." : "Üretim benzeri ortamda seed/setup engellendi. Bilinçli çalıştırmak için ALLOW_SEED=true gereklidir.");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { loadLocalEnv(); assertDevOnly(process.argv.includes("--no-override")); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
