import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
async function main() {
  const expected = process.env.SEED_PASSWORD;
  if (!expected) throw new Error("Denetim için SEED_PASSWORD ortam değişkeni gereklidir.");
  let count = 0;
  for (const user of await db.user.findMany({ select: { passwordHash: true } })) {
    if (await bcrypt.compare(expected, user.passwordHash)) count++;
  }
  console.log(`${count} hesap yapılandırılmış seed parolasını kullanıyor.`);
  if (count) process.exitCode = 1;
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Seed password check failed."); process.exitCode = 1; }).finally(() => db.$disconnect());
