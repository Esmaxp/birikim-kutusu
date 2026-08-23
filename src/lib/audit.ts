import { prisma } from "./prisma";

export type AuditAction =
  | "EXAM_SAVE"
  | "NOTE_CREATE"
  | "NOTE_DELETE"
  | "ABSENCE_CREATE"
  | "ABSENCE_DELETE"
  | "USER_REGISTER"
  | "STUDENT_PHOTO_UPDATE"
  | "EXAM_SESSION_SAVE"
  | "EXAM_SESSION_DELETE"
  | "EXAM_SESSION_CONFIRM";

export type AuditEntityType =
  | "ExamAnalysis"
  | "Note"
  | "Absence"
  | "User"
  | "Student"
  | "ExamSession";

/**
 * Hassas işlemler için denetim kaydı.
 * Hata yazımı ana işlemi bozmasın diye yutulur (best-effort).
 */
export async function writeAuditLog(opts: {
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  studentId?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: opts.actorId,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId ?? null,
        studentId: opts.studentId ?? null,
        meta: opts.meta ? JSON.stringify(opts.meta) : null,
      },
    });
  } catch (err) {
    console.error("[audit] kayıt yazılamadı:", err);
  }
}
