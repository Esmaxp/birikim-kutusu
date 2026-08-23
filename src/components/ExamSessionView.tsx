"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Lock, Target } from "lucide-react";

import { confirmExamSession } from "@/actions/exam-session";
import type { ExamSessionData } from "@/lib/exam-session";
import { HATA_TURLERI, RED, SINAV_DERSLERI, formatDate, formatDateTime } from "@/lib/constants";

const SECTION_COLORS = [
  { badge: "bg-blue-500", border: "border-blue-100" },
  { badge: "bg-green-500", border: "border-green-100" },
  { badge: "bg-orange-500", border: "border-orange-100" },
  { badge: "bg-blue-500", border: "border-blue-100" },
  { badge: "bg-purple-500", border: "border-purple-100" },
  { badge: "bg-slate-500", border: "border-slate-200" },
];

function SectionCard({
  no,
  title,
  children,
}: {
  no: number;
  title: string;
  children: React.ReactNode;
}) {
  const color = SECTION_COLORS[(no - 1) % SECTION_COLORS.length];
  return (
    <div className={`bg-white rounded-xl border p-4 ${color.border}`}>
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0 ${color.badge}`}
        >
          {no}
        </span>
        <span className="text-[13px] font-semibold text-slate-700">{title}</span>
      </div>
      {children}
    </div>
  );
}

/** Deneme analizinin tamamen salt-okunur görünümü, Section 6'da öğrenci onay butonu hariç. */
export default function ExamSessionView({
  data,
  canConfirmAsStudent,
}: {
  data: ExamSessionData;
  canConfirmAsStudent: boolean;
}) {
  const [ogrenciOnayAt, setOgrenciOnayAt] = useState(data.ogrenciOnayAt);
  const [pending, startTransition] = useTransition();
  const [hata, setHata] = useState("");

  const hataTurleriLabels = HATA_TURLERI.filter((h) => data.hataTurleri.includes(h.key)).map(
    (h) => h.label
  );
  const gainsByDers = new Map<string, string[]>();
  for (const g of data.gains) {
    const arr = gainsByDers.get(g.ders) ?? [];
    arr.push(g.metin);
    gainsByDers.set(g.ders, arr);
  }

  const handleConfirm = () => {
    setHata("");
    startTransition(async () => {
      try {
        await confirmExamSession(data.id, "OGRENCI");
        setOgrenciOnayAt(new Date().toISOString());
      } catch (e) {
        setHata(e instanceof Error ? e.message : "Onaylanamadı.");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[14px] font-semibold text-slate-700">{data.sinavAdi}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <Lock size={11} /> Bu sayfa salt-okunurdur.
          </div>
        </div>
        <div className="text-[11px] text-slate-400">{formatDate(data.sinavTarihi)}</div>
      </div>

      <SectionCard no={1} title="Sınav Bilgileri">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
          <div>
            <div className="text-slate-400">Sınav Saati</div>
            <div className="text-slate-700">{data.sinavSaati ?? "-"}</div>
          </div>
          <div>
            <div className="text-slate-400">Görüşme Tarihi</div>
            <div className="text-slate-700">
              {data.gorusmeTarihi ? formatDate(data.gorusmeTarihi) : "-"}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-slate-400">Danışman</div>
            <div className="text-slate-700">{data.danismanAdi ?? "-"}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard no={2} title="Sınav Yönetimi (Zaman ve Çözüm Stratejisi)">
        <div className="text-[12px] text-slate-500 mb-2">
          Toplam Çözüm Süresi:{" "}
          <span className="font-medium text-slate-700">
            {data.toplamCozumSuresi ?? "-"} dk
          </span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-1.5 font-medium">Ders</th>
              <th className="pb-1.5 font-medium">Çözüm Süresi (dk)</th>
              <th className="pb-1.5 font-medium">Çözüm Sırası</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.map((s) => (
              <tr key={s.ders} className="border-t border-slate-100">
                <td className="py-1.5 text-slate-600">{s.ders}</td>
                <td className="py-1.5 text-slate-600">{s.cozumSuresi ?? "-"}</td>
                <td className="py-1.5 text-slate-600">{s.cozumSirasi ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard no={3} title="Sınav Süreci Değerlendirmesi">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
          <div className="border border-slate-200 rounded-lg p-3">
            <div className="font-medium text-slate-600 mb-1">
              İçsel (Ruhsal) Problem: {data.icselProblem ? "Evet" : "Hayır"}
            </div>
            {data.icselProblem && (
              <div className="text-slate-500">{data.icselAciklama ?? "-"}</div>
            )}
          </div>
          <div className="border border-slate-200 rounded-lg p-3">
            <div className="font-medium text-slate-600 mb-1">
              Dışsal Problem: {data.dissalProblem ? "Evet" : "Hayır"}
            </div>
            {data.dissalProblem && (
              <div className="text-slate-500">{data.dissalAciklama ?? "-"}</div>
            )}
          </div>
          <div className="border border-slate-200 rounded-lg p-3">
            <div className="font-medium text-slate-600 mb-1">
              Sınav Esnasında Hata: {data.hataYapildi ? "Evet" : "Hayır"}
            </div>
            {data.hataYapildi && (
              <div className="text-slate-500">
                {hataTurleriLabels.join(", ") || "-"}
                {data.hataDigerAciklama ? ` (${data.hataDigerAciklama})` : ""}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard no={4} title="Sınav Sonuç Analizi (Netler)">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="pb-1.5 font-medium">Ders</th>
                  <th className="pb-1.5 font-medium">Doğru</th>
                  <th className="pb-1.5 font-medium">Yanlış</th>
                  <th className="pb-1.5 font-medium">Boş</th>
                  <th className="pb-1.5 font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((s) => (
                  <tr key={s.ders} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-600">{s.ders}</td>
                    <td className="py-1.5 text-slate-600">{s.dogru}</td>
                    <td className="py-1.5 text-slate-600">{s.yanlis}</td>
                    <td className="py-1.5 text-slate-600">{s.bos}</td>
                    <td className="py-1.5 text-slate-700 font-medium">{s.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                ["Toplam Net", data.toplamNet],
                ["Puan", data.puan],
                ["Yüzdelik Dilim", data.yuzdelikDilim],
                ["Türkiye Sırası", data.turkiyeSirasi],
                ["Kurum Sırası", data.kurumSirasi],
                ["Sınıf Sırası", data.sinifSirasi],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-slate-400 mb-1">{label}</div>
                  <div className="text-[14px] font-bold text-slate-700">{value ?? "-"}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[12px] font-medium text-slate-600 mb-2">
              Kaçırılan (Çalışılacak) Kazanımlar
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {SINAV_DERSLERI.map((ders) => {
                const lines = (gainsByDers.get(ders) ?? []).filter((l) => l.trim().length > 0);
                return (
                  <div key={ders} className="border border-slate-200 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 mb-1">
                      <Target size={12} style={{ color: RED }} /> {ders}
                    </div>
                    {lines.length === 0 ? (
                      <div className="text-[11px] text-slate-300">-</div>
                    ) : (
                      <ul className="text-[11px] text-slate-500 list-disc pl-4 space-y-0.5">
                        {lines.map((l, i) => (
                          <li key={i}>{l}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard no={5} title="Analiz Notları">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
          <div>
            <div className="text-slate-400 mb-1">Genel Değerlendirme</div>
            <div className="text-slate-600 whitespace-pre-wrap">
              {data.genelDegerlendirme ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">
              Bir Sonraki Sınav İçin Alınacak Kararlar / Öneriler
            </div>
            <div className="text-slate-600 whitespace-pre-wrap">
              {data.kararlarOneriler ?? "-"}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard no={6} title="İmzalar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-lg p-3">
            <div className="text-[12px] font-medium text-slate-600 mb-2">Öğrenci Onayı</div>
            {ogrenciOnayAt ? (
              <div className="flex items-center gap-1.5 text-[12px] text-green-600">
                <CheckCircle2 size={14} /> Onayladın · {formatDateTime(ogrenciOnayAt)}
              </div>
            ) : canConfirmAsStudent ? (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={pending}
                  className="text-white text-[12px] font-medium px-3 py-1.5 rounded-lg disabled:opacity-60"
                  style={{ background: RED }}
                >
                  {pending ? "Onaylanıyor..." : "Onayla"}
                </button>
                {hata && <div className="text-[11px] text-red-600">{hata}</div>}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">Henüz onaylanmadı.</div>
            )}
          </div>

          <div className="border border-slate-200 rounded-lg p-3">
            <div className="text-[12px] font-medium text-slate-600 mb-2">
              Rehber Öğretmen Onayı
            </div>
            {data.rehberOnayAt ? (
              <div className="flex items-center gap-1.5 text-[12px] text-green-600">
                <CheckCircle2 size={14} /> {data.danismanAdi ?? "Rehber Öğretmen"} ·{" "}
                {formatDateTime(data.rehberOnayAt)}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">Henüz onaylanmadı.</div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
