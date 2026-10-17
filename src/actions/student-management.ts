"use server";
import { revalidatePath } from "next/cache";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { inviteSecret } from "@/lib/invite";
import { parseStudentCsv, type CsvStudent } from "@/lib/student-csv";

export type StudentState = { error?: string; message?: string; rows?: CsvStudent[]; ticket?: string; csv?: string };
function ticketFor(csv: string, userId: string) { return createHmac("sha256", inviteSecret()).update(`student-import:${userId}:${csv}`).digest("hex"); }
async function preview(csv: string) {
  const rows = parseStudentCsv(csv);
  const classes = await prisma.schoolClass.findMany({ include: { students: { select: { no: true } } } });
  return rows.map((r) => {
    const school = classes.find((c) => c.name === r.sube);
    return { ...r, error: r.error || (!school ? "Şube bulunamadı." : school.students.some((s) => s.no === r.no) ? "Bu şube/numara zaten kayıtlı." : undefined) };
  });
}
export async function manageStudents(_state: StudentState, data: FormData): Promise<StudentState> {
  const actor = await requireUser(["TEACHER"]);
  const operation = String(data.get("operation") ?? "");
  if (["preview", "import"].includes(operation)) {
    const csv = String(data.get("csv") ?? "");
    let rows: CsvStudent[];
    try { rows = await preview(csv); } catch (e) { return { error: e instanceof Error ? e.message : "CSV okunamadı." }; }
    if (operation === "preview") return { rows, csv, ticket: ticketFor(csv, actor.id) };
    const ticket = String(data.get("ticket") ?? "");
    const expected = ticketFor(csv, actor.id);
    if (!/^[a-f0-9]{64}$/.test(ticket) || !timingSafeEqual(Buffer.from(ticket), Buffer.from(expected)) || rows.some((r) => r.error)) return { error: "Önizlemeyi yenileyip hataları düzeltin." };
    try {
      await prisma.$transaction(async (tx) => {
        for (const row of rows) {
          const school = await tx.schoolClass.findUniqueOrThrow({ where: { name: row.sube } });
          await tx.student.create({ data: { classId: school.id, no: row.no, name: row.ad } });
        }
      }, { timeout: 30000 });
    } catch { return { error: "İçe aktarma tamamlanamadı; hiçbir satır kaydedilmedi. Önizlemeyi yenileyin." }; }
    await writeAuditLog({ actorId: actor.id, action: "STUDENT_IMPORT", entityType: "Student", meta: { count: rows.length } });
    revalidatePath("/ogretmen", "layout");
    return { message: `${rows.length} öğrenci eklendi.` };
  }
  if (operation !== "save") return { error: "Geçersiz işlem." };
  const id = String(data.get("id") ?? "");
  const name = String(data.get("name") ?? "").trim();
  const classId = String(data.get("classId") ?? "");
  const no = Number(data.get("no"));
  if (id.length > 100 || classId.length > 100 || name.length < 3 || name.length > 150 || !Number.isInteger(no) || no < 1 || no > 999999) return { error: "Öğrenci bilgilerini kontrol edin." };
  let student;
  try {
    student = await prisma.$transaction(async (tx) => {
      const result = id ? await tx.student.update({ where: { id }, data: { name, classId, no } }) : await tx.student.create({ data: { name, classId, no } });
      if (result.userId) await tx.user.update({ where: { id: result.userId }, data: { name } });
      return result;
    });
  } catch { return { error: "Öğrenci kaydedilemedi. Şube/numara kullanımda olabilir." }; }
  await writeAuditLog({ actorId: actor.id, action: id ? "STUDENT_UPDATE" : "STUDENT_CREATE", entityType: "Student", entityId: student.id, studentId: student.id });
  revalidatePath("/ogretmen", "layout");
  return { message: "Öğrenci kaydedildi." };
}
