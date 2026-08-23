import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME, RED } from "@/lib/constants";
import { AUTH_ROLES } from "@/lib/auth-roles";
import AuthShell from "@/components/AuthShell";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role] ?? "/");

  return (
    <AuthShell
      footer={
        <div
          className="flex items-center justify-center gap-4 text-[12px]"
          style={{ color: RED }}
        >
          <button type="button" className="hover:underline">
            Şifremi Unuttum?
          </button>
          <span className="text-slate-300">|</span>
          <Link href="/kayit" className="hover:underline">
            Kayıt Ol
          </Link>
        </div>
      }
    >
      <h1 className="text-center text-xl font-bold text-slate-800">
        BİRİKİM KUTUSU
      </h1>
      <p className="text-center text-[12px] text-slate-400 mb-5">
        Eğitim Yönetim Sistemi
      </p>

      <div className="space-y-2.5">
        {AUTH_ROLES.map(({ slug, buttonLabel, icon: Icon }) => (
          <Link
            key={slug}
            href={`/login/${slug}`}
            className="w-full flex items-center justify-center gap-2 text-white text-[13px] font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: RED }}
          >
            <Icon size={16} /> {buttonLabel}
          </Link>
        ))}
      </div>
    </AuthShell>
  );
}
