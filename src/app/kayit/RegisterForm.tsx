"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Plus, X } from "lucide-react";
import { registerAction, type RegisterState } from "./actions";
import { roleBySlug } from "@/lib/auth-roles";
import { Input } from "@/components/ui/fields";
import { Button } from "@/components/ui";
import { SubmitButton } from "@/components/ui/feedback";
export default function RegisterForm({ slug }: { slug: string }) {
  const role = roleBySlug(slug); const [codes, setCodes] = useState([0]); const [nextId, setNextId] = useState(1); const [show, setShow] = useState(false);
  const [state, action] = useActionState<RegisterState, FormData>(registerAction, {});
  if (!role?.registerEnabled) return null;
  return <><Link href="/kayit" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm text-slate-600"><ArrowLeft size={16} />Kayıt seçenekleri</Link><h1 className="text-2xl font-bold">{role.registerHeading}</h1><p className="mb-6 mt-2 text-sm text-slate-600">Okulunuzdan aldığınız davet koduyla gelişim yolculuğuna katılın.</p><form action={action} className="space-y-4"><input type="hidden" name="rol" value={slug} /><Input label="E-posta adresi" name="email" type="email" maxLength={254} required autoFocus autoComplete="email" /><div className="relative"><Input label="Şifre" hint="En az 8 karakter kullanın." name="password" type={show ? "text" : "password"} minLength={8} maxLength={72} required autoComplete="new-password" className="pr-12" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-8" aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={show} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</Button></div><Input label="Şifreyi tekrar yazın" name="password2" type={show ? "text" : "password"} minLength={8} maxLength={72} required autoComplete="new-password" />{codes.map((id, i) => <div key={id} className="flex items-end gap-2"><div className="flex-1"><Input label={`Davet kodu${codes.length > 1 ? ` ${i + 1}` : ""}`} name="inviteCode" required maxLength={30} autoComplete="off" placeholder="XXXXX-XXXXX" className="font-mono uppercase tracking-widest" /></div>{codes.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`${i + 1}. davet kodunu kaldır`} onClick={() => setCodes(codes.filter((c) => c !== id))}><X size={18} /></Button>}</div>)}{role.key === "PARENT" && codes.length < 20 && <Button type="button" variant="ghost" onClick={() => { setCodes([...codes, nextId]); setNextId(nextId + 1); }}><Plus size={16} />Başka çocuk için kod ekle</Button>}{state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}<SubmitButton className="w-full">Kaydı tamamla</SubmitButton></form></>;
}
