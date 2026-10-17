import { randomBytes } from "node:crypto";
import { loadLocalEnv, assertDevOnly, isProductionLike } from "../scripts/guard-dev-only.mjs";
import { generateInviteCode, hashInviteCode, INVITE_EXPIRY_DAYS } from "../src/lib/invite";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

loadLocalEnv();
assertDevOnly();
if (isProductionLike() && !process.env.SEED_PASSWORD) throw new Error("SEED_PASSWORD is required when seeding production-like environments.");
const prisma = new PrismaClient();

const SUBELER = ["5A", "5B", "5C", "6A", "6B"];
const NAME_POOL = [
  "Elif Kaya",
  "Burak Demir",
  "Zeynep Çelik",
  "Sinan Demir",
  "Ege Yıldız",
  "Zeynep Kurt",
  "Mert Aydın",
  "Deniz Şahin",
  "Ali Öztürk",
  "Ayşe Arslan",
  "Cem Yılmaz",
  "Selin Koç",
  "Kaan Aksoy",
  "Buse Er",
  "Emir Kılıç",
  "Nil Aktaş",
];

const generatedSeedPassword = !process.env.SEED_PASSWORD;
const seedPassword = process.env.SEED_PASSWORD || randomBytes(24).toString("base64url");
if (seedPassword.length < 12 || Buffer.byteLength(seedPassword) > 72) throw new Error("SEED_PASSWORD must be 12+ characters and at most 72 bytes.");

/** "Elif Kaya" -> "elif.kaya" (Türkçe karakterler sadeleştirilir) */
function slugify(name: string) {
  const map: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    İ: "i",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };
  return name
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
}

async function main() {
  console.log("→ Veritabanı temizleniyor...");
  await prisma.session.deleteMany();
  await prisma.studentParent.deleteMany();
  await prisma.scorePoint.deleteMany();
  await prisma.wrongItem.deleteMany();
  await prisma.subjectTime.deleteMany();
  await prisma.examAnalysis.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.book.deleteMany();
  await prisma.note.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.student.deleteMany();
  await prisma.schoolClass.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash(seedPassword, 10);

  console.log("→ Personel hesapları oluşturuluyor...");
  const teacher = await prisma.user.create({
    data: {
      email: "ogretmen@birikim.k12.tr",
      passwordHash: pw,
      name: "Ayşe Yılmaz",
      role: "TEACHER",
      isAdmin: true,
      title: "Sınıf Rehber Öğretmeni",
    },
  });

  // Rehber öğretmen ayrı bir rol değil; TEACHER rolüyle girer, uzmanlığı title'da.
  const pdr = await prisma.user.create({
    data: {
      email: "pdr@birikim.k12.tr",
      passwordHash: pw,
      name: "Murat Şen",
      role: "TEACHER",
      title: "Rehber Öğretmen (PDR)",
    },
  });

  console.log("→ Şubeler ve öğrenciler oluşturuluyor...");
  const usedEmails = new Set<string>([teacher.email, pdr.email]);

  for (const [subeIndex, sube] of SUBELER.entries()) {
    const schoolClass = await prisma.schoolClass.create({
      data: { name: sube, order: subeIndex },
    });

    const baseNo = 120 + subeIndex * 20;

    for (let i = 0; i < 8; i++) {
      const name = NAME_POOL[(subeIndex * 8 + i) % NAME_POOL.length];
      const soyad = name.split(" ")[1];

      let email = `${slugify(name)}@ogrenci.birikim.k12.tr`;
      if (usedEmails.has(email)) {
        email = `${slugify(name)}${subeIndex}${i}@ogrenci.birikim.k12.tr`;
      }
      usedEmails.add(email);

      const studentUser = await prisma.user.create({
        data: { email, passwordHash: pw, name, role: "STUDENT" },
      });

      let parentEmail = `veli.${slugify(name)}@birikim.k12.tr`;
      if (usedEmails.has(parentEmail)) {
        parentEmail = `veli.${slugify(name)}${subeIndex}${i}@birikim.k12.tr`;
      }
      usedEmails.add(parentEmail);

      const anne = await prisma.user.create({
        data: {
          email: parentEmail,
          passwordHash: pw,
          name: `Ayşe ${soyad}`,
          role: "PARENT",
        },
      });

      await prisma.student.create({
        data: {
          name,
          no: baseNo + i,
          classId: schoolClass.id,
          userId: studentUser.id,
          veliAdi: `Ayşe ${soyad}`,
          telefon: `0555 ${100 + i} ${20 + subeIndex} ${10 + i}`,
          adres: `Örnek Mah. Çınar Sok. No:${i + 1}, İstanbul`,
          photoUrl: null,
          parents: { create: [{ parentId: anne.id, yakinlik: "ANNE" }] },
        },
      });
    }
  }

  console.log("→ İkinci veli ve kardeş örnekleri ekleniyor...");

  // Bir öğrencinin iki velisi: Elif Kaya'nın annesi + babası
  const elifKaya = await prisma.student.findFirstOrThrow({
    where: { name: "Elif Kaya", class: { name: "5A" } },
  });
  const elifBaba = await prisma.user.create({
    data: {
      email: "baba.elif.kaya@birikim.k12.tr",
      passwordHash: pw,
      name: "Mehmet Kaya",
      role: "PARENT",
    },
  });
  await prisma.studentParent.create({
    data: { studentId: elifKaya.id, parentId: elifBaba.id, yakinlik: "BABA" },
  });

  // Bir velinin iki çocuğu: 5A'daki Demir kardeşler
  const demirler = await prisma.student.findMany({
    where: { class: { name: "5A" }, name: { in: ["Burak Demir", "Sinan Demir"] } },
  });
  if (demirler.length) {
    const demirBaba = await prisma.user.create({
      data: {
        email: "baba.demir@birikim.k12.tr",
        passwordHash: pw,
        name: "Hasan Demir",
        role: "PARENT",
      },
    });
    await prisma.studentParent.createMany({
      data: demirler.map((s) => ({
        studentId: s.id,
        parentId: demirBaba.id,
        yakinlik: "BABA",
      })),
    });
  }

  console.log("→ Örnek deneme analizi ve içerikler ekleniyor (Elif Kaya / 5A)...");
  const elif = await prisma.student.findFirstOrThrow({
    where: { name: "Elif Kaya", class: { name: "5A" } },
  });

  await prisma.examAnalysis.create({
    data: {
      studentId: elif.id,
      dosyaAdi: "Sinav_Sonuc_Mayis.pdf",
      konuToplamSoru: 60,
      tipToplamSoru: 200,
      subjects: {
        create: [
          { ders: "Matematik", dakika: 120, order: 0 },
          { ders: "Türkçe", dakika: 90, order: 1 },
          { ders: "Fizik", dakika: 90, order: 2 },
          { ders: "Kimya", dakika: 90, order: 3 },
        ],
      },
      wrongs: {
        create: [
          { kind: "TOPIC", label: "Matematik", count: 4, order: 0 },
          { kind: "TOPIC", label: "Türkçe", count: 3, order: 1 },
          { kind: "TOPIC", label: "Matematik Modüller", count: 2, order: 2 },
          { kind: "TOPIC", label: "Kimya", count: 1, order: 3 },
          { kind: "TYPE", label: "Soru Tipi 2", count: 17, order: 0 },
          { kind: "TYPE", label: "Soru Tipi 3", count: 27, order: 1 },
          { kind: "TYPE", label: "Soru Yanlış 1", count: 5, order: 2 },
        ],
      },
      scores: {
        create: [
          { ay: "Ocak", puan: 19, order: 0 },
          { ay: "Şubat", puan: 46, order: 1 },
          { ay: "Mart", puan: 33, order: 2 },
          { ay: "Nisan", puan: 37, order: 3 },
          { ay: "Mayıs", puan: 48, order: 4 },
        ],
      },
    },
  });

  const kitap = await prisma.book.create({
    data: {
      studentId: elif.id,
      title: "Küçük Prens",
      author: "Antoine de Saint-Exupéry",
      status: "Okundu",
      pages: 96,
      rating: 5,
      review: "Çok sevdim, tekrar okuyacağım.",
      addedById: elif.userId,
    },
  });

  await prisma.book.create({
    data: {
      studentId: elif.id,
      title: "Şeker Portakalı",
      author: "José Mauro de Vasconcelos",
      status: "Okunuyor",
      pages: 182,
      addedById: elif.userId,
    },
  });

  await prisma.quote.createMany({
    data: [
      {
        studentId: elif.id,
        text: "İnsan ancak yüreğiyle doğru görebilir. Gerçeğin mayası gözle görülmez.",
        source: "Küçük Prens",
        bookId: kitap.id,
        pageNo: 72,
        favorite: true,
      },
      {
        studentId: elif.id,
        text: "Bir şeyleri değiştirmek isteyen insan, önce kendisinden başlamalıdır.",
        source: "Sokrates",
      },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        studentId: elif.id,
        authorId: pdr.id,
        authorRole: "TEACHER",
        title: "Sınav kaygısı görüşmesi",
        body: "Bu hafta yaptığımız görüşmede sınav öncesi nefes egzersizlerini konuştuk. Her akşam 5 dakika uygulamanı ve deneme sonrası kendini not yerine gelişimine göre değerlendirmeni istiyorum. Bir sonraki görüşmemiz 2 hafta sonra.",
        visibleToStudent: true,
      },
      {
        studentId: elif.id,
        authorId: pdr.id,
        authorRole: "TEACHER",
        title: "Çalışma programı",
        body: "Matematik için günlük 40 soru hedefini 25'e düşürüp konu tekrarına ağırlık vermeni öneriyorum. Süre yönetimi grafiğinde Matematik'te 120 dakika görünüyor, bunu kademeli olarak 90 dakikaya çekelim.",
        visibleToStudent: true,
      },
      {
        studentId: elif.id,
        authorId: teacher.id,
        authorRole: "TEACHER",
        body: "Veli görüşmesinde konuşulacak: derse katılımı arttı.",
        visibleToStudent: false,
      },
    ],
  });

  console.log("→ Deneme analizi (ExamSession) örnekleri ekleniyor (Elif Kaya / 5A)...");

  const netHesapla = (dogru: number, yanlis: number) =>
    Math.round((dogru - yanlis / 3) * 100) / 100;

  const subjectRows = (
    rows: { ders: string; dogru: number; yanlis: number; bos: number; sure: number; sira: number }[]
  ) =>
    rows.map((r, i) => ({
      ders: r.ders,
      cozumSuresi: r.sure,
      cozumSirasi: r.sira,
      dogru: r.dogru,
      yanlis: r.yanlis,
      bos: r.bos,
      net: netHesapla(r.dogru, r.yanlis),
      order: i,
    }));

  const nisanDersler = [
    { ders: "Türkçe", dogru: 15, yanlis: 3, bos: 2, sure: 30, sira: 2 },
    { ders: "Matematik", dogru: 12, yanlis: 5, bos: 3, sure: 40, sira: 1 },
    { ders: "Fen Bilimleri", dogru: 14, yanlis: 4, bos: 2, sure: 25, sira: 3 },
    { ders: "Sosyal Bilgiler", dogru: 16, yanlis: 2, bos: 2, sure: 20, sira: 4 },
    { ders: "İngilizce", dogru: 9, yanlis: 6, bos: 5, sure: 15, sira: 5 },
    { ders: "Din Kültürü", dogru: 8, yanlis: 2, bos: 0, sure: 10, sira: 6 },
  ];
  const nisanToplamNet = nisanDersler.reduce(
    (s, r) => s + netHesapla(r.dogru, r.yanlis),
    0
  );

  await prisma.examSession.create({
    data: {
      studentId: elif.id,
      sinavAdi: "Nisan Ayı Genel Deneme",
      sinavTarihi: new Date("2026-04-18"),
      sinavSaati: "09:30",
      gorusmeTarihi: new Date("2026-04-20"),
      danismanId: pdr.id,
      toplamCozumSuresi: 140,
      icselProblem: true,
      icselAciklama: "Sınav öncesi kaygı yaşadığını belirtti.",
      dissalProblem: false,
      hataYapildi: true,
      hataTurleri: JSON.stringify(["DIKKATSIZLIK", "SURE_YONETIMI"]),
      toplamNet: Math.round(nisanToplamNet * 100) / 100,
      puan: 412.5,
      yuzdelikDilim: 82,
      turkiyeSirasi: 18450,
      kurumSirasi: 12,
      sinifSirasi: 3,
      genelDegerlendirme:
        "Matematik ve İngilizce'de süre yönetimi zayıf; Sosyal Bilgiler istikrarlı.",
      kararlarOneriler:
        "Matematik için günlük 25 soru hedefi; İngilizce kelime tekrarına ağırlık.",
      ogrenciOnayAt: new Date("2026-04-21"),
      subjects: { create: subjectRows(nisanDersler) },
      gains: {
        create: [
          { ders: "Matematik", metin: "Kesirlerle işlemler", order: 0 },
          { ders: "Matematik", metin: "Oran orantı", order: 1 },
          { ders: "İngilizce", metin: "Present perfect tense", order: 0 },
        ],
      },
      createdById: teacher.id,
    },
  });

  const mayisDersler = [
    { ders: "Türkçe", dogru: 17, yanlis: 2, bos: 1, sure: 28, sira: 2 },
    { ders: "Matematik", dogru: 15, yanlis: 3, bos: 2, sure: 38, sira: 1 },
    { ders: "Fen Bilimleri", dogru: 16, yanlis: 3, bos: 1, sure: 24, sira: 3 },
    { ders: "Sosyal Bilgiler", dogru: 17, yanlis: 1, bos: 2, sure: 18, sira: 4 },
    { ders: "İngilizce", dogru: 12, yanlis: 5, bos: 3, sure: 15, sira: 5 },
    { ders: "Din Kültürü", dogru: 9, yanlis: 1, bos: 0, sure: 9, sira: 6 },
  ];
  const mayisToplamNet = mayisDersler.reduce(
    (s, r) => s + netHesapla(r.dogru, r.yanlis),
    0
  );

  await prisma.examSession.create({
    data: {
      studentId: elif.id,
      sinavAdi: "Mayıs Ayı Genel Deneme",
      sinavTarihi: new Date("2026-05-16"),
      sinavSaati: "09:30",
      danismanId: pdr.id,
      toplamCozumSuresi: 132,
      hataYapildi: false,
      toplamNet: Math.round(mayisToplamNet * 100) / 100,
      puan: 438.2,
      yuzdelikDilim: 91,
      turkiyeSirasi: 9820,
      kurumSirasi: 4,
      sinifSirasi: 1,
      genelDegerlendirme: "Belirgin bir gelişim var, süre yönetimi düzeldi.",
      subjects: { create: subjectRows(mayisDersler) },
      gains: {
        create: [{ ders: "İngilizce", metin: "Kelime bilgisi tekrarına devam", order: 0 }],
      },
      createdById: teacher.id,
    },
  });

  if (process.env.NODE_ENV !== "production") {
    const school = await prisma.schoolClass.findFirstOrThrow();
    const unregistered = await prisma.student.create({ data: { name: "Davet Test", no: 9999, classId: school.id } });
    for (const kind of ["STUDENT", "PARENT"]) {
      const code = generateInviteCode();
      await prisma.inviteCode.create({ data: { codeHash: hashInviteCode(code), kind, studentId: unregistered.id, yakinlik: kind === "PARENT" ? "VELI" : null, createdById: teacher.id, expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 86400000) } });
      console.log(`Demo invite (${kind}, Davet Test): ${code}`);
    }
  }

  console.log("\n✓ Seed tamamlandı.\n");
  console.log("Demo hesaplar oluşturuldu.");
  if (generatedSeedPassword) console.log(`Geçici seed parolası (yalnızca bu işlemde gösterilir): ${seedPassword}`);
  else console.log("Seed parolası SEED_PASSWORD ortam değişkeninden alındı; güvenlik için terminale yazdırılmadı.");
  console.log("  Öğretmen : ogretmen@birikim.k12.tr");
  console.log("  Rehber   : pdr@birikim.k12.tr (öğretmen girişi)");
  console.log("  Öğrenci  : elif.kaya@ogrenci.birikim.k12.tr");
  console.log("  Veli/anne: veli.elif.kaya@birikim.k12.tr");
  console.log("  Veli/baba: baba.elif.kaya@birikim.k12.tr (aynı öğrencinin 2. velisi)");
  console.log("  Veli/2 çocuk: baba.demir@birikim.k12.tr");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
