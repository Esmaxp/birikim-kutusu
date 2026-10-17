import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InviteManager from "./InviteManager";
export default async function InvitesPage({ searchParams }: { searchParams: Promise<{ sube?: string }> }) {
  await requireUser(["TEACHER"]);
  const classes = await prisma.schoolClass.findMany({ orderBy: { order: "asc" } });
  const selected = (await searchParams).sube || classes[0]?.id;
  const students = await prisma.student.findMany({ where: { classId: selected ?? "" }, include: { parents: true, invites: { orderBy: { createdAt: "desc" } } }, orderBy: { no: "asc" } });
  return <div className="p-6 space-y-4 print:p-0"><h1 className="text-xl font-bold print:hidden">Davet kodları</h1><div className="flex gap-3 print:hidden">{classes.map((c) => <Link key={c.id} href={`?sube=${c.id}`} className={c.id === selected ? "font-bold text-birikim" : "underline"}>{c.name}</Link>)}</div><InviteManager key={selected} classId={selected ?? ""} students={students.map((s) => ({ id: s.id, name: s.name, no: s.no, hasAccount: !!s.userId, parents: s.parents.map((p) => p.yakinlik), invites: s.invites.map((i) => ({ id: i.id, role: i.kind === "STUDENT" ? "Öğrenci" : i.yakinlik === "ANNE" ? "Anne" : i.yakinlik === "BABA" ? "Baba" : "Diğer veli", status: i.usedAt ? "Kullanıldı" : i.revokedAt ? "İptal" : i.expiresAt < new Date() ? "Süresi doldu" : "Kullanılmadı" })) }))} /></div>;
}
