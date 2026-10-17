"use server";

import { requireUploadUrl, sanitizeFileName } from "@/lib/upload-url";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { assertCanAccessStudent, requireUser } from "@/lib/auth";
import { KITAP_DURUMLARI } from "@/lib/constants";

function normStatus(v: unknown) {
  const s = String(v ?? "");
  return (KITAP_DURUMLARI as readonly string[]).includes(s) ? s : "Okunuyor";
}

function optInt(v: FormDataEntryValue | null, max = 100000) {
  const n = Number(v);
  if (!v || !Number.isFinite(n)) return null;
  return Math.max(0, Math.min(Math.round(n), max));
}

function optStr(v: FormDataEntryValue | null, max = 300) {
  const s = String(v ?? "").trim();
  return s.length ? s.slice(0, max) : null;
}

/** Kitap ekleme. Öğrenci kendi rafına, öğretmen herhangi bir öğrenciye ekleyebilir. Veli ekleyemez. */
export async function addBook(formData: FormData) {
  const user = await requireUser(["STUDENT", "TEACHER"]);
  const studentId = String(formData.get("studentId") ?? "");
  await assertCanAccessStudent(user, studentId);

  const title = optStr(formData.get("title"), 200);
  if (!title) throw new Error("Kitap adı zorunludur.");

  await prisma.book.create({
    data: {
      studentId,
      title,
      author: optStr(formData.get("author"), 150),
      status: normStatus(formData.get("status")),
      pages: optInt(formData.get("pages"), 20000),
      rating: optInt(formData.get("rating"), 5),
      review: optStr(formData.get("review"), 2000),
      coverUrl: requireUploadUrl(formData.get("coverUrl"), "image"),
      fileUrl: requireUploadUrl(formData.get("fileUrl"), "document"),
      fileName: sanitizeFileName(formData.get("fileName")),
      addedById: user.id,
    },
  });

  revalidatePath("/ogrenci/kitap-kosesi");
  revalidatePath("/ogretmen", "layout");
  revalidatePath("/veli", "layout");
}

export async function updateBookStatus(bookId: string, formData: FormData) {
  const user = await requireUser(["STUDENT", "TEACHER"]);
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new Error("Kitap bulunamadı.");
  await assertCanAccessStudent(user, book.studentId);

  await prisma.book.update({
    where: { id: bookId },
    data: { status: normStatus(formData.get("status")) },
  });

  revalidatePath("/ogrenci/kitap-kosesi");
  revalidatePath("/ogretmen", "layout");
}

export async function deleteBook(bookId: string) {
  const user = await requireUser(["STUDENT", "TEACHER"]);
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new Error("Kitap bulunamadı.");
  await assertCanAccessStudent(user, book.studentId);

  await prisma.book.delete({ where: { id: bookId } });

  revalidatePath("/ogrenci/kitap-kosesi");
  revalidatePath("/ogretmen", "layout");
}

/** Beğenilen söz kaydetme. */
export async function addQuote(formData: FormData) {
  const user = await requireUser(["STUDENT", "TEACHER"]);
  const studentId = String(formData.get("studentId") ?? "");
  await assertCanAccessStudent(user, studentId);

  const text = optStr(formData.get("text"), 2000);
  if (!text) throw new Error("Söz metni zorunludur.");

  const bookIdRaw = optStr(formData.get("bookId"), 60);
  let bookId: string | null = null;
  if (bookIdRaw) {
    const book = await prisma.book.findFirst({
      where: { id: bookIdRaw, studentId },
      select: { id: true },
    });
    bookId = book?.id ?? null;
  }

  await prisma.quote.create({
    data: {
      studentId,
      text,
      source: optStr(formData.get("source"), 150),
      pageNo: optInt(formData.get("pageNo"), 20000),
      bookId,
      favorite: formData.get("favorite") === "on",
    },
  });

  revalidatePath("/ogrenci/kitap-kosesi");
  revalidatePath("/veli", "layout");
}

export async function toggleQuoteFavorite(quoteId: string) {
  const user = await requireUser(["STUDENT", "TEACHER"]);
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Söz bulunamadı.");
  await assertCanAccessStudent(user, quote.studentId);

  await prisma.quote.update({
    where: { id: quoteId },
    data: { favorite: !quote.favorite },
  });

  revalidatePath("/ogrenci/kitap-kosesi");
}

export async function deleteQuote(quoteId: string) {
  const user = await requireUser(["STUDENT", "TEACHER"]);
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Söz bulunamadı.");
  await assertCanAccessStudent(user, quote.studentId);

  await prisma.quote.delete({ where: { id: quoteId } });

  revalidatePath("/ogrenci/kitap-kosesi");
}
