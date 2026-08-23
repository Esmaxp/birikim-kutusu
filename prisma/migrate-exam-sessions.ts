/**
 * Tek seferlik geçiş betiği: eski (deprecated) ExamAnalysis kayıtlarını
 * yeni ExamSession modeline aktarır — öğrenci başına en fazla bir ExamAnalysis
 * olduğundan hedefte de öğrenci başına tek bir "aktarılan" ExamSession oluşur.
 *
 * ExamAnalysis'te doğru/yanlış/net gibi ders bazlı sınav verisi yoktur (sadece
 * konu/tip bazlı yanlış sayıları ve zaman içindeki puan noktaları); bu yüzden
 * ders satırları yalnızca süre bilgisiyle (net=0) aktarılır ve konu/tip yanlış
 * dökümü ile puan geçmişi genelDegerlendirme alanına özetlenerek yazılır —
 * hiçbir veri sessizce atılmaz. ExamAnalysis kaydının kendisi silinmez.
 *
 * Çalıştırma: npx tsx prisma/migrate-exam-sessions.ts
 * Yeniden çalıştırma güvenlidir: bir öğrenci için daha önce aktarılmış kayıt
 * varsa ("[Aktarım]" ön ekiyle) o öğrenci atlanır.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AKTARIM_ONEKI = "[Aktarım] ";

async function main() {
  const legacyExams = await prisma.examAnalysis.findMany({
    include: {
      student: true,
      subjects: { orderBy: { order: "asc" } },
      wrongs: { orderBy: { order: "asc" } },
      scores: { orderBy: { order: "asc" } },
    },
  });

  if (legacyExams.length === 0) {
    console.log("Aktarılacak ExamAnalysis kaydı yok.");
    return;
  }

  let aktarilan = 0;
  let atlanan = 0;

  for (const exam of legacyExams) {
    const already = await prisma.examSession.findFirst({
      where: { studentId: exam.studentId, sinavAdi: { startsWith: AKTARIM_ONEKI } },
      select: { id: true },
    });
    if (already) {
      atlanan++;
      continue;
    }

    const konuOzet = exam.wrongs
      .filter((w) => w.kind === "TOPIC")
      .map((w) => `${w.label}: ${w.count} yanlış`)
      .join(", ");
    const tipOzet = exam.wrongs
      .filter((w) => w.kind === "TYPE")
      .map((w) => `${w.label}: ${w.count} yanlış`)
      .join(", ");
    const puanGecmisi = exam.scores
      .map((s) => `${s.ay}: ${s.puan}`)
      .join(", ");

    const notParcalari = [
      konuOzet && `Konu bazlı yanlışlar (eski kayıt): ${konuOzet}.`,
      tipOzet && `Soru tipi bazlı yanlışlar (eski kayıt): ${tipOzet}.`,
      puanGecmisi && `Geçmiş puan noktaları (eski kayıt): ${puanGecmisi}.`,
    ].filter(Boolean);

    const sonPuan = exam.scores.at(-1)?.puan ?? null;

    await prisma.examSession.create({
      data: {
        studentId: exam.studentId,
        sinavAdi: `${AKTARIM_ONEKI}${exam.dosyaAdi ?? "Deneme Analizi"}`,
        sinavTarihi: exam.updatedAt,
        toplamCozumSuresi: exam.subjects.reduce((s, d) => s + d.dakika, 0) || null,
        puan: sonPuan,
        genelDegerlendirme: notParcalari.length
          ? notParcalari.join("\n")
          : "Eski deneme analizi sisteminden aktarılmıştır; ders bazlı doğru/yanlış verisi mevcut değildi.",
        subjects: {
          create: exam.subjects.map((s, i) => ({
            ders: s.ders,
            cozumSuresi: s.dakika,
            order: i,
          })),
        },
        createdAt: exam.createdAt,
      },
    });

    aktarilan++;
  }

  console.log(
    `✓ Geçiş tamamlandı. Aktarılan: ${aktarilan}, zaten aktarılmış (atlandı): ${atlanan}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
