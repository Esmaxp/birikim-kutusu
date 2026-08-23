import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME, RED } from "@/lib/constants";
import { AUTH_ROLES } from "@/lib/auth-roles";
import AuthShell from "@/components/AuthShell";

export const metadata = { title: "Kayıt Ol · Birikim Kutusu" };

export default async function KayitPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role] ?? "/");

  return (
    <AuthShell
      footer={
        <div className="text-center text-[12px] text-slate-400">
          Hesabınız var mı?{" "}
          <Link href="/login" className="hover:underline" style={{ color: RED }}>
            Giriş Yap
          </Link>
        </div>
      }
    >
      <h1 className="text-center text-xl font-bold text-slate-800">KAYIT OL</h1>
      <p className="text-center text-[12px] text-slate-400 mb-5">
        Hangi hesabı oluşturmak istiyorsunuz?
      </p>

      <div className="space-y-2.5">
        {AUTH_ROLES.map(({ slug, registerButtonLabel, icon: Icon }) => (
          <Link
            key={slug}
            href={`/kayit/${slug}`}
            className="w-full flex items-center justify-center gap-2 text-white text-[13px] font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: RED }}
          >
            <Icon size={16} /> {registerButtonLabel}
          </Link>
        ))}
      </div>
    </AuthShell>
  );
}
