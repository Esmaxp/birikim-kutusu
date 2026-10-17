
import { parseUploadUrl } from "@/lib/upload-url";
import { notFound } from "next/navigation";

import { assertCanAccessStudent, requireUser } from "@/lib/auth";
import { getExamSession } from "@/lib/exam-session";
import { HATA_TURLERI, RED, SINAV_DERSLERI, formatDate, formatDateTime } from "@/lib/constants";
import PrintControls from "@/components/PrintControls";

type Props = {
  params: Promise<{ studentId: string; examId: string }>;
  searchParams: Promise<{ auto?: string }>;
};

/** Yazdırmada dolu/boş kare — native checkbox kullanılmaz. */
function Sq({ checked }: { checked: boolean }) {
  return (
    <span
      className="inline-block align-middle mr-1 shrink-0"
      style={{
        width: "2.6mm",
        height: "2.6mm",
        border: "0.3mm solid #334155",
        background: checked ? "#334155" : "transparent",
      }}
    />
  );
}

function SectionHeader({ no, title, color }: { no: number; title: string; color: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-t-[1.5mm]"
      style={{ background: color }}
    >
      <span
        className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
        style={{ width: "4mm", height: "4mm", fontSize: "6.5pt", background: "rgba(0,0,0,0.35)" }}
      >
        {no}
      </span>
      <span className="text-white font-semibold" style={{ fontSize: "8pt" }}>
        {title}
      </span>
    </div>
  );
}

const SECTION_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#3b82f6", "#8b5cf6", "#475569"];

export default async function ExamSessionPrintPage({ params, searchParams }: Props) {
  const user = await requireUser(["TEACHER"]);
  const { studentId, examId } = await params;
  await assertCanAccessStudent(user, studentId);
  const sp = await searchParams;

  const exam = await getExamSession(examId);
  if (!exam || exam.studentId !== studentId) notFound();

  const hataTurleriLabels = HATA_TURLERI.filter((h) => exam.hataTurleri.includes(h.key)).map(
    (h) => h.label
  );

  const gainsByDers = new Map<string, string[]>();
  for (const g of exam.gains) {
    const arr = gainsByDers.get(g.ders) ?? [];
    arr.push(g.metin);
    gainsByDers.set(g.ders, arr);
  }

  const toplamDogru = exam.subjects.reduce((s, r) => s + r.dogru, 0);
  const toplamYanlis = exam.subjects.reduce((s, r) => s + r.yanlis, 0);
  const toplamBos = exam.subjects.reduce((s, r) => s + r.bos, 0);

  const cellStyle: React.CSSProperties = { fontSize: "7pt", padding: "0.8mm 1mm" };
  const thStyle: React.CSSProperties = {
    ...cellStyle,
    fontSize: "6.3pt",
    color: "#64748b",
    fontWeight: 500,
    textAlign: "left",
  };

  return (
    <div className="bg-[#eef1f5] print:bg-white py-4">
      <PrintControls auto={sp.auto === "1"} />

      <div
        className="print-sheet bg-white mx-auto border border-slate-200 print:border-0"
        style={{ width: "210mm", maxWidth: "100%", padding: "6mm", fontFamily: "Arial, sans-serif" }}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between border-b-2 pb-2 mb-2" style={{ borderColor: RED }}>
          <div>
            <div className="font-bold" style={{ fontSize: "11pt", color: RED }}>
              BİRİKİM OKULLARI
            </div>
            <div className="font-semibold text-slate-700" style={{ fontSize: "9pt" }}>
              SINAV ANALİZ VE REHBERLİK GÖRÜŞME FORMU
            </div>
          </div>
          <div className="flex items-center gap-2">
            {parseUploadUrl(exam.student.photoUrl, "image") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={parseUploadUrl(exam.student.photoUrl, "image") ?? undefined}
                alt={exam.student.name}
                style={{ width: "16mm", height: "16mm" }}
                className="rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div
                className="rounded-full flex items-center justify-center text-white font-semibold"
                style={{ width: "16mm", height: "16mm", background: RED, fontSize: "8pt" }}
              >
                {exam.student.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            )}
            <div style={{ fontSize: "7.5pt" }} className="text-slate-600 text-right">
              <div className="font-semibold" style={{ fontSize: "9pt" }}>
                {exam.student.name}
              </div>
              <div>
                {exam.student.className} · No: {exam.student.no}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1 */}
        <div className="border border-slate-200 rounded-[1.5mm] overflow-hidden mb-1.5">
          <SectionHeader no={1} title="Sınav Bilgileri" color={SECTION_COLORS[0]} />
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={thStyle}>Sınav Adı</td>
                <td style={{ ...cellStyle, fontWeight: 600 }}>{exam.sinavAdi}</td>
                <td style={thStyle}>Sınav Tarihi</td>
                <td style={cellStyle}>{formatDate(exam.sinavTarihi)}</td>
                <td style={thStyle}>Sınav Saati</td>
                <td style={cellStyle}>{exam.sinavSaati ?? "-"}</td>
              </tr>
              <tr>
                <td style={thStyle}>Görüşme Tarihi</td>
                <td style={cellStyle}>
                  {exam.gorusmeTarihi ? formatDate(exam.gorusmeTarihi) : "-"}
                </td>
                <td style={thStyle}>Danışman</td>
                <td style={cellStyle} colSpan={3}>
                  {exam.danismanAdi ?? "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2 */}
        <div className="border border-slate-200 rounded-[1.5mm] overflow-hidden mb-1.5">
          <SectionHeader no={2} title="Sınav Yönetimi (Zaman ve Çözüm Stratejisi)" color={SECTION_COLORS[1]} />
          <div style={{ padding: "1mm 2mm" }}>
            <span style={{ ...thStyle, padding: 0 }}>
              Toplam Çözüm Süresi: <b style={{ color: "#1e293b" }}>{exam.toplamCozumSuresi ?? "-"} dk</b>
            </span>
          </div>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderTop: "0.2mm solid #e2e8f0" }}>
                <th style={thStyle}></th>
                {SINAV_DERSLERI.map((d) => (
                  <th key={d} style={{ ...thStyle, textAlign: "center" }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: "0.2mm solid #e2e8f0" }}>
                <td style={thStyle}>Süre (dk)</td>
                {exam.subjects.map((s) => (
                  <td key={s.ders} style={{ ...cellStyle, textAlign: "center" }}>
                    {s.cozumSuresi ?? "-"}
                  </td>
                ))}
              </tr>
              <tr style={{ borderTop: "0.2mm solid #e2e8f0" }}>
                <td style={thStyle}>Sıra</td>
                {exam.subjects.map((s) => (
                  <td key={s.ders} style={{ ...cellStyle, textAlign: "center" }}>
                    {s.cozumSirasi ?? "-"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3 */}
        <div className="border border-slate-200 rounded-[1.5mm] overflow-hidden mb-1.5">
          <SectionHeader no={3} title="Sınav Süreci Değerlendirmesi" color={SECTION_COLORS[2]} />
          <div className="grid grid-cols-3 gap-1" style={{ padding: "1.2mm" }}>
            <div className="border border-slate-100 rounded-[1mm]" style={{ padding: "1mm" }}>
              <div style={{ fontSize: "6.8pt", fontWeight: 600 }} className="text-slate-600 mb-0.5">
                İçsel (Ruhsal) Problem
              </div>
              <div style={{ fontSize: "7pt" }} className="mb-0.5">
                <Sq checked={!exam.icselProblem} /> Hayır &nbsp;&nbsp;
                <Sq checked={exam.icselProblem} /> Evet
              </div>
              {exam.icselProblem && (
                <div
                  style={{
                    fontSize: "6.5pt",
                    maxHeight: "14mm",
                    overflow: "hidden",
                    wordBreak: "break-word",
                  }}
                  className="text-slate-500"
                >
                  {exam.icselAciklama}
                </div>
              )}
            </div>

            <div className="border border-slate-100 rounded-[1mm]" style={{ padding: "1mm" }}>
              <div style={{ fontSize: "6.8pt", fontWeight: 600 }} className="text-slate-600 mb-0.5">
                Dışsal Problem
              </div>
              <div style={{ fontSize: "7pt" }} className="mb-0.5">
                <Sq checked={!exam.dissalProblem} /> Hayır &nbsp;&nbsp;
                <Sq checked={exam.dissalProblem} /> Evet
              </div>
              {exam.dissalProblem && (
                <div
                  style={{
                    fontSize: "6.5pt",
                    maxHeight: "14mm",
                    overflow: "hidden",
                    wordBreak: "break-word",
                  }}
                  className="text-slate-500"
                >
                  {exam.dissalAciklama}
                </div>
              )}
            </div>

            <div className="border border-slate-100 rounded-[1mm]" style={{ padding: "1mm" }}>
              <div style={{ fontSize: "6.8pt", fontWeight: 600 }} className="text-slate-600 mb-0.5">
                Sınav Esnasında Hata
              </div>
              <div style={{ fontSize: "7pt" }} className="mb-0.5">
                <Sq checked={!exam.hataYapildi} /> Hayır &nbsp;&nbsp;
                <Sq checked={exam.hataYapildi} /> Evet
              </div>
              {exam.hataYapildi && (
                <div style={{ fontSize: "6.3pt" }} className="text-slate-500 leading-tight">
                  {hataTurleriLabels.join(", ") || "-"}
                  {exam.hataDigerAciklama ? ` (${exam.hataDigerAciklama})` : ""}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="border border-slate-200 rounded-[1.5mm] overflow-hidden mb-1.5">
          <SectionHeader no={4} title="Sınav Sonuç Analizi (Netler)" color={SECTION_COLORS[3]} />
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}></th>
                {SINAV_DERSLERI.map((d) => (
                  <th key={d} style={{ ...thStyle, textAlign: "center" }}>
                    {d}
                  </th>
                ))}
                <th style={{ ...thStyle, textAlign: "center", fontWeight: 700 }}>TOPLAM</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: "0.2mm solid #e2e8f0" }}>
                <td style={thStyle}>Doğru</td>
                {exam.subjects.map((s) => (
                  <td key={s.ders} style={{ ...cellStyle, textAlign: "center" }}>
                    {s.dogru}
                  </td>
                ))}
                <td style={{ ...cellStyle, textAlign: "center", fontWeight: 700 }}>{toplamDogru}</td>
              </tr>
              <tr style={{ borderTop: "0.2mm solid #e2e8f0" }}>
                <td style={thStyle}>Yanlış</td>
                {exam.subjects.map((s) => (
                  <td key={s.ders} style={{ ...cellStyle, textAlign: "center" }}>
                    {s.yanlis}
                  </td>
                ))}
                <td style={{ ...cellStyle, textAlign: "center", fontWeight: 700 }}>{toplamYanlis}</td>
              </tr>
              <tr style={{ borderTop: "0.2mm solid #e2e8f0" }}>
                <td style={thStyle}>Boş</td>
                {exam.subjects.map((s) => (
                  <td key={s.ders} style={{ ...cellStyle, textAlign: "center" }}>
                    {s.bos}
                  </td>
                ))}
                <td style={{ ...cellStyle, textAlign: "center", fontWeight: 700 }}>{toplamBos}</td>
              </tr>
              <tr style={{ borderTop: "0.2mm solid #e2e8f0" }}>
                <td style={{ ...thStyle, fontWeight: 700, color: "#1e293b" }}>Net</td>
                {exam.subjects.map((s) => (
                  <td key={s.ders} style={{ ...cellStyle, textAlign: "center", fontWeight: 700 }}>
                    {s.net}
                  </td>
                ))}
                <td style={{ ...cellStyle, textAlign: "center", fontWeight: 700, color: RED }}>
                  {exam.toplamNet ?? "-"}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-6 gap-1" style={{ padding: "1.2mm" }}>
            {[
              ["Toplam Net", exam.toplamNet],
              ["Puan", exam.puan],
              ["Yüzdelik Dilim", exam.yuzdelikDilim],
              ["Türkiye Sırası", exam.turkiyeSirasi],
              ["Kurum Sırası", exam.kurumSirasi],
              ["Sınıf Sırası", exam.sinifSirasi],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="bg-slate-50 rounded-[1mm] text-center"
                style={{ padding: "1mm" }}
              >
                <div style={{ fontSize: "5.8pt" }} className="text-slate-400">
                  {label}
                </div>
                <div style={{ fontSize: "8pt", fontWeight: 700 }} className="text-slate-700">
                  {value ?? "-"}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "0 1.2mm 1.2mm" }}>
            <div style={{ fontSize: "6.8pt", fontWeight: 600 }} className="text-slate-600 mb-1">
              Kaçırılan (Çalışılacak) Kazanımlar
            </div>
            <div className="grid grid-cols-3 gap-1">
              {SINAV_DERSLERI.map((ders) => {
                const lines = (gainsByDers.get(ders) ?? []).filter((l) => l.trim().length > 0);
                return (
                  <div key={ders} className="border border-slate-100 rounded-[1mm]" style={{ padding: "1mm" }}>
                    <div style={{ fontSize: "6.5pt", fontWeight: 600 }} className="text-slate-600 mb-0.5">
                      {ders}
                    </div>
                    {lines.length === 0 ? (
                      <div style={{ fontSize: "6.3pt" }} className="text-slate-300">
                        -
                      </div>
                    ) : (
                      <ul style={{ fontSize: "6.3pt", paddingLeft: "3mm" }} className="text-slate-500">
                        {lines.slice(0, 4).map((l, i) => (
                          <li key={i} style={{ overflow: "hidden", maxHeight: "6mm" }}>
                            {l}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="border border-slate-200 rounded-[1.5mm] overflow-hidden mb-1.5">
          <SectionHeader no={5} title="Analiz Notları" color={SECTION_COLORS[4]} />
          <div className="grid grid-cols-2 gap-1" style={{ padding: "1.2mm" }}>
            <div>
              <div style={{ fontSize: "6.5pt", fontWeight: 600 }} className="text-slate-600 mb-0.5">
                Genel Değerlendirme
              </div>
              <div
                style={{ fontSize: "6.8pt", maxHeight: "20mm", overflow: "hidden", wordBreak: "break-word" }}
                className="text-slate-600 whitespace-pre-wrap"
              >
                {exam.genelDegerlendirme ?? "-"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "6.5pt", fontWeight: 600 }} className="text-slate-600 mb-0.5">
                Kararlar / Öneriler
              </div>
              <div
                style={{ fontSize: "6.8pt", maxHeight: "20mm", overflow: "hidden", wordBreak: "break-word" }}
                className="text-slate-600 whitespace-pre-wrap"
              >
                {exam.kararlarOneriler ?? "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div className="border border-slate-200 rounded-[1.5mm] overflow-hidden">
          <SectionHeader no={6} title="İmzalar" color={SECTION_COLORS[5]} />
          <div className="grid grid-cols-2 gap-2" style={{ padding: "2mm" }}>
            <div className="text-center">
              <div style={{ fontSize: "6.5pt", fontWeight: 600 }} className="text-slate-500 mb-2">
                Öğrenci Onayı
              </div>
              {exam.ogrenciOnayAt ? (
                <div style={{ fontSize: "7pt" }} className="text-slate-700">
                  {exam.student.name}
                  <br />
                  {formatDateTime(exam.ogrenciOnayAt)}
                </div>
              ) : (
                <div style={{ borderTop: "0.3mm solid #94a3b8", marginTop: "6mm", paddingTop: "0.5mm" }}>
                  <span style={{ fontSize: "6pt" }} className="text-slate-300">
                    imza / tarih
                  </span>
                </div>
              )}
            </div>
            <div className="text-center">
              <div style={{ fontSize: "6.5pt", fontWeight: 600 }} className="text-slate-500 mb-2">
                Rehber Öğretmen Onayı
              </div>
              {exam.rehberOnayAt ? (
                <div style={{ fontSize: "7pt" }} className="text-slate-700">
                  {exam.danismanAdi ?? "Rehber Öğretmen"}
                  <br />
                  {formatDateTime(exam.rehberOnayAt)}
                </div>
              ) : (
                <div style={{ borderTop: "0.3mm solid #94a3b8", marginTop: "6mm", paddingTop: "0.5mm" }}>
                  <span style={{ fontSize: "6pt" }} className="text-slate-300">
                    imza / tarih
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
