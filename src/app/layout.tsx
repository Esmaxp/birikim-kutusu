import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
