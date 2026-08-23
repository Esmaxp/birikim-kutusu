import { prisma } from "./prisma";

export type ExamRow = { id: string; label: string; count: number };
export type ExamData = {
  dosyaAdi: string | null;
  dosyaUrl: string | null;
  konuToplamSoru: number;
  tipToplamSoru: number;
  dersler: { id: string; ders: string; dakika: number }[];
  konuYanlis: ExamRow[];
  tipYanlis: ExamRow[];
  puanlar: { id: string; ay: string; puan: number }[];
  updatedAt: string | null;
};

export function emptyExamData(): ExamData {
  return {
    dosyaAdi: null,
    dosyaUrl: null,
    konuToplamSoru: 60,
    tipToplamSoru: 100,
    dersler: [],
    konuYanlis: [],
    tipYanlis: [],
    puanlar: [],
    updatedAt: null,
  };
}

/** Öğrencinin deneme analizini istemciye gönderilebilir düz nesneye çevirir. */
export async function getExamData(studentId: string): Promise<ExamData> {
  const exam = await prisma.examAnalysis.findUnique({
    where: { studentId },
    include: {
      subjects: { orderBy: { order: "asc" } },
      wrongs: { orderBy: { order: "asc" } },
      scores: { orderBy: { order: "asc" } },
    },
  });

  if (!exam) return emptyExamData();

  return {
    dosyaAdi: exam.dosyaAdi,
    dosyaUrl: exam.dosyaUrl,
    konuToplamSoru: exam.konuToplamSoru,
    tipToplamSoru: exam.tipToplamSoru,
    dersler: exam.subjects.map((s) => ({
      id: s.id,
      ders: s.ders,
      dakika: s.dakika,
    })),
    konuYanlis: exam.wrongs
      .filter((w) => w.kind === "TOPIC")
      .map((w) => ({ id: w.id, label: w.label, count: w.count })),
    tipYanlis: exam.wrongs
      .filter((w) => w.kind === "TYPE")
      .map((w) => ({ id: w.id, label: w.label, count: w.count })),
    puanlar: exam.scores.map((s) => ({ id: s.id, ay: s.ay, puan: s.puan })),
    updatedAt: exam.updatedAt.toISOString(),
  };
}

export function examOrtalama(puanlar: { puan: number }[]) {
  if (!puanlar.length) return 0;
  return Math.round(
    puanlar.reduce((s, p) => s + Number(p.puan || 0), 0) / puanlar.length
  );
}

export function examTrend(puanlar: { puan: number }[]) {
  if (puanlar.length < 2) return 0;
  return Number(puanlar[puanlar.length - 1].puan) - Number(puanlar[0].puan);
}

export function yuzde(items: { count: number }[], toplam: number) {
  const toplamYanlis = items.reduce((s, d) => s + Number(d.count || 0), 0);
  return toplam > 0 ? Math.round((toplamYanlis / toplam) * 100) : 0;
}

/**
 * LGS net hesabı: net = doğru - yanlış/3, 2 ondalığa yuvarlanır.
 * ExamSessionForm (canlı önizleme) ve saveExamSession (kalıcı değer) aynı
 * fonksiyonu kullanır — istemciden gelen net asla güvenilmez.
 */
export function netHesapla(dogru: number, yanlis: number): number {
  const d = Number.isFinite(dogru) ? Math.max(0, dogru) : 0;
  const y = Number.isFinite(yanlis) ? Math.max(0, yanlis) : 0;
  return Math.round((d - y / 3) * 100) / 100;
}
