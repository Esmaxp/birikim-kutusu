# Birikim Kutusu — Eğitim Yönetim Sistemi

Birikim Okulları için Next.js 15 (App Router) + Prisma + SQLite ile geliştirilmiş,
rol tabanlı giriş sistemine sahip web uygulaması.

## Kurulum

Node.js 20.12 veya üzeri gereklidir.

```bash
cp .env.example .env   # DATABASE_URL tanımı
npm install
npm run setup          # prisma generate + db push + demo verisi
npm run dev            # http://localhost:3000
```

`npm run setup` komutu veritabanını sıfırdan kurar ve demo hesapları oluşturur.
Sonradan veritabanını sıfırlamak için: `npm run db:reset`

## Demo hesaplar

Geliştirmede varsayılan şifre: **birikim123** (`SEED_PASSWORD` ile değiştirilebilir).
Seed öğretmen hesabı yöneticidir; mevcut veritabanları için aşağıdaki `admin:create`
adımını kullanın. Mevcut verileri korumak için `setup`/seed komutlarını tekrar çalıştırmayın.

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

## Kayıt ve davet kodları

`/kayit` yalnızca öğrenci ve veli kayıt seçimi sunar. Öğretmenler giriş yapabilir;
öğretmen kaydı sunucuda da kapalıdır. Öğrenci kayıt sırasında ad/şube/no girmez
ve hiçbir kayıt akışı öğrenci oluşturmaz. Veli hesap adı başlangıçta e-postanın
`@` öncesindeki bölümünden alınır.

| Kayıt türü | Gerekli bilgiler | Sonuç |
| --- | --- | --- |
| Öğretmen | Yönetici tarafından oluşturulan hesap | İlk girişte geçici şifre değişir. |
| Öğrenci | Öğrenci davet kodu, e-posta, şifre + tekrar | Kodun bağlı olduğu mevcut öğrenciye bağlanır. |
| Veli | Bir veya daha fazla veli davet kodu, e-posta, şifre + tekrar | Kodlardaki öğrencilere, personelin belirlediği yakınlıkla bağlanır. |

Şifreler en az 8 karakter, en fazla 72 UTF-8 bayt olmalıdır. Davet kodu 14 gün
geçerlidir, yalnızca bir kez kullanılır ve veritabanında HMAC-SHA256 özeti tutulur.
Kod kullanımı ve hesap bağlama aynı işlem içinde yapılır; bir kodla eşzamanlı
iki istekten yalnızca biri başarılı olur. Başarısız kullanımda kodun bulunup
bulunmadığı, kullanıldığı veya süresinin dolduğu açıklanmaz.

Her öğretmen **Öğrenci yönetimi** menüsünden öğrenci ekleyebilir/düzenleyebilir.
CSV başlığı `sube,no,ad` olmalıdır. En fazla 500 satır önce önizlenir; şube,
numara tekrarları ve hatalar gösterilir. Hatalı satır varsa toplu kayıt yapılmaz.
Öğrenci numarası şube içinde benzersizdir (`@@unique([classId, no])`).

**Davet kodları** menüsünden şube seçilir; öğrenci, Anne, Baba veya Diğer veli
kodu oluşturulur. Yeni kod, aynı öğrenci/türdeki kullanılmamış eski kodları iptal
eder. Kodlar yalnızca üretim sonucunda gösterilir; hemen kopyalayın veya A4
kesilebilir fişleri yazdırın. Sonradan kodun kendisi görüntülenemez. Toplu işlem
hesabı olmayan öğrenci/Anne/Baba için etkin kod yoksa üretir; Diğer veli kodları
tek tek oluşturulur. Kullanılmamış kodlar iptal edilebilir; durum geçmişi görünür.

Bir öğrencinin yalnızca bir Anne ve bir Baba hesabı olabilir; Diğer veli birden
fazla olabilir. Bir veli birden fazla çocuğa bağlanabilir; sonradan `/veli`
üzerindeki kod alanıyla başka çocuk ekleyebilir. Yakınlık formdan kabul edilmez.

Seed 5 şubede 8'er demo öğrenci ve bunların hesaplarını oluşturur. Ek olarak,
hesabı olmayan “Davet Test” öğrencisi ve öğrenci/veli davet kodları üretir;
kodlar yalnızca geliştirmede terminale yazılır.

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

### Yönetici ve öğretmen hesapları

Şema değişiklikleri için `npx prisma db push` çalıştırın. İlk yöneticiyi oluşturun:

```bash
npm run admin:create -- --email yonetici@birikim.k12.tr --name "Okul Yöneticisi"
```

Şifre terminalde gizli olarak sorulur (en az 12 karakter, en fazla 72 UTF-8 bayt).
Otomasyon için `ADMIN_PASSWORD` ortam değişkeni kullanılabilir. Şifreyi komut
satırına yazmayın. Mevcut öğretmen adresi verilirse yöneticiye yükseltilir,
şifresi değiştirilir ve eski oturumları kapatılır. Öğrenci/veli adresi kabul edilmez.

Yöneticiler **Yönetim** menüsünden (`/ogretmen/yonetim/ogretmenler`) öğretmen
oluşturabilir, şifre sıfırlayabilir, hesabı pasifleştirebilir veya tekrar
etkinleştirebilir. Geçici şifre yalnızca işlem sonucunda gösterilir; güvenli
biçimde iletilmelidir. İlk girişte `/hesap/sifre` sayfasında değiştirilmesi
zorunludur. Tüm roller bu sayfadan kendi şifresini değiştirebilir; diğer
cihazların oturumları sonlandırılır. Yönetici kendisini veya son etkin
yöneticiyi pasifleştiremez/yetkisizleştiremez.

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

- `INVITE_CODE_SECRET` için en az 32 rastgele bayttan üretilmiş kalıcı bir gizli
  değer belirleyin. Eksikse üretim sunucusu başlangıçta hata verir. Değişmesi
  mevcut kullanılmamış davet kodlarını geçersiz kılar. Geliştirmede eksikse
  uyarıyla sabit geliştirme anahtarı kullanılır.
- `TRUST_PROXY=none` varsayılandır: tüm yönlendirme başlıkları yok sayılır,
  IP tabanlı sınırlama kapalıdır; e-posta/hesap sınırları çalışır. Üretimde değişken
  tanımlı değilse başlangıçta bir kez uyarılır.
- nginx/Vercel tarzı tek güvenilir proxy için `TRUST_PROXY=hops:1`; iki proxy
  için `hops:2` kullanın. XFF listesinin sağından belirtilen atlama seçilir;
  eksik/geçersiz IP yok sayılır. Origin'e proxy dışından erişim kapatılmalıdır.
- `TRUST_PROXY=cloudflare` yalnızca `cf-connecting-ip` kullanır. Origin yalnızca
  Cloudflare ağlarından trafik kabul etmelidir. `x-real-ip` kullanılmaz.
- Girişte hesap başına 10/15 dakika, bilinen IP başına 30/15 dakika sınırı vardır.
  Bellek içi sayaçlar tek süreç içindir; çok sunuculu kurulumda ortak Redis gibi
  bir depolama kullanın. Geliştirme sınırları daha yüksektir.
- `setup` ve `db:seed`, `NODE_ENV=production` veya `DATABASE_URL` değeri `file:`
  ile başlamıyorsa veritabanına dokunmadan durur. Bilinçli istisna için
  `ALLOW_SEED=true` ve açıkça belirlenmiş `SEED_PASSWORD` gerekir.
  `db:reset` üretim benzeri ortamda hiçbir istisnayla çalışmaz.
- Mevcut veritabanına `npx prisma db push` uygulayın; eski şube/numara tekrarlarını
  önce düzeltin. Ardından `npm run admin:create -- --email ... --name "..."` ile
  yöneticiyi hazırlayın. Üretimde demo hesaplar oluşturmayın.
- Eski yükleme adreslerini önce `npm run uploads:sanitize` ile inceleyin.
  Yalnızca `npm run uploads:sanitize -- --apply` geçersiz alanları temizler.
  Harici adresler, SVG, dizin geçişi ve yanlış dosya türleri reddedilir.
- Dağıtım kontrolünde `npm run check:demo`, varsayılan demo şifresini kullanan
  hesap varsa kod 1 döndürür. `npm test`, `npx tsc --noEmit`, `npm run lint` ve
  `npm run build` kontrollerini çalıştırın.

- `DATABASE_URL` değerini PostgreSQL/MySQL'e çevirip `provider` alanını
  güncelleyin, ardından `prisma migrate deploy` kullanın.
- Dosya yüklemeyi kalıcı bir depolamaya (S3, R2 vb.) taşıyın.
- `npm run build && npm start` ile çalıştırın (HTTPS altında çerez `secure` olur).
