# Birikim Kutusu — Eğitim Yönetim Sistemi

Birikim Okulları için Next.js 15 (App Router) + Prisma + SQLite ile geliştirilmiş,
rol tabanlı giriş sistemine sahip web uygulaması.

## Kurulum

```bash
cp .env.example .env   # DATABASE_URL tanımı
npm install
npm run setup          # prisma generate + db push + demo verisi
npm run dev            # http://localhost:3000
```

`npm run setup` komutu veritabanını sıfırdan kurar ve demo hesapları oluşturur.
Sonradan veritabanını sıfırlamak için: `npm run db:reset`

## Demo hesaplar

Tüm hesapların şifresi: **birikim123**

| Rol | E-posta | Giriş sayfası | Panel |
| --- | --- | --- | --- |
| Öğretmen | `ogretmen@birikim.k12.tr` | `/login/ogretmen` | `/ogretmen` |
| Rehber öğretmen (PDR) | `pdr@birikim.k12.tr` | `/login/ogretmen` | `/ogretmen` |
| Öğrenci | `elif.kaya@ogrenci.birikim.k12.tr` | `/login/ogrenci` | `/ogrenci` |
| Veli (anne) | `veli.elif.kaya@birikim.k12.tr` | `/login/veli` | `/veli` |
| Veli (baba, aynı öğrencinin 2. velisi) | `baba.elif.kaya@birikim.k12.tr` | `/login/veli` | `/veli` |
| Veli (iki çocuklu) | `baba.demir@birikim.k12.tr` | `/login/veli` | `/veli` |

PDR ayrı bir rol değildir: rehber öğretmen de **öğretmen girişini** kullanır ve
öğretmen paneline düşer; uzmanlığı `User.title` alanında tutulur (rehberlik
notlarının altında bu unvan görünür).

## Giriş ekranı

`/login` yalnızca rol seçim ekranıdır; her buton ilgili rolün kendi giriş
sayfasını açar (`/login/ogretmen`, `/login/ogrenci`, `/login/veli`). Rol
tanımları tek yerde, `src/lib/auth-roles.ts` içindedir; yeni bir rol eklemek
için bu listeye bir kayıt eklemek yeterlidir. Seçilen rol formda gizli alan
olarak gönderilir ve hesabın rolüyle eşleşmezse giriş reddedilir.

Giriş formunda demo e-posta/şifre ipucu gösterilmez.

## Kayıt ekranı

`/kayit` rol seçimidir; her rolün kendi kayıt sayfası vardır
(`/kayit/ogretmen`, `/kayit/ogrenci`, `/kayit/veli`). Ortak alanlar: ad soyad,
e-posta, şifre + şifre tekrarı (en az 6 karakter). Kayıt başarılıysa oturum
açılır ve rolün paneline yönlendirilir. Saatte IP başına 10 kayıt denemesi
sınırı vardır.

| Kayıt türü | Ek alanlar | Davranış |
| --- | --- | --- |
| Öğretmen | Branş / unvan (isteğe bağlı) | Doğrudan öğretmen hesabı açılır. |
| Öğrenci | Şube, okul no | Şube + no + ad okul kaydıyla eşleşirse mevcut öğrenci kaydına bağlanır; o öğrencinin hesabı zaten varsa reddedilir. Eşleşme yoksa ve numara boşsa yeni öğrenci kaydı açılır. |
| Veli | Yakınlık (Anne/Baba/Diğer) + bir veya daha fazla çocuk satırı (öğrenci adı, şube, okul no) | Her satır mevcut öğrenciyle eşleştirilir; eşleşmeyen satır kaydı durdurur. Veli yeni öğrenci kaydı oluşturamaz. |

**Veli–öğrenci ilişkisi çoktan-çoğadır** (`StudentParent` tablosu):

- Bir öğrencinin birden çok velisi olabilir — anne ve baba ayrı hesaplarla girer.
- Bir velinin birden çok çocuğu olabilir; veli panelinde çocuklar arasında
  sekmelerle geçilir.
- Aynı öğrenciye yalnızca **bir Anne** ve **bir Baba** bağlanabilir; "Diğer
  (vasi/akraba)" birden fazla olabilir. Aynı veli aynı öğrenciye iki kez
  bağlanamaz (`@@unique([studentId, parentId])`).

Öğrenci adı eşleştirmesi Türkçe büyük/küçük harfe ve Türkçe karaktere
duyarsızdır ("zeynep celik" → "Zeynep Çelik"); okul no şube içinde tekil olduğu
için asıl ayırt edici alan odur.

> Üretimde: veli-öğrenci eşleşmesi şu an yalnızca şube + ad + okul no bilgisine
> dayanıyor. Gerçek kullanımda okul tarafından üretilen tek kullanımlık davet
> kodu veya yönetici onayı eklenmelidir.

Seed 5 şube (5A–6B) ve her şubede 8 öğrenci oluşturur; her öğrencinin kendi
öğrenci ve veli hesabı vardır (ör. `burak.demir@ogrenci.birikim.k12.tr`).

## Roller ve yetkiler

| İşlem | Öğretmen | Öğrenci | Veli |
| --- | :-: | :-: | :-: |
| Deneme analizi **girme/düzenleme** | ✓ | ✗ | ✗ |
| Deneme analizi görüntüleme | ✓ | ✓ (salt-okunur) | ✓ |
| Kitap ekleme / dosya yükleme | ✓ | ✓ (kendi rafı) | ✗ |
| Beğenilen söz kaydetme | ✓ | ✓ (kendi) | ✗ |
| Rehberlik notu yazma | ✓ | ✗ | ✗ |
| Paylaşılan notları okuma | ✓ | ✓ (paylaşılanlar) | ✓ |
| Devamsızlık kaydı | ✓ | ✗ | ✓ (görüntüleme) |

Yetki denetimi iki katmanda yapılır: sayfa girişinde `requireUser(roller)` ve her
server action içinde `assertCanAccessStudent` ile kayıt sahipliği kontrolü.

## Öğrenci paneli

- **Özet** (`/ogrenci`) — kitap, söz, deneme ortalaması ve devamsızlık özetleri.
- **Kitap Köşesi** (`/ogrenci/kitap-kosesi`)
  - Kitap yükleme: ad, yazar, durum, sayfa, puan, yorum + **kapak görseli** ve
    **kitap dosyası (PDF/EPUB)** yükleme.
  - Beğenilen sözleri kaydetme: metin, kaynak, kitap ilişkisi, sayfa no, favori.
- **Deneme Analizi** (`/ogrenci/deneme-analizi`) — **salt-okunur**. Öğrenci net,
  puan veya yanlış girişi yapamaz; yalnızca öğretmenin girdiği analizi görür
  (puan grafiği, süre dağılımı, konu ve soru tipi bazlı yanlış halkaları).
- **PDR Notlarım** (`/ogrenci/pdr-notlari`) — rehber öğretmenin ve diğer
  öğretmenlerin paylaştığı notlar; okunmayanlar "Yeni" rozetiyle işaretlenir.

## Öğretmen paneli

- Kontrol paneli, şube bazlı öğrenci listeleri.
- Öğrenci kartı: devamsızlık kaydı, not girişi (öğrenciye açık/gizli), kitap ekleme.
- **Rehberlik** (`/ogretmen/rehberlik`) — eski PDR paneli buraya taşındı. Şube ve
  öğrenci seçilir, görüşme notu yazılır ve öğrencinin tüm not geçmişi listelenir.
  Not varsayılan olarak öğrenciye açık gönderilir.
- Deneme analizi düzenleyicisi (`/ogretmen/deneme/[studentId]`): PDF yükleme,
  ders/süre satırları, konu ve soru tipi yanlış halkaları, puan gelişim grafiği.

## Teknik yapı

```
prisma/schema.prisma     Veri modeli (User, Session, Student, StudentParent, Book,
                         Quote, Note, Absence, ExamAnalysis + alt tablolar)
prisma/seed.ts           Demo verisi
src/lib/auth.ts          Oturum yönetimi (bcrypt + httpOnly çerez) ve yetki denetimi
src/lib/auth-roles.ts    Giriş/kayıt rollerinin tek kaynağı
src/actions/             Server action'lar (exam, books, notes, absences)
src/app/login/           Rol seçimi + role özel giriş sayfaları
src/app/kayit/           Rol seçimi + role özel kayıt sayfaları ve kayıt action'ı
src/app/api/upload       Dosya yükleme (max 10 MB; jpg/png/webp/gif/pdf/epub)
src/components/          Ortak arayüz bileşenleri (AuthShell, AppShell vb.)
```

- Oturumlar veritabanında `Session` tablosunda tutulur, çerez `httpOnly` +
  `sameSite=lax` olarak yazılır, süresi 7 gündür.
- Şifreler bcrypt (10 tur) ile saklanır.
- Yüklenen dosyalar `public/uploads/` altına sunucu tarafından üretilen rastgele
  adlarla yazılır; kullanıcı girdisi dosya yolu olarak kullanılmaz.

## Üretime alırken

- `DATABASE_URL` değerini PostgreSQL/MySQL'e çevirip `provider` alanını
  güncelleyin, ardından `prisma migrate deploy` kullanın.
- Dosya yüklemeyi kalıcı bir depolamaya (S3, R2 vb.) taşıyın.
- `npm run build && npm start` ile çalıştırın (HTTPS altında çerez `secure` olur).
