import StudentGridClient from "./StudentGridClient";
export type GridStudent = { id: string; name: string; no: number; photoUrl?: string | null; sinif?: string; absenceCount?: number; latestNet?: number | null; netDelta?: number | null };
export default function StudentGrid({ students, selectedId, hrefFor }: { students: GridStudent[]; selectedId?: string | null; hrefFor: (id: string) => string }) { return <StudentGridClient students={students.map((s) => ({ ...s, href: hrefFor(s.id) }))} selectedId={selectedId} />; }
