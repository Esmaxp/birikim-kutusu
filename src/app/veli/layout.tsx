import { requireUser } from "@/lib/auth";
import { getUnreadCounts } from "@/actions/messages";
import AppShell, { type NavSection } from "@/components/AppShell";

export default async function VeliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser(["PARENT"]);
  const unread = await getUnreadCounts();

  const sections: NavSection[] = [
    {
      title: "VELİ PANELİ",
      items: [{ href: "/veli", label: "Öğrencim", icon: "dashboard" }, { href: "/veli/mesajlar", label: "Mesajlar", icon: "message", unread: unread.total }],
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
