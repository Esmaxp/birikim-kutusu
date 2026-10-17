import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StudentManager from "./StudentManager";
export default async function StudentsPage() {
  await requireUser(["TEACHER"]);
  const classes = await prisma.schoolClass.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } });
  const students = await prisma.student.findMany({ orderBy: [{ class: { order: "asc" } }, { no: "asc" }], select: { id: true, name: true, no: true, classId: true } });
  return <StudentManager classes={classes} students={students} />;
}
