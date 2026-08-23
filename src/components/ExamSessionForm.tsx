"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Printer,
  Save,
  Target,
  X,
} from "lucide-react";

import Avatar from "./Avatar";
import { saveExamSession, confirmExamSession } from "@/actions/exam-session";
import type { ExamSessionInput } from "@/lib/exam-session";
import { HATA_TURLERI, RED, SINAV_DERSLERI, formatDateTime } from "@/lib/constants";
import { netHesapla } from "@/lib/exam";

let counter = 0;
const nextId = () => `tmp-${Date.now()}-${counter++}`;

type SubjectRow = {
  ders: string;
  cozumSuresi: number | null;
  cozumSirasi: number | null;
  dogru: number;
  yanlis: number;
  bos: number;
};
type GainLine = { id: string; ders: string; metin: string };
type Danisman = { id: string; name: string; title: string | null };
type ConfirmInfo = {
  ogrenciOnayAt: string | null;
  ogrenciAdi: string;
  rehberOnayAt: string | null;
  rehberAdi: string | null;
};

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

const inputCls =
  "text-[12px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-slate-300 w-full";
const labelCls = "text-[11px] text-slate-500 mb-1 block";

export default function ExamSessionForm({
  studentId,
  examId,
  student,
  initialData,
  danismanlar,
  confirm,
}: {
  studentId: string;
  examId: string | null;
  student: { id: string; name: string; no: number; sube: string; photoUrl: string | null };
  initialData: ExamSessionInput;
  danismanlar: Danisman[];
  confirm: ConfirmInfo | null;
}) {
  const [currentExamId, setCurrentExamId] = useState<string | null>(examId);

  const [form, setForm] = useState({
    sinavAdi: initialData.sinavAdi,
    sinavTarihi: initialData.sinavTarihi,
    sinavSaati: initialData.sinavSaati ?? "",
    gorusmeTarihi: initialData.gorusmeTarihi ?? "",
    danismanId: initialData.danismanId ?? "",
    toplamCozumSuresi:
      initialData.toplamCozumSuresi === null ? "" : String(initialData.toplamCozumSuresi),
    icselProblem: initialData.icselProblem,
    icselAciklama: initialData.icselAciklama ?? "",
    dissalProblem: initialData.dissalProblem,
    dissalAciklama: initialData.dissalAciklama ?? "",
    hataYapildi: initialData.hataYapildi,
    hataTurleri: initialData.hataTurleri,
    hataDigerAciklama: initialData.hataDigerAciklama ?? "",
    puan: initialData.puan === null ? "" : String(initialData.puan),
    yuzdelikDilim: initialData.yuzdelikDilim === null ? "" : String(initialData.yuzdelikDilim),
    turkiyeSirasi: initialData.turkiyeSirasi === null ? "" : String(initialData.turkiyeSirasi),
    kurumSirasi: initialData.kurumSirasi === null ? "" : String(initialData.kurumSirasi),
    sinifSirasi: initialData.sinifSirasi === null ? "" : String(initialData.sinifSirasi),
    genelDegerlendirme: initialData.genelDegerlendirme ?? "",
    kararlarOneriler: initialData.kararlarOneriler ?? "",
  });
  const [subjects, setSubjects] = useState<SubjectRow[]>(initialData.subjects);
  const [gains, setGains] = useState<GainLine[]>(
    initialData.gains.map((g) => ({ id: nextId(), ...g }))
  );

  // Öğrenci onayı yalnızca öğrencinin kendi panelinden verilir (bkz. Part 6);
  // burada salt-okunur gösterilir.
  const [ogrenciOnay] = useState(confirm?.ogrenciOnayAt ?? null);
  const [rehberOnay, setRehberOnay] = useState(confirm?.rehberOnayAt ?? null);

  const [dirty, setDirty] = useState(false);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setDirty(true);
  }, [form, subjects, gains]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const [pending, startTransition] = useTransition();
  const [confirmPending, startConfirmTransition] = useTransition();
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");

  const updateSubject = (ders: string, patch: Partial<SubjectRow>) =>
    setSubjects((rows) => rows.map((r) => (r.ders === ders ? { ...r, ...patch } : r)));

  const setIcsel = (val: boolean) =>
    setForm((f) => ({ ...f, icselProblem: val, icselAciklama: val ? f.icselAciklama : "" }));
  const setDissal = (val: boolean) =>
    setForm((f) => ({ ...f, dissalProblem: val, dissalAciklama: val ? f.dissalAciklama : "" }));
  const setHataYapildi = (val: boolean) =>
    setForm((f) => ({
      ...f,
      hataYapildi: val,
      hataTurleri: val ? f.hataTurleri : [],
      hataDigerAciklama: val ? f.hataDigerAciklama : "",
    }));
  const toggleHataTuru = (key: string) =>
    setForm((f) => {
      const has = f.hataTurleri.includes(key);
      const next = has ? f.hataTurleri.filter((k) => k !== key) : [...f.hataTurleri, key];
      return {
        ...f,
        hataTurleri: next,
        hataDigerAciklama: next.includes("DIGER") ? f.hataDigerAciklama : "",
      };
    });

  const addGain = (ders: string) =>
    setGains((g) => [...g, { id: nextId(), ders, metin: "" }]);
  const removeGain = (id: string) => setGains((g) => g.filter((x) => x.id !== id));
  const changeGain = (id: string, metin: string) =>
    setGains((g) => g.map((x) => (x.id === id ? { ...x, metin } : x)));

  // Section 2 canlı uyarılar
  const toplamSuresiSayi =
    form.toplamCozumSuresi === "" ? null : Number(form.toplamCozumSuresi);
  const sureToplami = subjects.reduce((s, r) => s + (r.cozumSuresi ?? 0), 0);
  const sureUyarisi = toplamSuresiSayi !== null && sureToplami > toplamSuresiSayi;
  const siralar = subjects.map((r) => r.cozumSirasi).filter((v): v is number => v !== null);
  const siraTekrar = siralar.length !== new Set(siralar).size;

  // Section 4 canlı netler
  const netler = subjects.map((r) => netHesapla(r.dogru, r.yanlis));
  const toplamNetCanli = Math.round(netler.reduce((s, n) => s + n, 0) * 100) / 100;

  const handleSave = () => {
    setHata("");
    startTransition(async () => {
      try {
        const payload: ExamSessionInput = {
          sinavAdi: form.sinavAdi,
          sinavTarihi: form.sinavTarihi,
          sinavSaati: form.sinavSaati || null,
          gorusmeTarihi: form.gorusmeTarihi || null,
          danismanId: form.danismanId || null,
          toplamCozumSuresi:
            form.toplamCozumSuresi === "" ? null : Number(form.toplamCozumSuresi),
          icselProblem: form.icselProblem,
          icselAciklama: form.icselProblem ? form.icselAciklama : null,
          dissalProblem: form.dissalProblem,
          dissalAciklama: form.dissalProblem ? form.dissalAciklama : null,
          hataYapildi: form.hataYapildi,
          hataTurleri: form.hataYapildi ? form.hataTurleri : [],
          hataDigerAciklama:
            form.hataYapildi && form.hataTurleri.includes("DIGER")
              ? form.hataDigerAciklama
              : null,
          puan: form.puan === "" ? null : Number(form.puan),
          yuzdelikDilim: form.yuzdelikDilim === "" ? null : Number(form.yuzdelikDilim),
          turkiyeSirasi: form.turkiyeSirasi === "" ? null : Number(form.turkiyeSirasi),
          kurumSirasi: form.kurumSirasi === "" ? null : Number(form.kurumSirasi),
          sinifSirasi: form.sinifSirasi === "" ? null : Number(form.sinifSirasi),
          genelDegerlendirme: form.genelDegerlendirme || null,
          kararlarOneriler: form.kararlarOneriler || null,
          subjects: subjects.map((r) => ({
            ders: r.ders,
            cozumSuresi: r.cozumSuresi,
            cozumSirasi: r.cozumSirasi,
            dogru: r.dogru,
            yanlis: r.yanlis,
            bos: r.bos,
          })),
          gains: gains.map((g) => ({ ders: g.ders, metin: g.metin })),
        };

        const res = await saveExamSession(studentId, currentExamId, payload);
        setDirty(false);
        setMesaj("Kaydedildi ✓");
        setTimeout(() => setMesaj(""), 2500);

        if (!currentExamId) {
          setCurrentExamId(res.id);
          const newUrl = window.location.pathname.replace(
            /\/deneme\/yeni(?=(\?|$))/,
            `/deneme/${res.id}`
          );
          window.history.replaceState(null, "", newUrl + window.location.search);
        }
      } catch (e) {
        setHata(e instanceof Error ? e.message : "Kaydedilemedi.");
      }
    });
  };

  const handleRehberOnay = () => {
    if (!currentExamId) return;
    setHata("");
    startConfirmTransition(async () => {
      try {
        await confirmExamSession(currentExamId, "REHBER");
        setRehberOnay(new Date().toISOString());
      } catch (e) {
        setHata(e instanceof Error ? e.message : "Onaylanamadı.");
      }
    });
  };

  return (
    <div className="space-y-5">
      <Link
        href={`/ogretmen/ogrenci/${studentId}?tab=deneme`}
        className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-700 w-fit"
      >
        <ArrowLeft size={13} /> Öğrenci deneme listesine dön
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between flex-wrap gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} size={36} photoUrl={student.photoUrl} />
          <div>
            <div className="text-[13px] font-semibold">{student.name}</div>
            <div className="text-[11px] text-slate-400">
              {student.sube} · No: {student.no}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hata && <span className="text-[12px] text-red-600">{hata}</span>}
          {mesaj && <span className="text-[12px] text-green-600 font-medium">{mesaj}</span>}
          {currentExamId && (
            <Link
              href={`/ogretmen/ogrenci/${studentId}/deneme/${currentExamId}/yazdir`}
              target="_blank"
              className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Printer size={14} /> Yazdır
            </Link>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="flex items-center gap-1.5 text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-60"
            style={{ background: RED }}
          >
            <Save size={14} /> {pending ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      {/* Section 1 */}
      <SectionCard no={1} title="Sınav Bilgileri">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className={labelCls}>Sınav Adı *</label>
            <input
              required
              value={form.sinavAdi}
              onChange={(e) => setForm((f) => ({ ...f, sinavAdi: e.target.value }))}
              className={inputCls}
              placeholder="örn. Nisan Ayı Genel Deneme"
            />
          </div>
          <div>
            <label className={labelCls}>Sınav Tarihi *</label>
            <input
              required
              type="date"
              value={form.sinavTarihi}
              onChange={(e) => setForm((f) => ({ ...f, sinavTarihi: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Sınav Saati</label>
            <input
              type="time"
              value={form.sinavSaati}
              onChange={(e) => setForm((f) => ({ ...f, sinavSaati: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Görüşme Tarihi</label>
            <input
              type="date"
              value={form.gorusmeTarihi}
              onChange={(e) => setForm((f) => ({ ...f, gorusmeTarihi: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <label className={labelCls}>Danışman</label>
            <select
              value={form.danismanId}
              onChange={(e) => setForm((f) => ({ ...f, danismanId: e.target.value }))}
              className={inputCls + " bg-white"}
            >
              <option value="">Seçiniz</option>
              {danismanlar.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.title ? ` (${d.title})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      {/* Section 2 */}
      <SectionCard no={2} title="Sınav Yönetimi (Zaman ve Çözüm Stratejisi)">
        <div className="max-w-[220px] mb-4">
          <label className={labelCls}>Toplam Çözüm Süresi (dk)</label>
          <input
            type="number"
            min={0}
            value={form.toplamCozumSuresi}
            onChange={(e) => setForm((f) => ({ ...f, toplamCozumSuresi: e.target.value }))}
            className={inputCls}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="pb-1.5 font-medium">Ders</th>
                <th className="pb-1.5 font-medium w-32">Çözüm Süresi (dk)</th>
                <th className="pb-1.5 font-medium w-32">Çözüm Sırası</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((r) => (
                <tr key={r.ders} className="border-t border-slate-100">
                  <td className="py-1.5 pr-2 text-slate-600">{r.ders}</td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min={0}
                      value={r.cozumSuresi ?? ""}
                      onChange={(e) =>
                        updateSubject(r.ders, {
                          cozumSuresi: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className={inputCls}
                    />
                  </td>
                  <td className="py-1.5">
                    <input
                      type="number"
                      min={1}
                      max={SINAV_DERSLERI.length}
                      value={r.cozumSirasi ?? ""}
                      onChange={(e) =>
                        updateSubject(r.ders, {
                          cozumSirasi: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className={inputCls}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(sureUyarisi || siraTekrar) && (
          <div className="mt-3 space-y-1">
            {sureUyarisi && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 rounded-md px-2 py-1.5">
                <AlertTriangle size={12} /> Ders sürelerinin toplamı ({sureToplami} dk),
                belirtilen toplam çözüm süresini ({toplamSuresiSayi} dk) aşıyor.
              </div>
            )}
            {siraTekrar && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 rounded-md px-2 py-1.5">
                <AlertTriangle size={12} /> Çözüm sırası birden fazla derste tekrar ediyor.
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Section 3 */}
      <SectionCard no={3} title="Sınav Süreci Değerlendirmesi">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-200 rounded-lg p-3">
            <div className="text-[12px] font-medium text-slate-600 mb-2">
              İçsel (Ruhsal) Problem Yaşandı mı?
            </div>
            <div className="flex gap-3 text-[12px] mb-2">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="icselProblem"
                  checked={!form.icselProblem}
                  onChange={() => setIcsel(false)}
                  className="accent-[#c1272d]"
                />
                Hayır
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="icselProblem"
                  checked={form.icselProblem}
                  onChange={() => setIcsel(true)}
                  className="accent-[#c1272d]"
                />
                Evet
              </label>
            </div>
            {form.icselProblem && (
              <textarea
                rows={3}
                value={form.icselAciklama}
                onChange={(e) => setForm((f) => ({ ...f, icselAciklama: e.target.value }))}
                placeholder="Açıklama"
                className={inputCls + " resize-none"}
              />
            )}
          </div>

          <div className="border border-slate-200 rounded-lg p-3">
            <div className="text-[12px] font-medium text-slate-600 mb-2">
              Dışsal Problem Yaşandı mı?
            </div>
            <div className="flex gap-3 text-[12px] mb-2">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="dissalProblem"
                  checked={!form.dissalProblem}
                  onChange={() => setDissal(false)}
                  className="accent-[#c1272d]"
                />
                Hayır
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="dissalProblem"
                  checked={form.dissalProblem}
                  onChange={() => setDissal(true)}
                  className="accent-[#c1272d]"
                />
                Evet
              </label>
            </div>
            {form.dissalProblem && (
              <textarea
                rows={3}
                value={form.dissalAciklama}
                onChange={(e) => setForm((f) => ({ ...f, dissalAciklama: e.target.value }))}
                placeholder="Açıklama"
                className={inputCls + " resize-none"}
              />
            )}
          </div>

          <div className="border border-slate-200 rounded-lg p-3">
            <div className="text-[12px] font-medium text-slate-600 mb-2">
              Sınav Esnasında Hata Yapıldı mı?
            </div>
            <div className="flex gap-3 text-[12px] mb-2">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="hataYapildi"
                  checked={!form.hataYapildi}
                  onChange={() => setHataYapildi(false)}
                  className="accent-[#c1272d]"
                />
                Hayır
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="hataYapildi"
                  checked={form.hataYapildi}
                  onChange={() => setHataYapildi(true)}
                  className="accent-[#c1272d]"
                />
                Evet
              </label>
            </div>
            {form.hataYapildi && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1">
                  {HATA_TURLERI.map((h) => (
                    <label key={h.key} className="flex items-center gap-1.5 text-[11px]">
                      <input
                        type="checkbox"
                        checked={form.hataTurleri.includes(h.key)}
                        onChange={() => toggleHataTuru(h.key)}
                        className="accent-[#c1272d]"
                      />
                      {h.label}
                    </label>
                  ))}
                </div>
                {form.hataTurleri.includes("DIGER") && (
                  <input
                    value={form.hataDigerAciklama}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hataDigerAciklama: e.target.value }))
                    }
                    placeholder="Diğer hata açıklaması"
                    className={inputCls}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Section 4 */}
      <SectionCard no={4} title="Sınav Sonuç Analizi (Netler)">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="pb-1.5 font-medium">Ders</th>
                    <th className="pb-1.5 font-medium w-16">Doğru</th>
                    <th className="pb-1.5 font-medium w-16">Yanlış</th>
                    <th className="pb-1.5 font-medium w-16">Boş</th>
                    <th className="pb-1.5 font-medium w-16">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((r, i) => (
                    <tr key={r.ders} className="border-t border-slate-100">
                      <td className="py-1.5 pr-2 text-slate-600">{r.ders}</td>
                      <td className="py-1.5 pr-1">
                        <input
                          type="number"
                          min={0}
                          value={r.dogru}
                          onChange={(e) =>
                            updateSubject(r.ders, { dogru: Number(e.target.value) || 0 })
                          }
                          className={inputCls}
                        />
                      </td>
                      <td className="py-1.5 pr-1">
                        <input
                          type="number"
                          min={0}
                          value={r.yanlis}
                          onChange={(e) =>
                            updateSubject(r.ders, { yanlis: Number(e.target.value) || 0 })
                          }
                          className={inputCls}
                        />
                      </td>
                      <td className="py-1.5 pr-1">
                        <input
                          type="number"
                          min={0}
                          value={r.bos}
                          onChange={(e) =>
                            updateSubject(r.ders, { bos: Number(e.target.value) || 0 })
                          }
                          className={inputCls}
                        />
                      </td>
                      <td className="py-1.5 text-slate-700 font-medium">{netler[i]}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200 font-bold text-slate-700">
                    <td className="py-1.5">TOPLAM</td>
                    <td className="py-1.5">{subjects.reduce((s, r) => s + r.dogru, 0)}</td>
                    <td className="py-1.5">{subjects.reduce((s, r) => s + r.yanlis, 0)}</td>
                    <td className="py-1.5">{subjects.reduce((s, r) => s + r.bos, 0)}</td>
                    <td className="py-1.5">{toplamNetCanli}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-400 mb-1">Toplam Net</div>
                <div className="text-[14px] font-bold text-slate-700">{toplamNetCanli}</div>
              </div>
              {(
                [
                  { label: "Puan", field: "puan" },
                  { label: "Yüzdelik Dilim", field: "yuzdelikDilim" },
                  { label: "Türkiye Sırası", field: "turkiyeSirasi" },
                  { label: "Kurum Sırası", field: "kurumSirasi" },
                  { label: "Sınıf Sırası", field: "sinifSirasi" },
                ] as const
              ).map((box) => (
                <div key={box.label} className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-slate-400 mb-1">{box.label}</div>
                  <input
                    type="number"
                    value={form[box.field]}
                    onChange={(e) => setForm((f) => ({ ...f, [box.field]: e.target.value }))}
                    className="w-full text-[13px] font-semibold text-center bg-transparent focus:outline-none text-slate-700"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[12px] font-medium text-slate-600 mb-2">
              Kaçırılan (Çalışılacak) Kazanımlar
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {SINAV_DERSLERI.map((ders) => (
                <div key={ders} className="border border-slate-200 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 mb-1.5">
                    <Target size={12} style={{ color: RED }} /> {ders}
                  </div>
                  <div className="space-y-1">
                    {gains
                      .filter((g) => g.ders === ders)
                      .map((g) => (
                        <div key={g.id} className="flex items-center gap-1.5">
                          <input
                            value={g.metin}
                            onChange={(e) => changeGain(g.id, e.target.value)}
                            placeholder="Kazanım..."
                            className={inputCls}
                          />
                          <button
                            type="button"
                            onClick={() => removeGain(g.id)}
                            className="text-slate-300 hover:text-red-500 shrink-0"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addGain(ders)}
                    className="flex items-center gap-1 text-[11px] mt-1.5"
                    style={{ color: RED }}
                  >
                    <Plus size={11} /> Satır ekle
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 5 */}
      <SectionCard no={5} title="Analiz Notları">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Genel Değerlendirme</label>
            <textarea
              rows={5}
              value={form.genelDegerlendirme}
              onChange={(e) =>
                setForm((f) => ({ ...f, genelDegerlendirme: e.target.value }))
              }
              className={inputCls + " resize-none"}
            />
          </div>
          <div>
            <label className={labelCls}>
              Bir Sonraki Sınav İçin Alınacak Kararlar / Öneriler
            </label>
            <textarea
              rows={5}
              value={form.kararlarOneriler}
              onChange={(e) => setForm((f) => ({ ...f, kararlarOneriler: e.target.value }))}
              className={inputCls + " resize-none"}
            />
          </div>
        </div>
      </SectionCard>

      {/* Section 6 */}
      <SectionCard no={6} title="İmzalar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-lg p-3">
            <div className="text-[12px] font-medium text-slate-600 mb-2">Öğrenci Onayı</div>
            {ogrenciOnay ? (
              <div className="flex items-center gap-1.5 text-[12px] text-green-600">
                <CheckCircle2 size={14} /> {confirm?.ogrenciAdi ?? student.name} ·{" "}
                {formatDateTime(ogrenciOnay)}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">
                Öğrenci henüz onaylamadı — kendi panelinden onaylayacak.
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-lg p-3">
            <div className="text-[12px] font-medium text-slate-600 mb-2">
              Rehber Öğretmen Onayı
            </div>
            {rehberOnay ? (
              <div className="flex items-center gap-1.5 text-[12px] text-green-600">
                <CheckCircle2 size={14} /> {confirm?.rehberAdi ?? "Rehber Öğretmen"} ·{" "}
                {formatDateTime(rehberOnay)}
              </div>
            ) : currentExamId ? (
              <button
                type="button"
                onClick={handleRehberOnay}
                disabled={confirmPending}
                className="text-white text-[12px] font-medium px-3 py-1.5 rounded-lg disabled:opacity-60"
                style={{ background: RED }}
              >
                {confirmPending ? "Onaylanıyor..." : "Onayla"}
              </button>
            ) : (
              <div className="text-[11px] text-slate-400">
                Onaylamadan önce kaydı bir kez kaydedin.
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
