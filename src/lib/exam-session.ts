import { prisma } from "./prisma";
import { SINAV_DERSLERI } from "./constants";

export type ExamSessionSubjectInput = {
  ders: string;
  cozumSuresi: number | null;
  cozumSirasi: number | null;
  dogru: number;
  yanlis: number;
  bos: number;
};

export type ExamSessionGainInput = { ders: string; metin: string };

/** Formdan/server action'a giden düz veri. toplamNet ve net alanları burada YOK —
 * bunlar her zaman sunucuda netHesapla() ile yeniden hesaplanır. */
export type ExamSessionInput = {
  sinavAdi: string;
  sinavTarihi: string; // yyyy-mm-dd
  sinavSaati: string | null;
  gorusmeTarihi: string | null; // yyyy-mm-dd
  danismanId: string | null;
  toplamCozumSuresi: number | null;
  icselProblem: boolean;
  icselAciklama: string | null;
  dissalProblem: boolean;
  dissalAciklama: string | null;
  hataYapildi: boolean;
  hataTurleri: string[];
  hataDigerAciklama: string | null;
  puan: number | null;
  yuzdelikDilim: number | null;
  turkiyeSirasi: number | null;
  kurumSirasi: number | null;
  sinifSirasi: number | null;
  genelDegerlendirme: string | null;
  kararlarOneriler: string | null;
  subjects: ExamSessionSubjectInput[];
  gains: ExamSessionGainInput[];
};

export type ExamSessionSubjectView = ExamSessionSubjectInput & { net: number };
export type ExamSessionGainView = { id: string; ders: string; metin: string };

/** Editör, yazdırma sayfası, öğrenci görünümü ve olası PDF route'unun hepsinin
 * tükettiği tek, serileştirilebilir düz nesne. */
export type ExamSessionData = {
  id: string;
  studentId: string;
  student: {
    name: string;
    no: number;
    photoUrl: string | null;
    className: string;
    veliAdi: string | null;
    telefon: string | null;
  };
  sinavAdi: string;
  sinavTarihi: string;
  sinavSaati: string | null;
  gorusmeTarihi: string | null;
  danismanId: string | null;
  danismanAdi: string | null;
  toplamCozumSuresi: number | null;
  icselProblem: boolean;
  icselAciklama: string | null;
  dissalProblem: boolean;
  dissalAciklama: string | null;
  hataYapildi: boolean;
  hataTurleri: string[];
  hataDigerAciklama: string | null;
  toplamNet: number | null;
  puan: number | null;
  yuzdelikDilim: number | null;
  turkiyeSirasi: number | null;
  kurumSirasi: number | null;
  sinifSirasi: number | null;
  genelDegerlendirme: string | null;
  kararlarOneriler: string | null;
  ogrenciOnayAt: string | null;
  rehberOnayAt: string | null;
  visibleToStudent: boolean;
  subjects: ExamSessionSubjectView[];
  gains: ExamSessionGainView[];
  createdById: string | null;
  createdByAdi: string | null;
  createdAt: string;
  updatedAt: string;
};

function safeParseHataTurleri(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Yeni kayıt için boş form verisi. Her ders paper formdaki gibi iki boş
 * kazanım satırıyla başlar. */
export function emptyExamSessionInput(defaultDanismanId: string | null): ExamSessionInput {
  return {
    sinavAdi: "",
    sinavTarihi: new Date().toISOString().slice(0, 10),
    sinavSaati: null,
    gorusmeTarihi: null,
    danismanId: defaultDanismanId,
    toplamCozumSuresi: null,
    icselProblem: false,
    icselAciklama: null,
    dissalProblem: false,
    dissalAciklama: null,
    hataYapildi: false,
    hataTurleri: [],
    hataDigerAciklama: null,
    puan: null,
    yuzdelikDilim: null,
    turkiyeSirasi: null,
    kurumSirasi: null,
    sinifSirasi: null,
    genelDegerlendirme: null,
    kararlarOneriler: null,
    subjects: SINAV_DERSLERI.map((ders) => ({
      ders,
      cozumSuresi: null,
      cozumSirasi: null,
      dogru: 0,
      yanlis: 0,
      bos: 0,
    })),
    gains: SINAV_DERSLERI.flatMap((ders) => [
      { ders, metin: "" },
      { ders, metin: "" },
    ]),
  };
}

/** Kayıtlı bir ExamSessionData'yı forma yeniden yüklenebilir ExamSessionInput'a çevirir. */
export function toExamSessionInput(data: ExamSessionData): ExamSessionInput {
  const gainsBySubject = new Map<string, string[]>();
  for (const g of data.gains) {
    const arr = gainsBySubject.get(g.ders) ?? [];
    arr.push(g.metin);
    gainsBySubject.set(g.ders, arr);
  }

  return {
    sinavAdi: data.sinavAdi,
    sinavTarihi: data.sinavTarihi.slice(0, 10),
    sinavSaati: data.sinavSaati,
    gorusmeTarihi: data.gorusmeTarihi ? data.gorusmeTarihi.slice(0, 10) : null,
    danismanId: data.danismanId,
    toplamCozumSuresi: data.toplamCozumSuresi,
    icselProblem: data.icselProblem,
    icselAciklama: data.icselAciklama,
    dissalProblem: data.dissalProblem,
    dissalAciklama: data.dissalAciklama,
    hataYapildi: data.hataYapildi,
    hataTurleri: data.hataTurleri,
    hataDigerAciklama: data.hataDigerAciklama,
    puan: data.puan,
    yuzdelikDilim: data.yuzdelikDilim,
    turkiyeSirasi: data.turkiyeSirasi,
    kurumSirasi: data.kurumSirasi,
    sinifSirasi: data.sinifSirasi,
    genelDegerlendirme: data.genelDegerlendirme,
    kararlarOneriler: data.kararlarOneriler,
    subjects: SINAV_DERSLERI.map((ders) => {
      const found = data.subjects.find((s) => s.ders === ders);
      return (
        found ?? {
          ders,
          cozumSuresi: null,
          cozumSirasi: null,
          dogru: 0,
          yanlis: 0,
          bos: 0,
        }
      );
    }),
    gains: SINAV_DERSLERI.flatMap((ders) => {
      const lines = gainsBySubject.get(ders) ?? [];
      while (lines.length < 2) lines.push("");
      return lines.map((metin) => ({ ders, metin }));
    }),
  };
}

export async function getExamSession(examId: string): Promise<ExamSessionData | null> {
  const exam = await prisma.examSession.findUnique({
    where: { id: examId },
    include: {
      student: { include: { class: true } },
      danisman: { select: { name: true } },
      createdBy: { select: { name: true } },
      subjects: { orderBy: { order: "asc" } },
      gains: { orderBy: { order: "asc" } },
    },
  });
  if (!exam) return null;

  return {
    id: exam.id,
    studentId: exam.studentId,
    student: {
      name: exam.student.name,
      no: exam.student.no,
      photoUrl: exam.student.photoUrl,
      className: exam.student.class.name,
      veliAdi: exam.student.veliAdi,
      telefon: exam.student.telefon,
    },
    sinavAdi: exam.sinavAdi,
    sinavTarihi: exam.sinavTarihi.toISOString(),
    sinavSaati: exam.sinavSaati,
    gorusmeTarihi: exam.gorusmeTarihi ? exam.gorusmeTarihi.toISOString() : null,
    danismanId: exam.danismanId,
    danismanAdi: exam.danisman?.name ?? null,
    toplamCozumSuresi: exam.toplamCozumSuresi,
    icselProblem: exam.icselProblem,
    icselAciklama: exam.icselAciklama,
    dissalProblem: exam.dissalProblem,
    dissalAciklama: exam.dissalAciklama,
    hataYapildi: exam.hataYapildi,
    hataTurleri: safeParseHataTurleri(exam.hataTurleri),
    hataDigerAciklama: exam.hataDigerAciklama,
    toplamNet: exam.toplamNet,
    puan: exam.puan,
    yuzdelikDilim: exam.yuzdelikDilim,
    turkiyeSirasi: exam.turkiyeSirasi,
    kurumSirasi: exam.kurumSirasi,
    sinifSirasi: exam.sinifSirasi,
    genelDegerlendirme: exam.genelDegerlendirme,
    kararlarOneriler: exam.kararlarOneriler,
    ogrenciOnayAt: exam.ogrenciOnayAt ? exam.ogrenciOnayAt.toISOString() : null,
    rehberOnayAt: exam.rehberOnayAt ? exam.rehberOnayAt.toISOString() : null,
    visibleToStudent: exam.visibleToStudent,
    subjects: exam.subjects.map((s) => ({
      ders: s.ders,
      cozumSuresi: s.cozumSuresi,
      cozumSirasi: s.cozumSirasi,
      dogru: s.dogru,
      yanlis: s.yanlis,
      bos: s.bos,
      net: s.net,
    })),
    gains: exam.gains.map((g) => ({ id: g.id, ders: g.ders, metin: g.metin })),
    createdById: exam.createdById,
    createdByAdi: exam.createdBy?.name ?? null,
    createdAt: exam.createdAt.toISOString(),
    updatedAt: exam.updatedAt.toISOString(),
  };
}
