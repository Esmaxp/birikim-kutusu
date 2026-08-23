import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell, { type NavSection } from "@/components/AppShell";

export default async function OgretmenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser(["TEACHER"]);
  const classes = await prisma.schoolClass.findMany({
    orderBy: { order: "asc" },
  });

  const sections: NavSection[] = [
    {
      title: "PANELİM",
      items: [
        { href: "/ogretmen", label: "Kontrol Paneli", icon: "dashboard" },
        { href: "/ogretmen/rehberlik", label: "Rehberlik", icon: "pdr" },
        { href: "/ogretmen/notlar", label: "Notlarım", icon: "note" },
      ],
    },
    {
      title: "ŞUBELER",
      items: classes.map((c) => ({
        href: `/ogretmen/sube/${encodeURIComponent(c.name)}`,
        label: c.name,
        icon: "users" as const,
        matchNested: true,
      })),
    },
  ];

  return (
    <AppShell
      user={{ name: user.name, role: user.role, title: user.title }}
      sections={sections}
      pageTitle="Birikim Kutusu"
    >
      {children}
    </AppShell>
  );
}
