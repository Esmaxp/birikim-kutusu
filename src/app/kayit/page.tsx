import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { AUTH_ROLES } from "@/lib/auth-roles";
import AuthShell from "@/components/AuthShell";

export const metadata = { title: "Kayıt Ol · Birikim Kutusu" };

export default async function KayitPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role] ?? "/");

  return (
    <AuthShell
      footer={
        <div className="text-center text-[13px] text-slate-600">
          Hesabınız var mı?{" "}
          <Link href="/login" className="underline underline-offset-4 text-birikim" >
            Giriş Yap
          </Link>
        </div>
      }
    >
      <h1 className="text-center text-xl font-bold text-slate-800">KAYIT OL</h1>
      <p className="text-center text-[13px] text-slate-600 mb-5">
        Hangi hesabı oluşturmak istiyorsunuz?
      </p>

      <div className="space-y-2.5">
        {AUTH_ROLES.filter((r) => r.registerEnabled).map(({ slug, registerButtonLabel, description, icon: Icon }) => (
          <Link
            key={slug}
            href={`/kayit/${slug}`}
            className="group w-full flex items-center gap-4 border border-slate-200 p-4 rounded-xl hover:border-birikim-300 hover:bg-birikim-50 transition-colors"

          >
            <span className="rounded-xl bg-birikim-50 p-3 text-birikim"><Icon size={23} /></span><span className="text-left"><span className="block text-sm font-semibold text-slate-800">{registerButtonLabel}</span><span className="mt-1 block text-[13px] font-normal text-slate-600">{description}</span></span>
          </Link>
        ))}
      </div>
    </AuthShell>
  );
}
