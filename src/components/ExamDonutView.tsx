"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import { DONUT_COLORS, TRACK } from "@/lib/constants";
import type { ExamRow } from "@/lib/exam";

/** Salt-okunur halka grafik (öğrenci / veli görünümü). */
export default function ExamDonutView({
  title,
  data,
  totalSoru,
}: {
  title: string;
  data: ExamRow[];
  totalSoru: number;
}) {
  const totalYanlis = data.reduce((s, d) => s + Number(d.count || 0), 0);
  const percent = totalSoru > 0 ? Math.round((totalYanlis / totalSoru) * 100) : 0;
  const chartData = data.length
    ? data
    : [{ id: "empty", label: "-", count: 1 }];

  return (
    <div className="flex-1 min-w-[250px]">
      <div className="text-[13px] font-semibold text-slate-700 mb-2">{title}</div>
      <div className="flex items-center gap-4">
        <div className="relative w-[120px] h-[120px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                innerRadius={38}
                outerRadius={56}
                startAngle={90}
                endAngle={-270}
                paddingAngle={data.length > 1 ? 2 : 0}
                stroke="none"
                isAnimationActive={false}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={entry.id}
                    fill={
                      data.length ? DONUT_COLORS[i % DONUT_COLORS.length] : TRACK
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-slate-800">{percent}%</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          {data.length === 0 && (
            <div className="text-[12px] text-slate-400">Henüz veri girilmemiş.</div>
          )}
          {data.map((row, i) => (
            <div key={row.id} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              <span className="flex-1 min-w-0 text-[12px] text-slate-600 truncate">
                {row.label}
              </span>
              <span className="text-[12px] text-slate-700 font-medium">
                {row.count}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-[11px] text-slate-400 mt-2 pl-1">
        Toplam soru sayısı: <span className="text-slate-600">{totalSoru}</span>
      </div>
    </div>
  );
}
