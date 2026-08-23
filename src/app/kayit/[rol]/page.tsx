import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME, RED } from "@/lib/constants";
import { AUTH_ROLES, roleBySlug } from "@/lib/auth-roles";
import AuthShell from "@/components/AuthShell";
import RegisterForm from "../RegisterForm";

export function generateStaticParams() {
  return AUTH_ROLES.map((r) => ({ rol: r.slug }));
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
  if (!role) notFound();

  const classes =
    role.key === "TEACHER"
      ? []
      : (
          await prisma.schoolClass.findMany({ orderBy: { order: "asc" } })
        ).map((c) => c.name);

  return (
    <AuthShell
      width={role.key === "PARENT" ? "md" : "sm"}
      footer={
        <div className="text-center text-[12px] text-slate-400">
          Hesabınız var mı?{" "}
          <Link
            href={`/login/${role.slug}`}
            className="hover:underline"
            style={{ color: RED }}
          >
            Giriş Yap
          </Link>
        </div>
      }
    >
      <RegisterForm slug={rol} classes={classes} />
    </AuthShell>
  );
}
