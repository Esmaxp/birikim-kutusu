import { expect, it } from "vitest";
import { assertDevOnly } from "../scripts/guard-dev-only.mjs";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolve } from "node:path";
it("üretim ve dosya dışı bağlantıları engeller; reset için istisna tanımaz", () => {
  for (const values of [{ NODE_ENV: "production", DATABASE_URL: "file:./dev.db" }, { NODE_ENV: "development", DATABASE_URL: "postgres://localhost/test" }] as const) {
    expect(() => assertDevOnly(false, values)).toThrow();
    expect(() => assertDevOnly(false, { ...values, ALLOW_SEED: "true" })).not.toThrow();
    expect(() => assertDevOnly(true, { ...values, ALLOW_SEED: "true" })).toThrow();
  }
  expect(() => assertDevOnly(false, { NODE_ENV: "development", DATABASE_URL: "file:./dev.db" })).not.toThrow();
});
it("komut satırında üretim engeli kod 1 döndürür ve guard her zincirin başındadır", () => {
  const result = spawnSync(process.execPath, [resolve("scripts/guard-dev-only.mjs")], { env: { ...process.env, NODE_ENV: "production", ALLOW_SEED: "false" }, encoding: "utf8" });
  expect(result.status).toBe(1);
  const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
  for (const key of ["setup", "db:seed", "db:reset"]) expect(scripts[key]).toMatch(/^node scripts\/guard-dev-only.mjs(?: --no-override)? && /);
  expect(scripts["db:reset"]).toContain("guard-dev-only.mjs --no-override && prisma db push --force-reset");
});
it("üç npm komutu üretimde veritabanını oluşturmadan çıkar", () => {
  const directory = mkdtempSync(join(tmpdir(), "bk-guard-test-"));
  const database = join(directory, "untouched.db");
  try {
    for (const script of ["setup", "db:seed", "db:reset"]) {
      const result = spawnSync(process.execPath, [process.env.npm_execpath!, "run", script], { env: { ...process.env, NODE_ENV: "production", DATABASE_URL: `file:${database.replaceAll("\\", "/")}`, ALLOW_SEED: "false" }, encoding: "utf8", timeout: 15000 });
      expect(result.status, result.stderr).toBe(1);
      expect(result.stderr).toMatch(/engellendi|yasaktır/);
      expect(existsSync(database)).toBe(false);
    }
  } finally { if (resolve(directory).startsWith(resolve(tmpdir()) + "\\") || resolve(directory).startsWith(resolve(tmpdir()) + "/")) rmSync(directory, { recursive: true, force: true }); }
}, 60000);
