import { requireUser } from "@/lib/auth";
import AppShell, { type NavSection } from "@/components/AppShell";

export default async function OgretmenLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["TEACHER"]);
  const sections: NavSection[] = [{
    items: [
      { href: "/ogretmen", label: "Kontrol Paneli", icon: "dashboard" },
      { href: "/ogretmen/yonetim/ogrenciler", label: "Öğrenci Yönetimi", icon: "users" },
      { href: "/ogretmen/yonetim/davet-kodlari", label: "Davet Kodları", icon: "users" },
    ],
  }];
  if (user.isAdmin) sections.push({ title: "YÖNETİCİ", items: [
    { href: "/ogretmen/yonetim/ogretmenler", label: "Yönetim", icon: "users", matchNested: true },
  ] });
  return <AppShell user={{ name: user.name, role: user.role, title: user.title }} sections={sections} pageTitle="Birikim Kutusu">{children}</AppShell>;
}
