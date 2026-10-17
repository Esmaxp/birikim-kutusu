"use client";
import { useActionState } from "react";
import { changePassword } from "./actions";
export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {});
  return <form action={action} className="space-y-3">{[{ name: "current", label: "Mevcut şifre" }, { name: "password", label: "Yeni şifre" }, { name: "confirmation", label: "Yeni şifre (tekrar)" }].map((f) => <label className="block text-sm" key={f.name}>{f.label}<input required name={f.name} type="password" minLength={f.name === "current" ? 1 : 8} maxLength={72} autoComplete={f.name === "current" ? "current-password" : "new-password"} className="block w-full border rounded p-2 mt-1" /></label>)}{state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}<button disabled={pending} className="bg-birikim text-white p-2 rounded w-full">{pending ? "Kaydediliyor..." : "Şifreyi değiştir"}</button></form>;
}
