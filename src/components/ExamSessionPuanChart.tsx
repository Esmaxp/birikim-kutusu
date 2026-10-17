"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { RED } from "@/lib/constants";

/** ExamSession kayıtları üzerinden zaman içindeki puan gelişimi (eski ScorePoint'in yerini alır). */
export default function ExamSessionPuanChart({
  data,
}: {
  data: { ad: string; puan: number }[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-[13px] font-semibold text-slate-700 mb-3">
        Sınav Puan Gelişimi Grafiği
      </div>
      <div className="h-[200px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#f1f1f1" vertical={false} />
            <XAxis
              dataKey="ad"
              tick={{ fontSize: 12, fill: "#475569" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip formatter={(v: number) => [v.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), "Puan"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e5e7eb" }}
            />
            <Line
              isAnimationActive={false}
              type="monotone"
              dataKey="puan"
              name="Puan"
              stroke={RED}
              strokeWidth={2.5}
              dot={{ r: 4, fill: RED }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
