"use server";

import { requireUploadUrl, sanitizeFileName } from "@/lib/upload-url";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { assertCanAccessStudent, requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { ExamData } from "@/lib/exam";

/**
 * Deneme analizini kaydeder. Yalnızca ÖĞRETMEN çağırabilir —
 * öğrenci ve veli bu veriyi hiçbir koşulda değiştiremez.
 */
export async function saveExamAnalysis(studentId: string, data: ExamData) {
  const user = await requireUser(["TEACHER"]);
  await assertCanAccessStudent(user, studentId);

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Öğrenci bulunamadı.");

  const dosyaUrl = requireUploadUrl(data.dosyaUrl, "any");
  const dosyaAdi = sanitizeFileName(data.dosyaAdi);
  const konuToplam = Math.max(1, Number(data.konuToplamSoru) || 1);
  const tipToplam = Math.max(1, Number(data.tipToplamSoru) || 1);

  const temizMetin = (v: unknown, fallback: string) => {
    const s = String(v ?? "").trim();
    return s.length ? s.slice(0, 120) : fallback;
  };
  const temizSayi = (v: unknown) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(0, Math.min(n, 100000)) : 0;
  };

  const examId = await prisma.$transaction(async (tx) => {
    const exam = await tx.examAnalysis.upsert({
      where: { studentId },
      create: {
        studentId,
        dosyaAdi,
        dosyaUrl,
        konuToplamSoru: konuToplam,
        tipToplamSoru: tipToplam,
      },
      update: {
        dosyaAdi,
        dosyaUrl,
        konuToplamSoru: konuToplam,
        tipToplamSoru: tipToplam,
      },
    });

    // Alt satırlar tamamen yeniden yazılır (sıra korunur).
    await tx.subjectTime.deleteMany({ where: { examId: exam.id } });
    await tx.wrongItem.deleteMany({ where: { examId: exam.id } });
    await tx.scorePoint.deleteMany({ where: { examId: exam.id } });

    if (data.dersler.length) {
      await tx.subjectTime.createMany({
        data: data.dersler.slice(0, 40).map((d, i) => ({
          examId: exam.id,
          ders: temizMetin(d.ders, "Ders"),
          dakika: temizSayi(d.dakika),
          order: i,
        })),
      });
    }

    const wrongRows = [
      ...data.konuYanlis.slice(0, 40).map((w, i) => ({
        examId: exam.id,
        kind: "TOPIC",
        label: temizMetin(w.label, "Konu"),
        count: temizSayi(w.count),
        order: i,
      })),
      ...data.tipYanlis.slice(0, 40).map((w, i) => ({
        examId: exam.id,
        kind: "TYPE",
        label: temizMetin(w.label, "Soru tipi"),
        count: temizSayi(w.count),
        order: i,
      })),
    ];
    if (wrongRows.length) await tx.wrongItem.createMany({ data: wrongRows });

    if (data.puanlar.length) {
      await tx.scorePoint.createMany({
        data: data.puanlar.slice(0, 60).map((p, i) => ({
          examId: exam.id,
          ay: temizMetin(p.ay, "Deneme"),
          puan: temizSayi(p.puan),
          order: i,
        })),
      });
    }

    return exam.id;
  });

  await writeAuditLog({
    actorId: user.id,
    action: "EXAM_SAVE",
    entityType: "ExamAnalysis",
    entityId: examId,
    studentId,
    meta: {
      dosyaAdi,
      puanSayisi: data.puanlar.length,
    },
  });

  revalidatePath("/ogretmen", "layout");
  revalidatePath("/ogrenci", "layout");
  revalidatePath("/veli", "layout");

  return { ok: true as const };
}
