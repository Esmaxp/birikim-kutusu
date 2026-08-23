"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { loginAction, type LoginState } from "./actions";
import { roleBySlug } from "@/lib/auth-roles";
import { RED } from "@/lib/constants";

export default function LoginForm({ slug }: { slug: string }) {
  const role = roleBySlug(slug);
  const [showPw, setShowPw] = useState(false);
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  if (!role) return null;
  const Icon = role.icon;

  return (
    <>
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600"
      >
        <ArrowLeft size={13} /> Geri
      </Link>

      <div className="flex flex-col items-center text-center mt-3 mb-5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white mb-2"
          style={{ background: RED }}
        >
          <Icon size={20} />
        </div>
        <h1 className="text-[17px] font-bold text-slate-800">{role.heading}</h1>
        <p className="text-[12px] text-slate-400 mt-0.5">{role.description}</p>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="role" value={role.key} />

        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 focus-within:border-slate-300">
          <Mail size={14} className="text-slate-400" />
          <input
            required
            autoFocus
            type="email"
            name="email"
            autoComplete="username"
            placeholder="E-posta"
            className="flex-1 text-[13px] focus:outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 focus-within:border-slate-300">
          <Lock size={14} className="text-slate-400" />
          <input
            required
            type={showPw ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Şifre"
            className="flex-1 text-[13px] focus:outline-none bg-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="text-slate-400"
            aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {state.error && (
          <div className="text-[12px] text-red-600 text-center bg-red-50 rounded-md py-2 px-2">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full text-white text-[13px] font-semibold py-2.5 rounded-xl disabled:opacity-60"
          style={{ background: RED }}
        >
          {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </>
  );
}
