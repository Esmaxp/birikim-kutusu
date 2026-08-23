"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarX,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Quote,
  StickyNote,
  Users,
  type LucideIcon,
} from "lucide-react";

import { RED, ROLE_LABELS, initialsOf } from "@/lib/constants";
import { logoutAction, logoutAllDevicesAction } from "@/app/login/actions";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  book: BookOpen,
  absence: CalendarX,
  note: StickyNote,
  pdr: HeartHandshake,
  chart: BarChart3,
  quote: Quote,
};

export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  /** true ise alt yollar da aktif sayılır */
  matchNested?: boolean;
};

export type NavSection = { title?: string; items: NavItem[] };

export type ShellUser = {
  name: string;
  role: string;
  title: string | null;
};

export default function AppShell({
  user,
  sections,
  pageTitle,
  children,
}: {
  user: ShellUser;
  sections: NavSection[];
  pageTitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    item.matchNested
      ? pathname === item.href || pathname.startsWith(item.href + "/")
      : pathname === item.href;

  return (
    <div className="min-h-screen bg-[#eef1f5] print:bg-white print:block flex">
      <aside className="print:hidden w-56 bg-white border-r border-slate-200 shrink-0 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-100">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ background: RED }}
          >
            <BookOpen size={16} />
          </div>
          <div>
            <div className="text-[11px] font-bold leading-none">BİRİKİM</div>
            <div className="text-[13px] font-bold leading-tight">Kutusu</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sections.map((section, si) => (
            <div
              key={si}
              className={"px-4 py-3 " + (si > 0 ? "border-t border-slate-100" : "")}
            >
              {section.title && (
                <div className="text-[10px] font-semibold text-slate-400 tracking-wider mb-2">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = ICONS[item.icon] ?? LayoutDashboard;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        "w-full flex items-center gap-2 text-[13px] py-1.5 px-2 rounded-lg " +
                        (active
                          ? "text-white font-semibold"
                          : "text-slate-600 hover:bg-slate-50")
                      }
                      style={active ? { background: RED } : undefined}
                    >
                      <Icon size={14} /> {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 space-y-1">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 text-[13px] text-slate-400 py-1.5 px-2 rounded-lg hover:bg-slate-50 hover:text-red-500"
            >
              <LogOut size={14} /> Çıkış Yap
            </button>
          </form>
          <form action={logoutAllDevicesAction}>
            <button
              type="submit"
              className="w-full text-left text-[11px] text-slate-400 py-1 px-2 rounded-lg hover:bg-slate-50 hover:text-red-500"
              title="Bu hesaba ait tüm oturumları sonlandırır"
            >
              Tüm cihazlardan çıkış
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="print:hidden bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-[15px] font-bold text-slate-700">
            {pageTitle ?? "Birikim Kutusu"}
          </div>
          <div className="flex items-center gap-2 pl-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
              style={{ background: RED }}
            >
              {initialsOf(user.name)}
            </div>
            <div className="leading-tight">
              <div className="text-[13px] text-slate-600 font-medium">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-400">
                {user.title ?? ROLE_LABELS[user.role]}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
