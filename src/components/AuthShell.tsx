import { BookOpen } from "lucide-react";

import { RED } from "@/lib/constants";

/** Giriş ve kayıt sayfalarının ortak çerçevesi: logo, beyaz kart ve alt bilgi. */
export default function AuthShell({
  children,
  footer,
  width = "sm",
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md";
}) {
  return (
    <div className="min-h-screen bg-[#eef1f5] flex items-center justify-center p-6">
      <div className={"w-full " + (width === "md" ? "max-w-md" : "max-w-sm")}>
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-3"
            style={{ background: RED }}
          >
            <BookOpen size={26} />
          </div>
          <div className="text-[13px] font-bold tracking-wide">BİRİKİM</div>
          <div className="text-[9px] text-slate-400 tracking-widest -mt-0.5">
            OKULLARI
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {children}
          {footer && <div className="mt-4">{footer}</div>}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          © {new Date().getFullYear()} Birikim Okulları - Tüm Hakları Saklıdır.
        </p>
      </div>
    </div>
  );
}
