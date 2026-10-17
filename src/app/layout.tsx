import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/feedback";
import type { Metadata } from "next";
import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Birikim Kutusu | Birikim Okulları",
  description: "Birikim Okulları Eğitim Yönetim Sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={font.variable}>{children}<div className="print:hidden"><Toaster /></div></body>
    </html>
  );
}
