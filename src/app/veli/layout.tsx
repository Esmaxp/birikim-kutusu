import { requireUser } from "@/lib/auth";
import AppShell, { type NavSection } from "@/components/AppShell";

export default async function VeliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser(["PARENT"]);

  const sections: NavSection[] = [
    {
      title: "VELİ PANELİ",
      items: [{ href: "/veli", label: "Öğrencim", icon: "dashboard" }],
    },
  ];

  return (
    <AppShell
      user={{ name: user.name, role: user.role, title: user.title }}
      sections={sections}
      pageTitle="Birikim Kutusu · Veli"
    >
      {children}
    </AppShell>
  );
}
