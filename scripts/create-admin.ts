import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { stdin, stdout } from "node:process";
import { emitKeypressEvents } from "node:readline";

function hiddenPassword(): Promise<string> {
  if (!stdin.isTTY) throw new Error("Etkileşimli terminal kullanın veya ADMIN_PASSWORD tanımlayın.");
  stdout.write("Yönetici şifresi (en az 12 karakter): ");
  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    function done() { stdin.setRawMode(false); stdin.pause(); stdin.removeListener("keypress", listener); stdout.write("\n"); }
    function listener(text: string, key: { name?: string; ctrl?: boolean }) {
      if (key.ctrl && key.name === "c") { done(); reject(new Error("İptal edildi.")); }
      else if (key.name === "return") { done(); resolve(value); }
      else if (key.name === "backspace") value = value.slice(0, -1);
      else if (text && !key.ctrl && !/[\x00-\x1f\x7f]/.test(text)) value += text;
    }
    stdin.on("keypress", listener);
  });
}
async function main() {
  const args = process.argv.slice(2);
  const email = args[args.indexOf("--email") + 1]?.trim().toLowerCase();
  const name = args[args.indexOf("--name") + 1]?.trim();
  if (!args.includes("--email") || !args.includes("--name") || !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || name.length < 3 || name.length > 150) throw new Error("Kullanım: npm run admin:create -- --email eposta --name \"Ad Soyad\"");
  const password = process.env.ADMIN_PASSWORD || await hiddenPassword();
  if (password.length < 12 || Buffer.byteLength(password) > 72) throw new Error("Şifre en az 12 karakter ve en fazla 72 bayt olmalıdır.");
  const db = new PrismaClient();
  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing && existing.role !== "TEACHER") throw new Error("Bu adres öğrenci veya veli hesabına ait; başka bir adres kullanın.");
    await db.$transaction(async (tx) => {
      const user = await tx.user.upsert({ where: { email }, create: { email, name, role: "TEACHER", isAdmin: true, passwordHash: await bcrypt.hash(password, 10) }, update: { isAdmin: true, disabledAt: null, mustChangePassword: false, passwordHash: await bcrypt.hash(password, 10) } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "TEACHER_CREATE", entityType: "User", entityId: user.id, meta: JSON.stringify({ source: "admin:create", promoted: !!existing }) } });
    });
    console.log("Yönetici hesabı hazır.");
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Yönetici oluşturulamadı. Parametreleri, şifre uzunluğunu (12–72 bayt) ve veritabanı bağlantısını kontrol edin."); process.exitCode = 1; });
