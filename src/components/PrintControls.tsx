"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

import { RED } from "@/lib/constants";

/** Yazdır butonu (yazdırmada gizli) + ?auto=1 ile otomatik yazdırma tetikleyici. */
export default function PrintControls({ auto }: { auto: boolean }) {
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [auto]);

  return (
    <div className="print:hidden max-w-[900px] mx-auto mb-3 flex justify-end">
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center gap-1.5 text-white text-[13px] font-medium px-4 py-2 rounded-lg"
        style={{ background: RED }}
      >
        <Printer size={14} /> Yazdır
      </button>
    </div>
  );
}
