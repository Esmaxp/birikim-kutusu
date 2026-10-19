import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function OgretmenDashboard() {
  await requireUser(["TEACHER"]);
  const classes = await prisma.schoolClass.findMany({ select: { id: true, name: true } });
  classes.sort((a, b) => a.name.localeCompare(b.name, "tr", { numeric: true }));
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="Kontrol Paneli" />
      {classes.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classes.map((schoolClass) => (
            <Link key={schoolClass.id} href={`/ogretmen/sube/${encodeURIComponent(schoolClass.name)}`}
              className="flex min-h-36 items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-3xl font-semibold text-slate-800 shadow-sm transition-colors hover:border-birikim hover:bg-birikim-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-birikim focus-visible:ring-offset-2">
              {schoolClass.name}
            </Link>
          ))}
        </div>
      ) : <EmptyState title="Henüz şube yok" description="Şubeler eklendiğinde burada görünecek." />}
    </div>
  );
}
