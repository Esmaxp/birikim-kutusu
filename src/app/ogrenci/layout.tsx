import { requireStudentProfile } from "@/lib/auth";
import { getUnreadCounts } from "@/actions/messages";
import AppShell, { type NavSection } from "@/components/AppShell";

export default async function OgrenciLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, student } = await requireStudentProfile();
  const unread = await getUnreadCounts();

  const sections: NavSection[] = [
    {
      title: "PANELİM",
      items: [
        { href: "/ogrenci", label: "Özet", icon: "dashboard" },
        { href: "/ogrenci/mesajlar", label: "Mesajlar", icon: "message", unread: unread.total },
        { href: "/ogrenci/kitap-kosesi", label: "Kitap Köşesi", icon: "book" },
        {
          href: "/ogrenci/deneme-analizi",
          label: "Deneme Analizi",
          icon: "chart",
          matchNested: true,
        },
        {
          href: "/ogrenci/devamsizlik",
          label: "Devamsızlığım",
          icon: "absence",
        },
        { href: "/ogrenci/pdr-notlari", label: "PDR Notlarım", icon: "pdr" },
      ],
    },
  ];

  return (
    <AppShell
      user={{
        name: user.name,
        role: user.role,
        title: `${student.class.name} · No: ${student.no}`,
      }}
      sections={sections}
      pageTitle="Birikim Kutusu"
    >
      {children}
    </AppShell>
  );
}
