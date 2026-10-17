import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { AUTH_ROLES, roleBySlug } from "@/lib/auth-roles";
import AuthShell from "@/components/AuthShell";
import RegisterForm from "../RegisterForm";

export function generateStaticParams() {
  return AUTH_ROLES.filter((r) => r.registerEnabled).map((r) => ({ rol: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rol: string }>;
}) {
  const role = roleBySlug((await params).rol);
  return {
    title: role ? `${role.registerHeading} · Birikim Kutusu` : "Birikim Kutusu",
  };
}

export default async function RoleRegisterPage({
  params,
}: {
  params: Promise<{ rol: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role] ?? "/");

  const { rol } = await params;
  const role = roleBySlug(rol);
  if (!role?.registerEnabled) notFound();

  return (
    <AuthShell
      width={role.key === "PARENT" ? "md" : "sm"}
      footer={
        <div className="text-center text-[13px] text-slate-600">
          Hesabınız var mı?{" "}
          <Link
            href={`/login/${role.slug}`}
            className="underline underline-offset-4 text-birikim"

          >
            Giriş Yap
          </Link>
        </div>
      }
    >
      <RegisterForm slug={rol} />
    </AuthShell>
  );
}
