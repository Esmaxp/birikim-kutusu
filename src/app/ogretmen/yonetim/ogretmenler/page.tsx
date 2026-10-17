import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeacherManagement from "./TeacherManagement";

export default async function TeachersPage() {
  await requireAdmin();
  const teachers = await prisma.user.findMany({ where: { role: "TEACHER" }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, title: true, isAdmin: true, disabledAt: true } });
  return <TeacherManagement teachers={teachers.map((t) => ({ ...t, disabled: !!t.disabledAt, disabledAt: undefined }))} />;
}
