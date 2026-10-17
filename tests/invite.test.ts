import { expect, it } from "vitest";
import { generateInviteCode, normalizeCode, hashInviteCode, redeemInvite, INVITE_ERROR } from "@/lib/invite";
import { parseStudentCsv } from "@/lib/student-csv";
import { PrismaClient } from "@prisma/client";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
it("kod üretir, normalleştirir ve yalnızca HMAC saklar", () => {
  const code = generateInviteCode();
  expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/);
  expect(normalizeCode(` ${code.toLowerCase()} `)).toBe(code.replace("-", ""));
  expect(normalizeCode("OOOOO-11111")).toBeNull();
  expect(hashInviteCode(code)).toMatch(/^[a-f0-9]{64}$/);
  expect(hashInviteCode(code.toLowerCase())).toBe(hashInviteCode(code));
});
it("CSV tekrarlarını ve hatalarını önizlemede gösterir", () => {
  const rows = parseStudentCsv('sube,no,ad\n5A,1,"Ayşe, Yılmaz"\n5A,1,Ali Kaya\n5B,no,X');
  expect(rows[0]).toMatchObject({ ad: "Ayşe, Yılmaz", error: undefined });
  expect(rows[1].error).toBeTruthy(); expect(rows[2].error).toBeTruthy();
});
it("aynı kodu eşzamanlı iki işlemden yalnızca biri kullanabilir; yeniden kullanım reddedilir", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bk-invite-test-"));
  const url = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    const push = spawnSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "db", "push", "--skip-generate"], { env: { ...process.env, DATABASE_URL: url }, encoding: "utf8" });
    expect(push.status, push.stderr).toBe(0);
    const school = await db.schoolClass.create({ data: { name: "5A" } });
    const student = await db.student.create({ data: { name: "Test Öğrenci", no: 1, classId: school.id } });
    const first = await db.user.create({ data: { email: "a@example.com", name: "A", role: "STUDENT", passwordHash: "unused" } });
    const second = await db.user.create({ data: { email: "b@example.com", name: "B", role: "STUDENT", passwordHash: "unused" } });
    const code = generateInviteCode();
    await db.inviteCode.create({ data: { codeHash: hashInviteCode(code), studentId: student.id, kind: "STUDENT", expiresAt: new Date(Date.now() + 86400000) } });
    const attempts = await Promise.allSettled([first, second].map((u) => db.$transaction((tx) => redeemInvite(tx, code, "STUDENT", u.id))));
    expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const used = await db.inviteCode.findFirstOrThrow();
    expect((await db.student.findUniqueOrThrow({ where: { id: student.id } })).userId).toBe(used.usedById);
    await expect(db.$transaction((tx) => redeemInvite(tx, code, "STUDENT", first.id))).rejects.toThrow(INVITE_ERROR);
    expect(await db.student.count()).toBe(1);
    const parent = await db.user.create({ data: { email: "parent@example.com", name: "Veli", role: "PARENT", passwordHash: "unused" } });
    const parentCodes = [generateInviteCode(), generateInviteCode()];
    for (const value of parentCodes) await db.inviteCode.create({ data: { codeHash: hashInviteCode(value), studentId: student.id, kind: "PARENT", yakinlik: "ANNE", expiresAt: new Date(Date.now() + 86400000) } });
    await db.$transaction((tx) => redeemInvite(tx, parentCodes[0], "PARENT", parent.id));
    await expect(db.$transaction((tx) => redeemInvite(tx, parentCodes[1], "PARENT", second.id))).rejects.toThrow(INVITE_ERROR);
    expect(await db.studentParent.count()).toBe(1);
    expect((await db.inviteCode.findUniqueOrThrow({ where: { codeHash: hashInviteCode(parentCodes[1]) } })).usedAt).toBeNull();
  } finally { await db.$disconnect(); if (resolve(directory).startsWith(resolve(tmpdir()) + "\\") || resolve(directory).startsWith(resolve(tmpdir()) + "/")) await rm(directory, { recursive: true, force: true }); }
}, 30000);
