"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { assertCanAccessStudent, requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { netHesapla } from "@/lib/exam";
import { HATA_TURLERI, SINAV_DERSLERI } from "@/lib/constants";
import type { ExamSessionInput } from "@/lib/exam-session";

const HATA_KEYS = new Set<string>(HATA_TURLERI.map((h) => h.key));
const DERS_SET = new Set<string>(SINAV_DERSLERI);

function temizMetin(v: unknown, max: number): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s.slice(0, max) : null;
}

function temizTamSayi(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(n, max));
}

function temizOndalik(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(Math.round(n * 100) / 100, max));
}

function temizTarih(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Deneme analizi formunu kaydeder (yeni kayıt ya da güncelleme).
 * examId null ise yeni ExamSession oluşturulur ve id'si döner — istemci
 * URL'yi .../deneme/yeni'den .../deneme/<id>'ye bu id ile değiştirir.
 */
export async function saveExamSession(
  studentId: string,
  examId: string | null,
  data: ExamSessionInput
) {
  const user = await requireUser(["TEACHER"]);
  await assertCanAccessStudent(user, studentId);

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Öğrenci bulunamadı.");

  const sinavAdi = temizMetin(data.sinavAdi, 200);
  if (!sinavAdi) throw new Error("Sınav adı zorunludur.");

  const sinavTarihi = temizTarih(data.sinavTarihi);
  if (!sinavTarihi) throw new Error("Sınav tarihi zorunludur.");

  let danismanId: string | null = null;
  if (data.danismanId) {
    const danisman = await prisma.user.findFirst({
      where: { id: data.danismanId, role: "TEACHER" },
      select: { id: true },
    });
    danismanId = danisman?.id ?? null;
  }

  const icselProblem = !!data.icselProblem;
  const dissalProblem = !!data.dissalProblem;
  const hataYapildi = !!data.hataYapildi;

  const hataTurleriTemiz = hataYapildi
    ? Array.from(
        new Set(
          (Array.isArray(data.hataTurleri) ? data.hataTurleri : []).filter(
            (k): k is string => typeof k === "string" && HATA_KEYS.has(k)
          )
        )
      )
    : [];

  // Ders satırları yalnızca sabit SINAV_DERSLERI listesiyle sınırlı, o sırayla.
  const subjectInputs = SINAV_DERSLERI.map((ders) => {
    const found = data.subjects?.find((s) => s.ders === ders);
    const dogru = temizTamSayi(found?.dogru, 0, 100) ?? 0;
    const yanlis = temizTamSayi(found?.yanlis, 0, 100) ?? 0;
    const bos = temizTamSayi(found?.bos, 0, 100) ?? 0;
    return {
      ders,
      cozumSuresi: temizTamSayi(found?.cozumSuresi, 0, 600),
      cozumSirasi: temizTamSayi(found?.cozumSirasi, 1, SINAV_DERSLERI.length),
      dogru,
      yanlis,
      bos,
      net: netHesapla(dogru, yanlis),
    };
  });
  const toplamNet =
    Math.round(subjectInputs.reduce((s, r) => s + r.net, 0) * 100) / 100;

  // Kazanımlar ders başına gruplanır, boş satırlar saklanmaz, sıra korunur.
  const gainsBySubject = new Map<string, string[]>();
  for (const g of data.gains ?? []) {
    if (!DERS_SET.has(g.ders)) continue;
    const metin = temizMetin(g.metin, 500);
    if (!metin) continue;
    const arr = gainsBySubject.get(g.ders) ?? [];
    if (arr.length < 30) arr.push(metin);
    gainsBySubject.set(g.ders, arr);
  }
  const gainRows = Array.from(gainsBySubject.entries()).flatMap(([ders, lines]) =>
    lines.map((metin, i) => ({ ders, metin, order: i }))
  );

  const payload = {
    studentId,
    sinavAdi,
    sinavTarihi,
    sinavSaati: temizMetin(data.sinavSaati, 20),
    gorusmeTarihi: temizTarih(data.gorusmeTarihi),
    danismanId,
    toplamCozumSuresi: temizTamSayi(data.toplamCozumSuresi, 0, 1000),
    icselProblem,
    icselAciklama: icselProblem ? temizMetin(data.icselAciklama, 2000) : null,
    dissalProblem,
    dissalAciklama: dissalProblem ? temizMetin(data.dissalAciklama, 2000) : null,
    hataYapildi,
    hataTurleri: JSON.stringify(hataTurleriTemiz),
    hataDigerAciklama:
      hataYapildi && hataTurleriTemiz.includes("DIGER")
        ? temizMetin(data.hataDigerAciklama, 500)
        : null,
    toplamNet,
    puan: temizOndalik(data.puan, 0, 1000),
    yuzdelikDilim: temizOndalik(data.yuzdelikDilim, 0, 100),
    turkiyeSirasi: temizTamSayi(data.turkiyeSirasi, 0, 10_000_000),
    kurumSirasi: temizTamSayi(data.kurumSirasi, 0, 100_000),
    sinifSirasi: temizTamSayi(data.sinifSirasi, 0, 10_000),
    genelDegerlendirme: temizMetin(data.genelDegerlendirme, 2000),
    kararlarOneriler: temizMetin(data.kararlarOneriler, 2000),
  };

  const resultId = await prisma.$transaction(async (tx) => {
    let exam;
    if (examId) {
      const existing = await tx.examSession.findUnique({ where: { id: examId } });
      if (!existing || existing.studentId !== studentId) {
        throw new Error("Deneme kaydı bulunamadı.");
      }
      exam = await tx.examSession.update({ where: { id: examId }, data: payload });
    } else {
      exam = await tx.examSession.create({
        data: { ...payload, createdById: user.id },
      });
    }

    // Alt satırlar tamamen yeniden yazılır (sıra korunur), saveExamAnalysis ile aynı desen.
    await tx.examSubjectResult.deleteMany({ where: { examId: exam.id } });
    await tx.examSubjectResult.createMany({
      data: subjectInputs.map((s, i) => ({ examId: exam.id, ...s, order: i })),
    });

    await tx.missedGain.deleteMany({ where: { examId: exam.id } });
    if (gainRows.length) {
      await tx.missedGain.createMany({
        data: gainRows.map((g) => ({ examId: exam.id, ...g })),
      });
    }

    return exam.id;
  });

  await writeAuditLog({
    actorId: user.id,
    action: "EXAM_SESSION_SAVE",
    entityType: "ExamSession",
    entityId: resultId,
    studentId,
    meta: { sinavAdi, yeniKayit: !examId },
  });

  revalidatePath("/ogretmen", "layout");
  revalidatePath("/ogrenci", "layout");
  revalidatePath("/veli", "layout");

  return { ok: true as const, id: resultId };
}

export async function deleteExamSession(examId: string) {
  const user = await requireUser(["TEACHER"]);
  const exam = await prisma.examSession.findUnique({ where: { id: examId } });
  if (!exam) throw new Error("Deneme kaydı bulunamadı.");
  await assertCanAccessStudent(user, exam.studentId);

  await prisma.examSession.delete({ where: { id: examId } });

  await writeAuditLog({
    actorId: user.id,
    action: "EXAM_SESSION_DELETE",
    entityType: "ExamSession",
    entityId: examId,
    studentId: exam.studentId,
  });

  revalidatePath("/ogretmen", "layout");
  revalidatePath("/ogrenci", "layout");
  revalidatePath("/veli", "layout");
}

/**
 * Section 6 onayı. "OGRENCI" öğrencinin kendisi tarafından çağrılır ve kaydın
 * kendi profiline ait olduğu doğrulanır; "REHBER" öğretmen tarafından çağrılır.
 */
export async function confirmExamSession(examId: string, who: "OGRENCI" | "REHBER") {
  const exam = await prisma.examSession.findUnique({ where: { id: examId } });
  if (!exam) throw new Error("Deneme kaydı bulunamadı.");

  let actorId: string;

  if (who === "OGRENCI") {
    const user = await requireUser(["STUDENT"]);
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student || student.id !== exam.studentId) {
      throw new Error("Bu deneme kaydını onaylama yetkiniz yok.");
    }
    actorId = user.id;
    await prisma.examSession.update({
      where: { id: examId },
      data: { ogrenciOnayAt: new Date() },
    });
  } else {
    const user = await requireUser(["TEACHER"]);
    await assertCanAccessStudent(user, exam.studentId);
    actorId = user.id;
    await prisma.examSession.update({
      where: { id: examId },
      data: { rehberOnayAt: new Date() },
    });
  }

  await writeAuditLog({
    actorId,
    action: "EXAM_SESSION_CONFIRM",
    entityType: "ExamSession",
    entityId: examId,
    studentId: exam.studentId,
    meta: { who },
  });

  revalidatePath("/ogretmen", "layout");
  revalidatePath("/ogrenci", "layout");
  revalidatePath("/veli", "layout");
}
