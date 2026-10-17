import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimiter } from "@/lib/rate-limit";
import { parseUploadUrl } from "@/lib/upload-url";
export async function GET(request: Request) {
  const user = await requireUser(["TEACHER"]);
  const limit = await rateLimiter.check(`student-search:${user.id}`, 60, 60000);
  if (!limit.allowed) return Response.json({ error: "Çok sık arama yapıldı. Lütfen biraz bekleyin." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q || q.length > 80) return Response.json([]);
  const number = /^\d+$/.test(q) && Number.isSafeInteger(Number(q)) && Number(q) <= 2147483647 ? Number(q) : null;
  const rows = await prisma.student.findMany({ where: { OR: [{ name: { contains: q } }, ...(number === null ? [] : [{ no: number }])] }, take: 10, orderBy: { name: "asc" }, select: { id: true, name: true, no: true, class: { select: { name: true } }, photoUrl: true } });
  return Response.json(rows.map((s) => ({ ...s, photoUrl: parseUploadUrl(s.photoUrl, "image") })), { headers: { "Cache-Control": "private, no-store" } });
}
