"use client";
import { ActionGuard } from "@/components/ui/ActionGuard";
import { toast } from "sonner";
import { useActionState, useEffect, useState } from "react";
import { manageTeacher, type TeacherState } from "@/actions/teachers";

type Teacher = { id: string; name: string; email: string; title: string | null; isAdmin: boolean; disabled: boolean };
export default function TeacherManagement({ teachers }: { teachers: Teacher[] }) {
  const [state, action, pending] = useActionState<TeacherState, FormData>(manageTeacher, {});
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (state.error) toast.error(state.error); if (state.message) toast.success(state.message); }, [state]);
  return <ActionGuard operations={["reset", "disable", "update"]}><div className="p-6 space-y-5">
    <h1 className="text-xl font-bold">Öğretmen yönetimi</h1>
    {state.error && <p role="alert" className="text-red-600">{state.error}</p>}
    {state.message && <p role="status">{state.message}</p>}
    {state.password && <div className="bg-amber-50 border p-4 rounded-xl"><p>Geçici şifre yalnızca bu işlemden sonra gösterilir. Güvenli biçimde iletin.</p><input aria-label="Geçici şifre" readOnly value={state.password} className="font-mono p-2" /><button type="button" onClick={async () => { await navigator.clipboard.writeText(state.password!); setCopied(true); }}>{copied ? "Kopyalandı" : "Kopyala"}</button></div>}
    <form action={action} className="bg-white p-4 rounded-xl flex flex-wrap gap-3">
      <input type="hidden" name="operation" value="create" />
      <input name="name" aria-label="Ad soyad" placeholder="Ad soyad" required minLength={3} maxLength={150} className="border rounded p-2" />
      <input name="email" aria-label="E-posta" placeholder="E-posta" type="email" required maxLength={254} className="border rounded p-2" />
      <input name="title" aria-label="Branş / unvan" placeholder="Branş / unvan" maxLength={100} className="border rounded p-2" />
      <label><input type="checkbox" name="isAdmin" /> Yönetici</label>
      <button disabled={pending} className="bg-birikim text-white rounded p-2">Öğretmen oluştur</button>
    </form>
    <div className="overflow-x-auto"><table className="w-full bg-white text-sm"><thead><tr>{["Öğretmen", "E-posta", "Unvan", "Durum", "İşlemler"].map((s) => <th className="text-left p-3" key={s}>{s}</th>)}</tr></thead><tbody>{teachers.map((t) => <tr className="border-t" key={t.id}>
      <td className="p-3">{t.name}{t.isAdmin && " (Yönetici)"}</td><td>{t.email}</td><td>{t.title}</td><td>{t.disabled ? "Pasif" : "Etkin"}</td><td className="p-3 space-y-2">
        <form action={action}><input type="hidden" name="id" value={t.id} /><button disabled={pending} name="operation" value="reset" className="underline mr-3">Şifre sıfırla</button><button disabled={pending} name="operation" value={t.disabled ? "enable" : "disable"} className="underline">{t.disabled ? "Etkinleştir" : "Pasifleştir"}</button></form>
        <form action={action}><input type="hidden" name="id" value={t.id} /><label><input name="isAdmin" type="checkbox" defaultChecked={t.isAdmin} /> Yönetici</label><button disabled={pending} name="operation" value="update" className="underline ml-2">Yetkiyi kaydet</button></form>
      </td></tr>)}</tbody></table></div>
  </div></ActionGuard>;
}
