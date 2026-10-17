import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { AUTH_ROLES } from "@/lib/auth-roles";
import AuthShell from "@/components/AuthShell";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role] ?? "/");

  return (
    <AuthShell
      footer={
        <div
          className="flex flex-wrap items-center justify-center gap-4 text-[13px] text-birikim"

        >
          <span className="text-slate-600">Şifre yardımı için okulunuzla iletişime geçin.</span>
          <span className="text-slate-600">|</span>
          <Link href="/kayit" className="hover:underline">
            Kayıt Ol
          </Link>
        </div>
      }
    >
      <h1 className="text-center text-xl font-bold text-slate-800">
        BİRİKİM KUTUSU
      </h1>
      <p className="text-center text-[13px] text-slate-600 mb-5">
        Eğitim Yönetim Sistemi
      </p>

      <div className="space-y-2.5">
        {AUTH_ROLES.map(({ slug, buttonLabel, description, icon: Icon }) => (
          <Link
            key={slug}
            href={`/login/${slug}`}
            className="group w-full flex items-center gap-4 border border-slate-200 p-4 rounded-xl hover:border-birikim-300 hover:bg-birikim-50 transition-colors"

          >
            <span className="rounded-xl bg-birikim-50 p-3 text-birikim"><Icon size={23} /></span><span className="text-left"><span className="block text-sm font-semibold text-slate-800">{buttonLabel}</span><span className="mt-1 block text-[13px] font-normal text-slate-600">{description}</span></span>
          </Link>
        ))}
      </div>
    </AuthShell>
  );
}
