"use client";

import { parseUploadUrl } from "@/lib/upload-url";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Clock, FileText, Lock, TrendingDown, TrendingUp } from "lucide-react";

import { RED } from "@/lib/constants";
import { examOrtalama, examTrend, type ExamData } from "@/lib/exam";
import ExamDonutView from "./ExamDonutView";

/**
 * Deneme analizinin salt-okunur görünümü.
 * Öğrenci ve veli bu ekranda hiçbir veri giremez; yalnızca öğretmenin girdiği
 * analizi görüntüler.
 */
export default function ExamAnalysisView({
  data,
  studentName,
}: {
  data: ExamData;
  studentName: string;
}) {
  const ortalama = examOrtalama(data.puanlar);
  const trend = examTrend(data.puanlar);
  const toplamSure = data.dersler.reduce((s, d) => s + Number(d.dakika || 0), 0);

  const bosMu =
    !data.dersler.length &&
    !data.konuYanlis.length &&
    !data.tipYanlis.length &&
    !data.puanlar.length;

  if (bosMu) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
        <FileText size={30} className="mx-auto mb-3 text-slate-600" />
        <div className="text-[14px] font-semibold text-slate-600">
          Henüz deneme analizi yayınlanmadı
        </div>
        <p className="text-[13px] text-slate-600 mt-1 max-w-sm mx-auto">
          Öğretmenin sınav sonuçlarını sisteme girmesinin ardından analizin
          burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[13px] font-semibold text-slate-700">
            {studentName} · Deneme Analizi
          </div>
          <div className="text-[13px] text-slate-600 flex items-center gap-1 mt-0.5">
            <Lock size={11} /> Bu sayfa salt-okunurdur. Veriler öğretmenin
            girdiği sınav sonuçlarından oluşur.
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-center">
            <div className="text-[18px] font-bold text-slate-800">{ortalama}</div>
            <div className="text-[13px] text-slate-600">Ortalama</div>
          </div>
          <div className="text-center">
            <div
              className={
                "text-[18px] font-bold flex items-center gap-1 " +
                (trend >= 0 ? "text-green-600" : "text-red-500")
              }
            >
              {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {trend >= 0 ? "+" : ""}
              {trend}
            </div>
            <div className="text-[13px] text-slate-600">Gelişim</div>
          </div>
          <div className="text-center">
            <div className="text-[18px] font-bold text-slate-800">
              {data.puanlar.length}
            </div>
            <div className="text-[13px] text-slate-600">Deneme</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3">
            Sınav Puan Gelişimi Grafiği
          </div>
          <div className="h-[200px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.puanlar}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#f1f1f1" vertical={false} />
                <XAxis
                  dataKey="ay"
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    borderColor: "#e5e7eb",
                  }}
                />
                <Line
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

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-semibold text-slate-700">
              Sınav Çözüm Sırası ve Süreler
            </div>
            <div className="text-[13px] text-slate-600 flex items-center gap-1">
              <Clock size={12} /> Toplam {toplamSure} dk
            </div>
          </div>
          {data.dersler.length === 0 ? (
            <div className="text-[13px] text-slate-600">
              Süre bilgisi girilmemiş.
            </div>
          ) : (
            <div className="space-y-2">
              {data.dersler.map((row, i) => {
                const oran = toplamSure ? (row.dakika / toplamSure) * 100 : 0;
                return (
                  <div key={row.id}>
                    <div className="flex items-center justify-between text-[13px] mb-0.5">
                      <span className="text-slate-600">
                        <span className="text-slate-600 mr-1">{i + 1}.</span>
                        {row.ders}
                      </span>
                      <span className="text-slate-600">{row.dakika} dk</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-birikim"
                        style={{ width: `${oran}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-[13px] font-semibold text-slate-700 mb-3">
          Sınav Yanlış Analizi
        </div>
        <div className="flex flex-wrap gap-6">
          <ExamDonutView
            title="Konu Bazlı Yanlışlar"
            data={data.konuYanlis}
            totalSoru={data.konuToplamSoru}
          />
          <ExamDonutView
            title="Soru Tipi Bazlı Yanlışlar"
            data={data.tipYanlis}
            totalSoru={data.tipToplamSoru}
          />
        </div>
      </div>

      {data.dosyaAdi && parseUploadUrl(data.dosyaUrl, "any") && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-2">
            Sınav Sonuç Belgesi
          </div>
          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-[13px] text-slate-600 truncate">
              <FileText size={14}  className="text-birikim" /> {data.dosyaAdi}
            </div>
            {parseUploadUrl(data.dosyaUrl, "any") && (
              <a
                href={parseUploadUrl(data.dosyaUrl, "any") ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium shrink-0 text-birikim"

              >
                Görüntüle
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
