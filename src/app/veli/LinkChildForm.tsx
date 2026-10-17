"use client";
import { useActionState } from "react";
import { linkChildWithCode } from "@/app/kayit/actions";
export default function LinkChildForm() {
  const [state, action, pending] = useActionState(linkChildWithCode, {});
  return <form action={action} className="print:hidden bg-white p-4 rounded-xl text-sm space-y-2"><label>Başka çocuğumu bağla<input name="inviteCode" required maxLength={30} placeholder="Davet kodu" className="border rounded p-2 mx-2" /></label><button disabled={pending} className="text-birikim underline">Kodu kullan</button>{state.error && <p role="alert" className="text-red-600">{state.error}</p>}{state.message && <p role="status">{state.message}</p>}</form>;
}
