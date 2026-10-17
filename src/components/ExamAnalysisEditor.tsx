"use client";
import { ConfirmButton } from "./ui/feedback";
import { toast } from "sonner";

import { parseUploadUrl } from "@/lib/upload-url";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FileText,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import Avatar from "./Avatar";
import { saveExamAnalysis } from "@/actions/exam";
import { DERSLER, DONUT_COLORS, RED, TRACK } from "@/lib/constants";
import {
  examOrtalama,
  examTrend,
  type ExamData,
  type ExamRow,
} from "@/lib/exam";

let counter = 0;
const nextId = () => `tmp-${Date.now()}-${counter++}`;

type DonutProps = {
  title: string;
  data: ExamRow[];
  totalSoru: number;
  onTotalChange: (v: number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: "label" | "count", value: string | number) => void;
};

function Donut({
  title,
  data,
  totalSoru,
  onTotalChange,
  onAdd,
  onRemove,
  onChange,
}: DonutProps) {
  const totalYanlis = data.reduce((s, d) => s + Number(d.count || 0), 0);
  const percent = totalSoru > 0 ? Math.round((totalYanlis / totalSoru) * 100) : 0;
  const chartData = data.length ? data : [{ id: "empty", label: "-", count: 1 }];

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
          {data.map((row, i) => (
            <div key={row.id} className="flex items-center gap-1.5 group">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              <input
                value={row.label}
                onChange={(e) => onChange(row.id, "label", e.target.value)}
                className="flex-1 min-w-0 text-[13px] text-slate-600 bg-transparent border-b border-transparent hover:border-slate-200 focus:outline-none truncate"
              />
              <input
                type="number"
                min={0}
                value={row.count}
                onChange={(e) => onChange(row.id, "count", Number(e.target.value))}
                className="w-10 text-[13px] text-right text-slate-700 font-medium bg-transparent border-b border-transparent hover:border-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onRemove(row.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 text-[13px] mt-1 text-birikim"

          >
            <Plus size={11} /> Yanlış ekle
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 pl-1">
        <span className="text-[13px] text-slate-600">Toplam soru sayısı</span>
        <input
          type="number"
          min={1}
          value={totalSoru}
          onChange={(e) => onTotalChange(Number(e.target.value))}
          className="w-12 text-[13px] text-slate-600 border-b border-slate-200 focus:outline-none bg-transparent"
        />
      </div>
    </div>
  );
}

export default function ExamAnalysisEditor({
  student,
  initialData,
}: {
  student: { id: string; name: string; sube: string; no: number };
  initialData: ExamData;
}) {
  const [data, setData] = useState<ExamData>(initialData);
  const [surukleniyor, setSurukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (fn: (d: ExamData) => ExamData) => setData((d) => fn(d));

  const ortalama = useMemo(() => examOrtalama(data.puanlar), [data.puanlar]);
  const trend = useMemo(() => examTrend(data.puanlar), [data.puanlar]);

  const addDers = () =>
    update((d) => ({
      ...d,
      dersler: [...d.dersler, { id: nextId(), ders: DERSLER[0], dakika: 60 }],
    }));
  const removeDers = (id: string) =>
    update((d) => ({ ...d, dersler: d.dersler.filter((r) => r.id !== id) }));
  const changeDers = (id: string, field: "ders" | "dakika", value: string | number) =>
    update((d) => ({
      ...d,
      dersler: d.dersler.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));

  const makeArrHandlers = (field: "konuYanlis" | "tipYanlis") => ({
    onAdd: () =>
      update((d) => ({
        ...d,
        [field]: [...d[field], { id: nextId(), label: "Yeni konu", count: 1 }],
      })),
    onRemove: (id: string) =>
      update((d) => ({ ...d, [field]: d[field].filter((r) => r.id !== id) })),
    onChange: (id: string, f: "label" | "count", value: string | number) =>
      update((d) => ({
        ...d,
        [field]: d[field].map((r) => (r.id === id ? { ...r, [f]: value } : r)),
      })),
  });

  const addPuan = () =>
    update((d) => ({
      ...d,
      puanlar: [...d.puanlar, { id: nextId(), ay: "Yeni Ay", puan: 0 }],
    }));
  const removePuan = (id: string) =>
    update((d) => ({ ...d, puanlar: d.puanlar.filter((r) => r.id !== id) }));
  const changePuan = (id: string, field: "ay" | "puan", value: string | number) =>
    update((d) => ({
      ...d,
      puanlar: d.puanlar.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    setHata("");
    setYukleniyor(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Yükleme başarısız.");
      update((d) => ({ ...d, dosyaAdi: json.name, dosyaUrl: json.url }));
    } catch (e) {
        toast.error(e instanceof Error ? e.message : "İşlem tamamlanamadı.");
      setHata(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setYukleniyor(false);
    }
  };

  const handleSave = () => {
    setHata("");
    startTransition(async () => {
      try {
        await saveExamAnalysis(student.id, data);
        setMesaj("Kaydedildi ✓");
        toast.success("Kaydedildi.");
        setTimeout(() => setMesaj(""), 2500);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "İşlem tamamlanamadı.");
        setHata(e instanceof Error ? e.message : "Kaydedilemedi.");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} size={36} />
          <div>
            <div className="text-[13px] font-semibold">{student.name}</div>
            <div className="text-[13px] text-slate-600">
              {student.sube} · No: {student.no}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hata && <span className="text-[13px] text-red-600">{hata}</span>}
          {mesaj && (
            <span className="text-[13px] text-green-600 font-medium">{mesaj}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="flex items-center gap-1.5 text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-60 bg-birikim"

          >
            <Save size={14} /> {pending ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3">
            Sınav Sonuçları PDF Yükleme Alanı
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setSurukleniyor(true);
            }}
            onDragLeave={() => setSurukleniyor(false)}
            onDrop={(e) => {
              e.preventDefault();
              setSurukleniyor(false);
              void handleFiles(e.dataTransfer.files);
            }}
            className={
              "border-2 border-dashed rounded-lg py-8 flex flex-col items-center justify-center text-center " +
              (surukleniyor ? "bg-birikim-50 border-birikim" : "bg-slate-50 border-birikim-200")
            }

          >
            <Upload size={26}  className="mb-2 text-birikim" />
            <div className="text-[13px] text-slate-600">
              Sınav Sonuç PDF&apos;ini buraya sürükleyin
            </div>
            <div className="text-[13px] text-slate-600 mb-3">veya</div>
            <input aria-label="Dosya seç"
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={yukleniyor}
              className="text-white text-[13px] font-medium px-4 py-2 rounded-lg disabled:opacity-60 bg-birikim"

            >
              {yukleniyor ? "Yükleniyor..." : "Dosya Seç"}
            </button>
          </div>
          {data.dosyaAdi && parseUploadUrl(data.dosyaUrl, "any") && (
            <div className="flex items-center justify-between mt-3 bg-slate-50 rounded-lg px-3 py-2">
              <a
                href={parseUploadUrl(data.dosyaUrl, "any") ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] text-slate-600 truncate hover:underline"
              >
                <FileText size={14}  className="text-birikim" /> {data.dosyaAdi}
              </a>
              <button
                type="button"
                onClick={() =>
                  update((d) => ({ ...d, dosyaAdi: null, dosyaUrl: null }))
                }
                className="text-slate-600 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3">
            Sınav Çözüm Sırası ve Süre Bilgileri
          </div>
          <div className="space-y-2">
            {data.dersler.map((row, i) => (
              <div key={row.id} className="flex items-center gap-2 group">
                <span className="text-[13px] text-slate-600 w-4">{i + 1}.</span>
                <span className="text-[13px] text-slate-600 w-10 shrink-0">
                  Ders:
                </span>
                <select
                  value={row.ders}
                  onChange={(e) => changeDers(row.id, "ders", e.target.value)}
                  className="flex-1 text-[13px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none bg-white"
                >
                  {DERSLER.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                  {!DERSLER.includes(row.ders) && <option>{row.ders}</option>}
                </select>
                <input
                  type="number"
                  min={0}
                  value={row.dakika}
                  onChange={(e) =>
                    changeDers(row.id, "dakika", Number(e.target.value))
                  }
                  className="w-16 text-[13px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none text-right"
                />
                <span className="text-[13px] text-slate-600 w-9">Dakika</span>
                <ConfirmButton
                  type="button"
                  onConfirm={() => removeDers(row.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 shrink-0"
                 aria-label="Satırı sil">
                  <X size={13} />
                </ConfirmButton>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addDers}
            className="flex items-center gap-1 text-[13px] mt-3 text-birikim"

          >
            <Plus size={13} /> Ders ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3">
            Sınav Yanlış Analizi
          </div>
          <div className="flex flex-wrap gap-6">
            <Donut
              title="Konu Bazlı Yanlışlar"
              data={data.konuYanlis}
              totalSoru={data.konuToplamSoru}
              onTotalChange={(v) =>
                update((d) => ({ ...d, konuToplamSoru: v }))
              }
              {...makeArrHandlers("konuYanlis")}
            />
            <Donut
              title="Soru Tipi Bazlı Yanlışlar"
              data={data.tipYanlis}
              totalSoru={data.tipToplamSoru}
              onTotalChange={(v) => update((d) => ({ ...d, tipToplamSoru: v }))}
              {...makeArrHandlers("tipYanlis")}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[13px] font-semibold text-slate-700">
              Sınav Puan Gelişimi Grafiği
            </div>
            <div className="text-[13px] text-slate-600">
              Ortalama{" "}
              <span className="font-semibold text-slate-600">{ortalama}</span>
              {"  ·  "}
              <span className={trend >= 0 ? "text-green-600" : "text-red-500"}>
                {trend >= 0 ? "+" : ""}
                {trend}
              </span>
            </div>
          </div>
          <div className="h-[180px] -ml-2">
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
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.puanlar.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1 bg-slate-50 rounded-full pl-2.5 pr-1 py-1 group"
              >
                <input
                  value={p.ay}
                  onChange={(e) => changePuan(p.id, "ay", e.target.value)}
                  className="w-14 text-[13px] bg-transparent focus:outline-none text-slate-600"
                />
                <input
                  type="number"
                  value={p.puan}
                  onChange={(e) =>
                    changePuan(p.id, "puan", Number(e.target.value))
                  }
                  className="w-10 text-[13px] bg-transparent focus:outline-none text-slate-700 font-medium text-right"
                />
                <ConfirmButton
                  type="button"
                  onConfirm={() => removePuan(p.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500"
                 aria-label="Satırı sil">
                  <X size={11} />
                </ConfirmButton>
              </div>
            ))}
            <button
              type="button"
              onClick={addPuan}
              className="flex items-center gap-1 text-[13px] px-2 py-1 rounded-full border border-dashed text-birikim border-birikim-light"

            >
              <Plus size={11} /> Sınav ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
