import { CalendarCheck, CalendarX } from "lucide-react";
import { deleteAbsence } from "@/actions/absences";
import { ConfirmForm } from "./ui/feedback";
import { Badge, EmptyState } from "./ui";
export default function AbsenceList({ absences, editable = false }: { absences: { id: string; date: string; reason: string }[]; editable?: boolean }) {
  if (!absences.length) return <EmptyState icon={CalendarCheck} title="Devamsızlık kaydı yok" description="Devam durumuna ait kayıtlar burada görünecek." />;
  const groups = new Map<string, typeof absences>();
  for (const absence of absences) { const month = new Date(absence.date).toLocaleDateString("tr-TR", { month: "long", year: "numeric", timeZone: "UTC" }); groups.set(month, [...(groups.get(month) ?? []), absence]); }
  const remove = (id: string) => editable ? <ConfirmForm action={deleteAbsence.bind(null, id)}><button aria-label="Devamsızlık kaydını sil" className="rounded-lg px-3 py-2 text-birikim hover:bg-birikim-50">Sil</button></ConfirmForm> : null;
  const date = (value: string) => new Date(value).toLocaleDateString("tr-TR", { day: "numeric", month: "long", timeZone: "UTC" });
  return <div className="space-y-6">{Array.from(groups, ([month, records]) => <section key={month}><h3 className="mb-3 flex items-center gap-2 text-base font-semibold capitalize"><CalendarX size={16} className="text-birikim" />{month}<Badge>{records.length} gün</Badge></h3><table className="hidden w-full text-left text-sm md:table"><thead className="border-b text-slate-600"><tr><th className="py-3">Tarih</th><th>Sebep</th>{editable && <th><span className="sr-only">İşlemler</span></th>}</tr></thead><tbody>{records.map((a) => <tr key={a.id} className="border-b border-slate-100"><td className="py-3">{date(a.date)}</td><td>{a.reason || "Belirtilmedi"}</td>{editable && <td className="text-right">{remove(a.id)}</td>}</tr>)}</tbody></table><div className="space-y-2 md:hidden">{records.map((a) => <article key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="font-medium">{date(a.date)}</p><p className="mt-1 text-sm text-slate-600">{a.reason || "Sebep belirtilmedi"}</p></div>{remove(a.id)}</article>)}</div></section>)}</div>;
}
