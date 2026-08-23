"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Plus, User, X } from "lucide-react";

import { registerAction, type RegisterState } from "./actions";
import { roleBySlug } from "@/lib/auth-roles";
import { RED, YAKINLIKLAR } from "@/lib/constants";

const inputCls =
  "flex-1 text-[13px] focus:outline-none bg-transparent min-w-0";
const boxCls =
  "flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 focus-within:border-slate-300";
const selectCls =
  "w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white";

let siradakiSatirId = 1;

export default function RegisterForm({
  slug,
  classes,
}: {
  slug: string;
  classes: string[];
}) {
  const role = roleBySlug(slug);
  const [showPw, setShowPw] = useState(false);
  const [cocuklar, setCocuklar] = useState<number[]>([0]);
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    {}
  );

  if (!role) return null;
  const Icon = role.icon;

  const cocukEkle = () => setCocuklar((c) => [...c, siradakiSatirId++]);
  const cocukSil = (id: number) =>
    setCocuklar((c) => (c.length > 1 ? c.filter((x) => x !== id) : c));

  return (
    <>
      <Link
        href="/kayit"
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
        <h1 className="text-[17px] font-bold text-slate-800">
          {role.registerHeading}
        </h1>
        <p className="text-[12px] text-slate-400 mt-0.5">
          {role.registerDescription}
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="rol" value={role.slug} />

        <div className={boxCls}>
          <User size={14} className="text-slate-400" />
          <input
            required
            autoFocus
            name="name"
            placeholder={
              role.key === "STUDENT" ? "Ad Soyad (okul kaydındaki gibi)" : "Ad Soyad"
            }
            autoComplete="name"
            className={inputCls}
          />
        </div>

        <div className={boxCls}>
          <Mail size={14} className="text-slate-400" />
          <input
            required
            type="email"
            name="email"
            placeholder="E-posta"
            autoComplete="email"
            className={inputCls}
          />
        </div>

        <div className={boxCls}>
          <Lock size={14} className="text-slate-400" />
          <input
            required
            minLength={6}
            type={showPw ? "text" : "password"}
            name="password"
            placeholder="Şifre (en az 6 karakter)"
            autoComplete="new-password"
            className={inputCls}
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

        <div className={boxCls}>
          <Lock size={14} className="text-slate-400" />
          <input
            required
            minLength={6}
            type={showPw ? "text" : "password"}
            name="password2"
            placeholder="Şifre (tekrar)"
            autoComplete="new-password"
            className={inputCls}
          />
        </div>

        {role.key === "TEACHER" && (
          <input
            name="title"
            placeholder="Branş / unvan (örn. Matematik Öğretmeni)"
            className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
          />
        )}

        {role.key === "STUDENT" && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="block">
              <span className="text-[11px] text-slate-400">Şube</span>
              <select required name="sube" defaultValue="" className={selectCls}>
                <option value="" disabled>
                  Seçin
                </option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] text-slate-400">Okul No</span>
              <input
                required
                type="number"
                min={1}
                name="no"
                placeholder="örn. 120"
                className={selectCls}
              />
            </label>
          </div>
        )}

        {role.key === "PARENT" && (
          <div className="space-y-3 pt-1">
            <label className="block">
              <span className="text-[11px] text-slate-400">
                Yakınlık derecesi
              </span>
              <select
                required
                name="yakinlik"
                defaultValue=""
                className={selectCls}
              >
                <option value="" disabled>
                  Seçin
                </option>
                {YAKINLIKLAR.map((y) => (
                  <option key={y.key} value={y.key}>
                    {y.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-slate-600">
                  Çocuklarım
                </span>
                <button
                  type="button"
                  onClick={cocukEkle}
                  className="inline-flex items-center gap-1 text-[12px] hover:underline"
                  style={{ color: RED }}
                >
                  <Plus size={13} /> Çocuk ekle
                </button>
              </div>

              <div className="space-y-2">
                {cocuklar.map((id, i) => (
                  <div
                    key={id}
                    className="bg-slate-50 rounded-lg p-3 space-y-2 relative"
                  >
                    {cocuklar.length > 1 && (
                      <button
                        type="button"
                        onClick={() => cocukSil(id)}
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                        aria-label={`${i + 1}. çocuğu kaldır`}
                      >
                        <X size={13} />
                      </button>
                    )}
                    <input
                      required
                      name="cocukAd"
                      placeholder="Öğrenci adı soyadı"
                      className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        required
                        name="cocukSube"
                        defaultValue=""
                        className={selectCls}
                      >
                        <option value="" disabled>
                          Şube
                        </option>
                        {classes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <input
                        required
                        type="number"
                        min={1}
                        name="cocukNo"
                        placeholder="Okul No"
                        className={selectCls}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 mt-2">
                Bir öğrencinin anne ve baba olarak iki velisi olabilir; siz de
                birden fazla çocuk ekleyebilirsiniz. Bilgiler okul kaydıyla
                eşleşmezse kayıt tamamlanmaz.
              </p>
            </div>
          </div>
        )}

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
          {pending ? "Kaydediliyor..." : "Kaydı Tamamla"}
        </button>
      </form>
    </>
  );
}
