import React, { useState, useMemo, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Upload,
  FileText,
  Trash2,
  Plus,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Bell,
  Settings,
  Monitor,
  Backpack,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  StickyNote,
  CalendarX,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

// ---------------------------------------------------------------- sabitler
const RED = "#c1272d";
const RED_LIGHT = "#e6a4a8";
const TRACK = "#f1d9da";
const DERSLER = ["Matematik", "Türkçe", "Fizik", "Kimya", "Biyoloji", "Tarih", "İngilizce"];
const SUBELER = ["5A", "5B", "5C", "6A", "6B"];
const AVATAR_COLORS = [
  "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-400",
  "bg-teal-400", "bg-sky-400", "bg-indigo-400", "bg-violet-400", "bg-pink-400",
];
const NAME_POOL = [
  "Elif Kaya", "Burak Demir", "Zeynep Çelik", "Sinan Demir", "Ege Yıldız",
  "Zeynep Kurt", "Mert Aydın", "Deniz Şahin", "Ali Öztürk", "Ayşe Arslan",
  "Cem Yılmaz", "Selin Koç", "Kaan Aksoy", "Buse Er", "Emir Kılıç", "Nil Aktaş",
];

let uid = 1000;
const nextId = () => uid++;

function makeStudents(sube, subeIndex) {
  const baseNo = 120 + subeIndex * 20;
  return Array.from({ length: 8 }, (_, i) => {
    const name = NAME_POOL[(subeIndex * 8 + i) % NAME_POOL.length];
    return {
      id: `${sube}-${i}`,
      name,
      no: baseNo + i,
      sube,
      veli: "Ayşe " + name.split(" ")[1],
      telefon: "0555 " + (100 + i) + " " + (20 + subeIndex) + " " + (10 + i),
      adres: "Örnek Mah. Çınar Sok. No:" + (i + 1) + ", İstanbul",
    };
  });
}

const ROSTER = SUBELER.reduce((acc, s, i) => {
  acc[s] = makeStudents(s, i);
  return acc;
}, {});

function defaultExamData() {
  return {
    dosyaAdi: null,
    dersler: [
      { id: nextId(), ders: "Matematik", dakika: 120 },
      { id: nextId(), ders: "Türkçe", dakika: 90 },
    ],
    konuYanlis: [{ id: nextId(), label: "Matematik", count: 3 }],
    konuToplamSoru: 60,
    tipYanlis: [{ id: nextId(), label: "Soru Tipi 1", count: 5 }],
    tipToplamSoru: 100,
    puanlar: [
      { id: nextId(), ay: "Ocak", puan: 20 },
      { id: nextId(), ay: "Şubat", puan: 28 },
    ],
  };
}

function seedElifData() {
  return {
    dosyaAdi: "Sinav_Sonuc_Mayis.pdf",
    dersler: [
      { id: nextId(), ders: "Matematik", dakika: 120 },
      { id: nextId(), ders: "Türkçe", dakika: 90 },
      { id: nextId(), ders: "Fizik", dakika: 90 },
      { id: nextId(), ders: "Kimya", dakika: 90 },
    ],
    konuYanlis: [
      { id: nextId(), label: "Matematik", count: 4 },
      { id: nextId(), label: "Türkçe", count: 3 },
      { id: nextId(), label: "Matematik Modüller", count: 2 },
      { id: nextId(), label: "Kimya", count: 1 },
    ],
    konuToplamSoru: 60,
    tipYanlis: [
      { id: nextId(), label: "Soru Tipi 2", count: 17 },
      { id: nextId(), label: "Soru Tipi 3", count: 27 },
      { id: nextId(), label: "Soru Yanlış 1", count: 5 },
    ],
    tipToplamSoru: 200,
    puanlar: [
      { id: nextId(), ay: "Ocak", puan: 19 },
      { id: nextId(), ay: "Şubat", puan: 46 },
      { id: nextId(), ay: "Mart", puan: 33 },
      { id: nextId(), ay: "Nisan", puan: 37 },
      { id: nextId(), ay: "Mayıs", puan: 48 },
    ],
  };
}

function Avatar({ name, size = 40 }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const idx = name.length % AVATAR_COLORS.length;
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${AVATAR_COLORS[idx]}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials}
    </div>
  );
}

// ============================================================== LOGIN
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [notice, setNotice] = useState("");

  const roles = [
    { key: "ogretmen", label: "ÖĞRETMEN GİRİŞİ", icon: Monitor },
    { key: "ogrenci", label: "ÖĞRENCİ GİRİŞİ", icon: Backpack },
    { key: "veli", label: "VELİ GİRİŞİ", icon: Users },
  ];

  const submit = (e) => {
    e.preventDefault();
    if (role === "ogretmen") {
      onLogin();
    } else {
      setNotice("Bu demo sürümünde yalnızca Öğretmen paneli aktiftir.");
    }
  };

  return (
    <div className="min-h-screen bg-[#eef1f5] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-3"
            style={{ background: RED }}
          >
            <BookOpen size={26} />
          </div>
          <div className="text-[13px] font-bold tracking-wide">BİRİKİM</div>
          <div className="text-[9px] text-slate-400 tracking-widest -mt-0.5">OKULLARI</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h1 className="text-center text-xl font-bold text-slate-800">BİRİKİM KUTUSU</h1>
          <p className="text-center text-[12px] text-slate-400 mb-5">Eğitim Yönetim Sistemi</p>

          <div className="space-y-2.5">
            {roles.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setRole(key);
                  setNotice("");
                }}
                className={
                  "w-full flex items-center justify-center gap-2 text-white text-[13px] font-semibold py-3 rounded-xl transition-transform " +
                  (role === key ? "scale-[0.98]" : "hover:opacity-90")
                }
                style={{ background: role === key ? "#8f1418" : RED }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {role && (
            <form onSubmit={submit} className="mt-5 space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <Mail size={14} className="text-slate-400" />
                <input
                  required
                  type="email"
                  placeholder="E-posta"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 text-[13px] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <Lock size={14} className="text-slate-400" />
                <input
                  required
                  type={showPw ? "text" : "password"}
                  placeholder="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 text-[13px] focus:outline-none"
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="text-slate-400">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {notice && <div className="text-[12px] text-amber-600 text-center">{notice}</div>}
              <button
                type="submit"
                className="w-full text-white text-[13px] font-semibold py-2.5 rounded-xl"
                style={{ background: RED }}
              >
                Giriş Yap
              </button>
            </form>
          )}

          <div className="flex items-center justify-center gap-4 mt-4 text-[12px]" style={{ color: RED }}>
            <button type="button" className="hover:underline">Şifremi Unuttum?</button>
            <span className="text-slate-300">|</span>
            <button type="button" className="hover:underline">Kayıt Ol</button>
          </div>
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-5">
          © 2024 Birikim Okulları - Tüm Hakları Saklıdır.
        </p>
      </div>
    </div>
  );
}

// ============================================================== DONUT (deneme analizi içinde)
function Donut({ title, data, totalSoru, onTotalChange, onAdd, onRemove, onChange }) {
  const totalYanlis = data.reduce((s, d) => s + Number(d.count || 0), 0);
  const percent = totalSoru > 0 ? Math.round((totalYanlis / totalSoru) * 100) : 0;
  const chartData = data.length ? data : [{ id: "empty", label: "-", count: 1 }];
  const colors = [RED, "#d9585d", "#e58c8f", "#efb7b9", "#f6dadb", "#8a1b20"];

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
              >
                {chartData.map((entry, i) => (
                  <Cell key={entry.id} fill={data.length ? colors[i % colors.length] : TRACK} />
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
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
              <input
                value={row.label}
                onChange={(e) => onChange(row.id, "label", e.target.value)}
                className="flex-1 min-w-0 text-[12px] text-slate-600 bg-transparent border-b border-transparent hover:border-slate-200 focus:outline-none truncate"
              />
              <input
                type="number"
                min={0}
                value={row.count}
                onChange={(e) => onChange(row.id, "count", Number(e.target.value))}
                className="w-10 text-[12px] text-right text-slate-700 font-medium bg-transparent border-b border-transparent hover:border-slate-200 focus:outline-none"
              />
              <button onClick={() => onRemove(row.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500">
                <X size={12} />
              </button>
            </div>
          ))}
          <button onClick={onAdd} className="flex items-center gap-1 text-[11px] mt-1" style={{ color: RED }}>
            <Plus size={11} /> Yanlış ekle
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 pl-1">
        <span className="text-[11px] text-slate-400">Toplam soru sayısı</span>
        <input
          type="number"
          min={1}
          value={totalSoru}
          onChange={(e) => onTotalChange(Number(e.target.value))}
          className="w-12 text-[11px] text-slate-600 border-b border-slate-200 focus:outline-none bg-transparent"
        />
      </div>
    </div>
  );
}

// ============================================================== DENEME ANALİZİ (öğrenci bazlı)
function DenemeAnalizi({ student, data, update }) {
  const fileInputRef = useRef(null);
  const [surukleniyor, setSurukleniyor] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const ortalama = useMemo(() => {
    if (!data.puanlar.length) return 0;
    return Math.round(data.puanlar.reduce((s, p) => s + Number(p.puan || 0), 0) / data.puanlar.length);
  }, [data.puanlar]);
  const trend = useMemo(() => {
    if (data.puanlar.length < 2) return 0;
    return Number(data.puanlar[data.puanlar.length - 1].puan) - Number(data.puanlar[0].puan);
  }, [data.puanlar]);

  const addDers = () => update((d) => ({ ...d, dersler: [...d.dersler, { id: nextId(), ders: DERSLER[0], dakika: 60 }] }));
  const removeDers = (id) => update((d) => ({ ...d, dersler: d.dersler.filter((r) => r.id !== id) }));
  const changeDers = (id, field, value) =>
    update((d) => ({ ...d, dersler: d.dersler.map((r) => (r.id === id ? { ...r, [field]: value } : r)) }));

  const makeArrHandlers = (field) => ({
    onAdd: () => update((d) => ({ ...d, [field]: [...d[field], { id: nextId(), label: "Yeni konu", count: 1 }] })),
    onRemove: (id) => update((d) => ({ ...d, [field]: d[field].filter((r) => r.id !== id) })),
    onChange: (id, f, value) =>
      update((d) => ({ ...d, [field]: d[field].map((r) => (r.id === id ? { ...r, [f]: value } : r)) })),
  });

  const addPuan = () => update((d) => ({ ...d, puanlar: [...d.puanlar, { id: nextId(), ay: "Yeni Ay", puan: 0 }] }));
  const removePuan = (id) => update((d) => ({ ...d, puanlar: d.puanlar.filter((r) => r.id !== id) }));
  const changePuan = (id, field, value) =>
    update((d) => ({ ...d, puanlar: d.puanlar.map((r) => (r.id === id ? { ...r, [field]: value } : r)) }));

  const handleFiles = (files) => {
    if (files && files[0]) update((d) => ({ ...d, dosyaAdi: files[0].name }));
  };
  const handleSave = () => {
    setSavedMsg("Kaydedildi ✓");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} size={36} />
          <div>
            <div className="text-[13px] font-semibold">{student.name}</div>
            <div className="text-[11px] text-slate-400">{student.sube} · No: {student.no}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-[12px] text-green-600 font-medium">{savedMsg}</span>}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:opacity-90"
            style={{ background: RED }}
          >
            <Save size={14} /> Kaydet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3">Sınav Sonuçları PDF Yükleme Alanı</div>
          <div
            onDragOver={(e) => { e.preventDefault(); setSurukleniyor(true); }}
            onDragLeave={() => setSurukleniyor(false)}
            onDrop={(e) => { e.preventDefault(); setSurukleniyor(false); handleFiles(e.dataTransfer.files); }}
            className={"border-2 border-dashed rounded-lg py-8 flex flex-col items-center justify-center text-center " + (surukleniyor ? "bg-red-50" : "bg-slate-50")}
            style={{ borderColor: surukleniyor ? RED : "#e2b6b8" }}
          >
            <Upload size={26} style={{ color: RED }} className="mb-2" />
            <div className="text-[13px] text-slate-500">Sınav Sonuç PDF'ini buraya sürükleyin</div>
            <div className="text-[11px] text-slate-400 mb-3">veya</div>
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <button onClick={() => fileInputRef.current.click()} className="text-white text-[12px] font-medium px-4 py-2 rounded-lg" style={{ background: RED }}>
              Dosya Seç
            </button>
          </div>
          {data.dosyaAdi && (
            <div className="flex items-center justify-between mt-3 bg-slate-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-[12px] text-slate-600 truncate">
                <FileText size={14} style={{ color: RED }} /> {data.dosyaAdi}
              </div>
              <button onClick={() => update((d) => ({ ...d, dosyaAdi: null }))} className="text-slate-300 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3">Sınav Çözüm Sırası ve Süre Bilgileri</div>
          <div className="space-y-2">
            {data.dersler.map((row, i) => (
              <div key={row.id} className="flex items-center gap-2 group">
                <span className="text-[12px] text-slate-400 w-4">{i + 1}.</span>
                <span className="text-[12px] text-slate-500 w-10 shrink-0">Ders:</span>
                <select
                  value={row.ders}
                  onChange={(e) => changeDers(row.id, "ders", e.target.value)}
                  className="flex-1 text-[12px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none bg-white"
                >
                  {DERSLER.map((d) => <option key={d}>{d}</option>)}
                </select>
                <input
                  type="number"
                  min={0}
                  value={row.dakika}
                  onChange={(e) => changeDers(row.id, "dakika", Number(e.target.value))}
                  className="w-16 text-[12px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none text-right"
                />
                <span className="text-[11px] text-slate-400 w-9">Dakika</span>
                <button onClick={() => removeDers(row.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 shrink-0">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addDers} className="flex items-center gap-1 text-[12px] mt-3" style={{ color: RED }}>
            <Plus size={13} /> Ders ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-semibold text-slate-700 mb-3">Sınav Yanlış Analizi</div>
          <div className="flex flex-wrap gap-6">
            <Donut
              title="Konu Bazlı Yanlışlar"
              data={data.konuYanlis}
              totalSoru={data.konuToplamSoru}
              onTotalChange={(v) => update((d) => ({ ...d, konuToplamSoru: v }))}
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
            <div className="text-[13px] font-semibold text-slate-700">Sınav Puan Gelişimi Grafiği</div>
            <div className="text-[11px] text-slate-400">
              Ortalama <span className="font-semibold text-slate-600">{ortalama}</span>
              {"  ·  "}
              <span className={trend >= 0 ? "text-green-600" : "text-red-500"}>{trend >= 0 ? "+" : ""}{trend}</span>
            </div>
          </div>
          <div className="h-[180px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.puanlar} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1f1f1" vertical={false} />
                <XAxis dataKey="ay" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e5e7eb" }} />
                <Line type="monotone" dataKey="puan" stroke={RED} strokeWidth={2.5} dot={{ r: 4, fill: RED }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.puanlar.map((p) => (
              <div key={p.id} className="flex items-center gap-1 bg-slate-50 rounded-full pl-2.5 pr-1 py-1 group">
                <input value={p.ay} onChange={(e) => changePuan(p.id, "ay", e.target.value)} className="w-14 text-[11px] bg-transparent focus:outline-none text-slate-600" />
                <input type="number" value={p.puan} onChange={(e) => changePuan(p.id, "puan", Number(e.target.value))} className="w-10 text-[11px] bg-transparent focus:outline-none text-slate-700 font-medium text-right" />
                <button onClick={() => removePuan(p.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500">
                  <X size={11} />
                </button>
              </div>
            ))}
            <button onClick={addPuan} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-dashed" style={{ color: RED, borderColor: RED_LIGHT }}>
              <Plus size={11} /> Sınav ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================== ÖĞRENCİ DETAY PANELİ (kitap / devamsızlık / not)
function StudentDetailPanel({ student, onClose, books, absences, notes, onAddBook, onToggleBook, onRemoveBook, onAddAbsence, onRemoveAbsence, onAddNote }) {
  const [openForm, setOpenForm] = useState(null); // 'devam' | 'not' | 'kitap' | null
  const [bookName, setBookName] = useState("");
  const [bookStatus, setBookStatus] = useState("Okunuyor");
  const [absenceDate, setAbsenceDate] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");
  const [noteText, setNoteText] = useState("");

  const toggle = (key) => setOpenForm((cur) => (cur === key ? null : key));

  return (
    <div className="w-[300px] shrink-0 bg-white rounded-xl border border-slate-200 p-4 h-fit sticky top-4">
      <div className="flex justify-end">
        <button onClick={onClose} className="text-slate-300 hover:text-red-500"><X size={16} /></button>
      </div>
      <div className="flex flex-col items-center -mt-2">
        <Avatar name={student.name} size={64} />
        <div className="text-[14px] font-semibold mt-2">{student.name}</div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-4">
        <button onClick={() => toggle("devam")} className="text-[10px] leading-tight text-white rounded-lg py-2 px-1" style={{ background: openForm === "devam" ? "#8f1418" : RED }}>
          Devamsızlık Kaydet
        </button>
        <button onClick={() => toggle("not")} className="text-[10px] leading-tight text-white rounded-lg py-2 px-1" style={{ background: openForm === "not" ? "#8f1418" : RED }}>
          Not Gir
        </button>
        <button onClick={() => toggle("kitap")} className="text-[10px] leading-tight text-white rounded-lg py-2 px-1" style={{ background: openForm === "kitap" ? "#8f1418" : RED }}>
          Kitap Ekle
        </button>
      </div>

      {openForm === "devam" && (
        <div className="mt-3 space-y-2 bg-slate-50 rounded-lg p-3">
          <input type="date" value={absenceDate} onChange={(e) => setAbsenceDate(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none" />
          <input placeholder="Sebep" value={absenceReason} onChange={(e) => setAbsenceReason(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none" />
          <button
            onClick={() => {
              if (!absenceDate) return;
              onAddAbsence({ id: nextId(), date: absenceDate, reason: absenceReason || "Belirtilmedi" });
              setAbsenceDate(""); setAbsenceReason("");
            }}
            className="w-full text-[12px] text-white rounded-md py-1.5" style={{ background: RED }}
          >
            Kaydet
          </button>
        </div>
      )}
      {openForm === "not" && (
        <div className="mt-3 space-y-2 bg-slate-50 rounded-lg p-3">
          <textarea placeholder="Not yazın..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none resize-none" rows={3} />
          <button
            onClick={() => { if (!noteText.trim()) return; onAddNote(noteText.trim()); setNoteText(""); }}
            className="w-full text-[12px] text-white rounded-md py-1.5" style={{ background: RED }}
          >
            Kaydet
          </button>
        </div>
      )}
      {openForm === "kitap" && (
        <div className="mt-3 space-y-2 bg-slate-50 rounded-lg p-3">
          <input placeholder="Kitap adı" value={bookName} onChange={(e) => setBookName(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none" />
          <select value={bookStatus} onChange={(e) => setBookStatus(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none">
            <option>Okunuyor</option>
            <option>Okundu</option>
            <option>Planlandı</option>
          </select>
          <button
            onClick={() => { if (!bookName.trim()) return; onAddBook({ id: nextId(), name: bookName.trim(), status: bookStatus }); setBookName(""); }}
            className="w-full text-[12px] text-white rounded-md py-1.5" style={{ background: RED }}
          >
            Ekle
          </button>
        </div>
      )}

      <div className="mt-4 space-y-1.5 text-[12px] text-slate-500">
        <div><span className="text-slate-400">Şube:</span> {student.sube}</div>
        <div><span className="text-slate-400">Veli:</span> {student.veli}</div>
        <div><span className="text-slate-400">Telefon:</span> {student.telefon}</div>
        <div><span className="text-slate-400">Adres:</span> {student.adres}</div>
      </div>

      {notes.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-1"><StickyNote size={12} /> Notlar</div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {notes.map((n, i) => <div key={i} className="text-[11px] text-slate-500 bg-slate-50 rounded-md px-2 py-1">{n}</div>)}
          </div>
        </div>
      )}
      {absences.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-1"><CalendarX size={12} /> Devamsızlıklar ({absences.length})</div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {absences.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 rounded-md px-2 py-1">
                <span>{a.date} · {a.reason}</span>
                <button onClick={() => onRemoveAbsence(a.id)} className="text-slate-300 hover:text-red-500"><X size={11} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      {books.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-1"><BookOpen size={12} /> Kitaplar</div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {books.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 rounded-md px-2 py-1">
                <span className="truncate">{b.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <select value={b.status} onChange={(e) => onToggleBook(b.id, e.target.value)} className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-white">
                    <option>Okunuyor</option><option>Okundu</option><option>Planlandı</option>
                  </select>
                  <button onClick={() => onRemoveBook(b.id)} className="text-slate-300 hover:text-red-500"><X size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================== ÖĞRETMEN PANELİ
function TeacherPanel({ onLogout }) {
  const [activeSube, setActiveSube] = useState("5A");
  const [activeTab, setActiveTab] = useState("kitap"); // kitap | devam | deneme
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [oviOpen, setOviOpen] = useState(true);

  const [examData, setExamData] = useState({ "5A-0": seedElifData() });
  const [booksByStudent, setBooksByStudent] = useState({});
  const [absencesByStudent, setAbsencesByStudent] = useState({});
  const [notesByStudent, setNotesByStudent] = useState({});

  const students = ROSTER[activeSube];
  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  const examFor = (id) => examData[id] || defaultExamData();
  const updateExam = (id, fn) => setExamData((prev) => ({ ...prev, [id]: fn(prev[id] || defaultExamData()) }));

  const tabs = [
    { key: "kitap", label: "Kitap Takibi", icon: BookOpen },
    { key: "devam", label: "Devamsızlık", icon: CalendarX },
    { key: "deneme", label: "Deneme Analizi", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-[#eef1f5] flex">
      {/* SIDEBAR */}
      <div className="w-56 bg-white border-r border-slate-200 shrink-0 min-h-screen">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: RED }}>
            <BookOpen size={16} />
          </div>
          <div>
            <div className="text-[11px] font-bold leading-none">BİRİKİM</div>
            <div className="text-[13px] font-bold leading-tight">Kutusu</div>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="text-[10px] font-semibold text-slate-400 tracking-wider mb-2">PANELİM</div>
          <button
            onClick={() => { setActiveTab("kitap"); setSelectedStudentId(null); }}
            className="w-full flex items-center gap-2 text-[13px] text-slate-600 py-1.5 px-2 rounded-lg hover:bg-slate-50"
          >
            <LayoutDashboard size={14} /> Kontrol Paneli
          </button>
          <button onClick={() => setOviOpen((o) => !o)} className="w-full flex items-center justify-between text-[13px] text-slate-600 py-1.5 px-2 rounded-lg hover:bg-slate-50">
            <span className="flex items-center gap-2"><Users size={14} /> Ö-V-İ</span>
            {oviOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          {oviOpen && (
            <div className="ml-6 space-y-1 mt-1">
              {["Öğrenciler", "Veliler", "İletişim"].map((x) => (
                <div key={x} className="text-[12px] text-slate-400 py-1 px-2 rounded-md hover:bg-slate-50 cursor-default">{x}</div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-100">
          <div className="text-[10px] font-semibold text-slate-400 tracking-wider mb-2">ŞUBELER</div>
          <div className="space-y-1">
            {SUBELER.map((s) => (
              <button
                key={s}
                onClick={() => { setActiveSube(s); setSelectedStudentId(null); }}
                className={"w-full flex items-center gap-2 text-[13px] py-1.5 px-2 rounded-lg " + (activeSube === s ? "text-white font-semibold" : "text-slate-600 hover:bg-slate-50")}
                style={activeSube === s ? { background: RED } : {}}
              >
                <Users size={14} /> {s}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-100 mt-2">
          <button onClick={onLogout} className="w-full flex items-center gap-2 text-[13px] text-slate-400 py-1.5 px-2 rounded-lg hover:bg-slate-50 hover:text-red-500">
            <LogOut size={14} /> Çıkış Yap
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 min-w-0">
        {/* top bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-[15px] font-bold text-slate-700">Birikim Kutusu</div>
          <div className="flex items-center gap-4 text-slate-400">
            <Bell size={17} />
            <Settings size={17} />
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold" style={{ background: RED }}>
                AY
              </div>
              <span className="text-[13px] text-slate-600 font-medium">Ayşe Yılmaz</span>
            </div>
          </div>
        </div>

        {/* tabs */}
        <div className="bg-white border-b border-slate-200 px-6 flex gap-6 text-[13px]">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={"flex items-center gap-1.5 py-3 border-b-2 " + (activeTab === key ? "font-semibold" : "border-transparent text-slate-400")}
              style={activeTab === key ? { borderColor: RED, color: RED } : {}}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="max-w-6xl mx-auto p-6">
          {activeTab === "deneme" ? (
            selectedStudent ? (
              <div>
                <button onClick={() => setSelectedStudentId(null)} className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-700 mb-3">
                  <ArrowLeft size={13} /> Öğrenci listesine dön
                </button>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id)}
                      className={"flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border shrink-0 " + (s.id === selectedStudentId ? "border-transparent text-white" : "border-slate-200 text-slate-600")}
                      style={s.id === selectedStudentId ? { background: RED } : {}}
                    >
                      <Avatar name={s.name} size={22} />
                      <span className="text-[12px]">{s.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
                <DenemeAnalizi
                  student={selectedStudent}
                  data={examFor(selectedStudent.id)}
                  update={(fn) => updateExam(selectedStudent.id, fn)}
                />
              </div>
            ) : (
              <>
                <div className="text-[15px] font-semibold text-slate-700 mb-4">{activeSube} Şubesi Öğrenci Listesi</div>
                <StudentGrid students={students} onSelect={setSelectedStudentId} />
              </>
            )
          ) : (
            <>
              <div className="text-[15px] font-semibold text-slate-700 mb-4">{activeSube} Şubesi Öğrenci Listesi</div>
              <div className="flex gap-5">
                <div className="flex-1 min-w-0">
                  <StudentGrid students={students} selectedId={selectedStudentId} onSelect={setSelectedStudentId} />
                </div>
                {selectedStudent && (
                  <StudentDetailPanel
                    student={selectedStudent}
                    onClose={() => setSelectedStudentId(null)}
                    books={booksByStudent[selectedStudent.id] || []}
                    absences={absencesByStudent[selectedStudent.id] || []}
                    notes={notesByStudent[selectedStudent.id] || []}
                    onAddBook={(b) => setBooksByStudent((p) => ({ ...p, [selectedStudent.id]: [...(p[selectedStudent.id] || []), b] }))}
                    onToggleBook={(id, status) => setBooksByStudent((p) => ({ ...p, [selectedStudent.id]: (p[selectedStudent.id] || []).map((b) => (b.id === id ? { ...b, status } : b)) }))}
                    onRemoveBook={(id) => setBooksByStudent((p) => ({ ...p, [selectedStudent.id]: (p[selectedStudent.id] || []).filter((b) => b.id !== id) }))}
                    onAddAbsence={(a) => setAbsencesByStudent((p) => ({ ...p, [selectedStudent.id]: [...(p[selectedStudent.id] || []), a] }))}
                    onRemoveAbsence={(id) => setAbsencesByStudent((p) => ({ ...p, [selectedStudent.id]: (p[selectedStudent.id] || []).filter((a) => a.id !== id) }))}
                    onAddNote={(n) => setNotesByStudent((p) => ({ ...p, [selectedStudent.id]: [...(p[selectedStudent.id] || []), n] }))}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentGrid({ students, selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {students.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={"bg-white rounded-xl border p-3 flex flex-col items-center gap-2 hover:shadow-sm transition-shadow " + (s.id === selectedId ? "" : "border-slate-200")}
          style={s.id === selectedId ? { borderColor: RED, boxShadow: `0 0 0 1px ${RED}` } : {}}
        >
          <Avatar name={s.name} size={52} />
          <div className="text-[12px] font-semibold text-slate-700 text-center leading-tight">{s.name}</div>
          <div className="text-[11px] text-slate-400">No: {s.no}</div>
        </button>
      ))}
    </div>
  );
}

// ============================================================== ROOT
export default function BirikimKutusu() {
  const [loggedIn, setLoggedIn] = useState(false);
  return loggedIn ? (
    <TeacherPanel onLogout={() => setLoggedIn(false)} />
  ) : (
    <LoginScreen onLogin={() => setLoggedIn(true)} />
  );
}
