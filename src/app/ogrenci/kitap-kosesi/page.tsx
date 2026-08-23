import { prisma } from "@/lib/prisma";
import { requireStudentProfile } from "@/lib/auth";
import BookCorner from "@/components/BookCorner";

export default async function KitapKosesiPage() {
  const { student } = await requireStudentProfile();

  const [books, quotes] = await Promise.all([
    prisma.book.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { quotes: true } } },
    }),
    prisma.quote.findMany({
      where: { studentId: student.id },
      orderBy: [{ favorite: "desc" }, { createdAt: "desc" }],
      include: { book: { select: { title: true } } },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-5">
        <div className="text-[18px] font-bold text-slate-800">Kitap Köşem</div>
        <p className="text-[12px] text-slate-400">
          Okuduğun kitapları yükle, beğendiğin sözleri kaydet.
        </p>
      </div>

      <BookCorner
        studentId={student.id}
        books={books.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          status: b.status,
          pages: b.pages,
          rating: b.rating,
          review: b.review,
          coverUrl: b.coverUrl,
          fileUrl: b.fileUrl,
          fileName: b.fileName,
          createdAt: b.createdAt.toISOString(),
          quoteCount: b._count.quotes,
          addedByTeacher: b.addedById !== null && b.addedById !== student.userId,
        }))}
        quotes={quotes.map((q) => ({
          id: q.id,
          text: q.text,
          source: q.source,
          pageNo: q.pageNo,
          favorite: q.favorite,
          bookTitle: q.book?.title ?? null,
          createdAt: q.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
