export const RED = "#c1272d";
export const RED_DARK = "#8f1418";
export const RED_LIGHT = "#e6a4a8";
export const TRACK = "#f1d9da";

export const DERSLER = [
  "Matematik",
  "Türkçe",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Tarih",
  "Coğrafya",
  "İngilizce",
  "Fen Bilimleri",
  "Sosyal Bilgiler",
];

export const KITAP_DURUMLARI = ["Okunuyor", "Okundu", "Planlandı"] as const;
export type KitapDurumu = (typeof KITAP_DURUMLARI)[number];

/** "SINAV ANALİZ VE REHBERLİK GÖRÜŞME FORMU" ders listesi. */
export const SINAV_DERSLERI = [
  "Türkçe",
  "Matematik",
  "Fen Bilimleri",
  "Sosyal Bilgiler",
  "İngilizce",
  "Din Kültürü",
] as const;
export type SinavDersi = (typeof SINAV_DERSLERI)[number];

export const HATA_TURLERI = [
  { key: "KODLAMA", label: "Kodlama Hatası" },
  { key: "YANLIS_OKUMA", label: "Soruyu Yanlış Okuma" },
  { key: "ISLEM", label: "İşlem Hatası" },
  { key: "BILGI_EKSIGI", label: "Bilgi Eksikliği" },
  { key: "DIKKATSIZLIK", label: "Dikkatsizlik" },
  { key: "STRATEJI", label: "Strateji Hatası" },
  { key: "SURE_YONETIMI", label: "Süre Yönetimi" },
  { key: "DIGER", label: "Diğer" },
] as const;
export type HataTuruKey = (typeof HATA_TURLERI)[number]["key"];

/** Veli–öğrenci bağının yakınlık dereceleri. */
export const YAKINLIKLAR = [
  { key: "ANNE", label: "Anne" },
  { key: "BABA", label: "Baba" },
  { key: "VELI", label: "Diğer (vasi/akraba)" },
] as const;

export const YAKINLIK_LABELS: Record<string, string> = {
  ANNE: "Anne",
  BABA: "Baba",
  VELI: "Veli",
};

/** PDR (rehberlik) ayrı bir rol değildir; rehber öğretmen de TEACHER rolüyle girer. */
export const ROLES = {
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  TEACHER: "Öğretmen",
  STUDENT: "Öğrenci",
  PARENT: "Veli",
};

export const ROLE_HOME: Record<string, string> = {
  TEACHER: "/ogretmen",
  STUDENT: "/ogrenci",
  PARENT: "/veli",
};

export const DONUT_COLORS = [
  RED,
  "#d9585d",
  "#e58c8f",
  "#efb7b9",
  "#f6dadb",
  "#8a1b20",
];

export const AVATAR_COLORS = [
  "bg-red-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-teal-400",
  "bg-sky-400",
  "bg-indigo-400",
  "bg-violet-400",
  "bg-pink-400",
];

export function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr-TR");
}

export function avatarColorOf(name: string) {
  return AVATAR_COLORS[name.length % AVATAR_COLORS.length];
}

export function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
