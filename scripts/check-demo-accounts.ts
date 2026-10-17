import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  let count = 0;
  for (const user of await db.user.findMany({ select: { passwordHash: true } })) if (await bcrypt.compare("birikim123", user.passwordHash)) count++;
  console.log(`${count} hesap varsayılan demo şifresini kullanıyor.`);
  if (count) process.exitCode = 1;
}
main().catch(() => { console.error("Demo hesap denetimi başarısız."); process.exitCode = 1; }).finally(() => db.$disconnect());
