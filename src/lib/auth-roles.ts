import { Backpack, Monitor, Users, type LucideIcon } from "lucide-react";

/**
 * Giriş ve kayıt ekranlarının rol listesi. Her rolün kendi
 * /login/<slug> ve /kayit/<slug> sayfası vardır.
 */
export type AuthRole = {
  slug: string;
  key: string;
  buttonLabel: string;
  heading: string;
  description: string;
  registerButtonLabel: string;
  registerHeading: string;
  registerDescription: string;
  icon: LucideIcon;
};

export const AUTH_ROLES: AuthRole[] = [
  {
    slug: "ogretmen",
    key: "TEACHER",
    buttonLabel: "ÖĞRETMEN GİRİŞİ",
    heading: "Öğretmen Girişi",
    description: "Şubeleriniz, deneme analizleri ve rehberlik notları.",
    registerButtonLabel: "ÖĞRETMEN KAYDI",
    registerHeading: "Öğretmen Kaydı",
    registerDescription: "Okul personeli hesabı oluşturun.",
    icon: Monitor,
  },
  {
    slug: "ogrenci",
    key: "STUDENT",
    buttonLabel: "ÖĞRENCİ GİRİŞİ",
    heading: "Öğrenci Girişi",
    description: "Kitap köşen, deneme analizin ve sana gelen notlar.",
    registerButtonLabel: "ÖĞRENCİ KAYDI",
    registerHeading: "Öğrenci Kaydı",
    registerDescription: "Şubeni ve okul numaranı girerek hesabını oluştur.",
    icon: Backpack,
  },
  {
    slug: "veli",
    key: "PARENT",
    buttonLabel: "VELİ GİRİŞİ",
    heading: "Veli Girişi",
    description: "Çocuğunuzun gelişimi, devamsızlığı ve paylaşılan notlar.",
    registerButtonLabel: "VELİ KAYDI",
    registerHeading: "Veli Kaydı",
    registerDescription: "Çocuğunuzu/çocuklarınızı hesabınıza bağlayın.",
    icon: Users,
  },
];

export function roleBySlug(slug: string): AuthRole | null {
  return AUTH_ROLES.find((r) => r.slug === slug) ?? null;
}
