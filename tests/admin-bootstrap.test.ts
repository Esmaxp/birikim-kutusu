import { expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

it("boş veritabanında yöneticiyi oluşturur ve mevcut öğretmeni yükseltir", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bk-admin-test-"));
  const databaseUrl = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
  const password = randomBytes(18).toString("hex");
  const env = { ...process.env, DATABASE_URL: databaseUrl, ADMIN_PASSWORD: password };
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const run = (script: string, args: string[]) => spawnSync(process.execPath, [resolve(script), ...args], { env, encoding: "utf8", timeout: 30000 });
  try {
    const push = run("node_modules/prisma/build/index.js", ["db", "push", "--skip-generate"]);
    expect(push.status, push.stderr).toBe(0);
    const args = ["scripts/create-admin.ts", "--email", "admin@example.com", "--name", "Test Yönetici"];
    const create = run("node_modules/tsx/dist/cli.mjs", args);
    expect(create.status, create.stderr).toBe(0);
    expect(create.stdout + create.stderr).not.toContain(password);
    const user = await db.user.findUniqueOrThrow({ where: { email: "admin@example.com" } });
    expect(user).toMatchObject({ role: "TEACHER", isAdmin: true, mustChangePassword: false });
    expect(await bcrypt.compare(password, user.passwordHash)).toBe(true);
    await db.user.update({ where: { id: user.id }, data: { isAdmin: false } });
    await db.session.create({ data: { token: "old", userId: user.id, expiresAt: new Date(Date.now() + 86400000) } });
    const promote = run("node_modules/tsx/dist/cli.mjs", args);
    expect(promote.status, promote.stderr).toBe(0);
    expect(await db.user.count({ where: { isAdmin: true } })).toBe(1);
    expect(await db.session.count()).toBe(0);
    const short = spawnSync(process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), ...args], { env: { ...env, ADMIN_PASSWORD: "short" }, encoding: "utf8" });
    expect(short.status).toBe(1);
  } finally {
    await db.$disconnect();
    if (resolve(directory).startsWith(resolve(tmpdir()) + "\\") || resolve(directory).startsWith(resolve(tmpdir()) + "/")) await rm(directory, { recursive: true, force: true });
  }
}, 60000);
