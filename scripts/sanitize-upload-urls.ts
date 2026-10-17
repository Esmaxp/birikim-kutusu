import { PrismaClient } from "@prisma/client";
import { parseUploadUrl } from "../src/lib/upload-url";
const db = new PrismaClient();
async function main() {
  const apply = process.argv.includes("--apply");
  let invalid = 0;
  for (const book of await db.book.findMany()) {
    const data: { coverUrl?: null; fileUrl?: null } = {};
    for (const field of ["coverUrl", "fileUrl"] as const) if (book[field] && !parseUploadUrl(book[field], field === "coverUrl" ? "image" : "document")) { invalid++; console.log(JSON.stringify({ model: "Book", id: book.id, field, value: book[field] })); data[field] = null; }
    if (apply && Object.keys(data).length) await db.book.update({ where: { id: book.id }, data });
  }
  for (const student of await db.student.findMany()) if (student.photoUrl && !parseUploadUrl(student.photoUrl, "image")) { invalid++; console.log(JSON.stringify({ model: "Student", id: student.id, field: "photoUrl", value: student.photoUrl })); if (apply) await db.student.update({ where: { id: student.id }, data: { photoUrl: null } }); }
  for (const exam of await db.examAnalysis.findMany()) if (exam.dosyaUrl && !parseUploadUrl(exam.dosyaUrl, "any")) { invalid++; console.log(JSON.stringify({ model: "ExamAnalysis", id: exam.id, field: "dosyaUrl", value: exam.dosyaUrl })); if (apply) await db.examAnalysis.update({ where: { id: exam.id }, data: { dosyaUrl: null } }); }
  console.log(`${invalid} geçersiz adres. ${apply ? "Temizlendi." : "Değişiklik yapılmadı. Uygulamak için --apply kullanın."}`);
}
main().catch(() => { console.error("Adres taraması başarısız."); process.exitCode = 1; }).finally(() => db.$disconnect());
