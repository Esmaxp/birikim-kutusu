import Link from "next/link";

import Avatar from "./Avatar";
import { RED } from "@/lib/constants";

export type GridStudent = {
  id: string;
  name: string;
  no: number;
  photoUrl?: string | null;
  sinif?: string;
};

export default function StudentGrid({
  students,
  selectedId,
  hrefFor,
}: {
  students: GridStudent[];
  selectedId?: string | null;
  hrefFor: (id: string) => string;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {students.map((s) => {
        const selected = s.id === selectedId;
        return (
          <Link
            key={s.id}
            href={hrefFor(s.id)}
            className={
              "bg-white rounded-xl border p-3 flex flex-col items-center gap-2 hover:shadow-sm transition-shadow " +
              (selected ? "" : "border-slate-200")
            }
            style={
              selected
                ? { borderColor: RED, boxShadow: `0 0 0 1px ${RED}` }
                : undefined
            }
          >
            <Avatar name={s.name} size={52} photoUrl={s.photoUrl} />
            <div className="text-[12px] font-semibold text-slate-700 text-center leading-tight">
              {s.name}
            </div>
            <div className="text-[11px] text-slate-400">
              {s.sinif ? `${s.sinif} · ` : ""}No: {s.no}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
