"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { roleBySlug } from "@/lib/auth-roles";
import { Input } from "@/components/ui/fields";
import { Button } from "@/components/ui";
import { SubmitButton } from "@/components/ui/feedback";
export default function LoginForm({ slug }: { slug: string }) {
  const role = roleBySlug(slug); const [show, setShow] = useState(false);
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  if (!role) return null;
  return <><Link href="/login" className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm text-slate-600 hover:text-birikim"><ArrowLeft size={16} />Giriş seçenekleri</Link><h1 className="text-2xl font-bold">{role.heading}</h1><p className="mb-6 mt-2 text-sm text-slate-600">{role.description}</p><form action={action} className="space-y-5"><input type="hidden" name="role" value={role.key} /><Input label="E-posta adresi" name="email" type="email" required autoFocus autoComplete="username" placeholder="ornek@birikim.k12.tr" /><div className="relative"><Input label="Şifre" name="password" type={show ? "text" : "password"} required autoComplete="current-password" className="pr-12" error={state.error} /><Button type="button" variant="ghost" size="icon" onClick={() => setShow(!show)} aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={show} className="absolute right-1 top-8">{show ? <EyeOff size={18} /> : <Eye size={18} />}</Button></div><SubmitButton className="w-full" pendingLabel="Giriş yapılıyor...">Giriş yap</SubmitButton></form></>;
}
