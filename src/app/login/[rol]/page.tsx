import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME, RED } from "@/lib/constants";
import { AUTH_ROLES, roleBySlug } from "@/lib/auth-roles";
import AuthShell from "@/components/AuthShell";
import LoginForm from "../LoginForm";

export function generateStaticParams() {
  return AUTH_ROLES.map((r) => ({ rol: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rol: string }>;
}) {
  const role = roleBySlug((await params).rol);
  return { title: role ? `${role.heading} · Birikim Kutusu` : "Birikim Kutusu" };
}

export default async function RoleLoginPage({
  params,
}: {
  params: Promise<{ rol: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role] ?? "/");

  const { rol } = await params;
  const role = roleBySlug(rol);
  if (!role) notFound();

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
          <Link href={`/kayit/${role.slug}`} className="hover:underline">
            Kayıt Ol
          </Link>
        </div>
      }
    >
      <LoginForm slug={rol} />
    </AuthShell>
  );
}
