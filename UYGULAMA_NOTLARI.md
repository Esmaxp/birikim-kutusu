# promt.md uygulama notları

## Mesaj gönderimi düzeltmesi ve üst bildirim alanı

- `crypto.randomUUID` bulunmadığında gönderimin hata yakalama bloğuna ulaşmadan
  kilitlendiği tarayıcıda yeniden üretildi. Yerel geçici mesaj kimliği bu API'ye
  bağımlı olmaktan çıkarıldı; aynı tarayıcı senaryosunda gönderim/alım doğrulandı.
- Beklenen oturum, erişim ve hız sınırı hataları üretimde de Türkçe gösterilir.
  Gönderim hatası düzenli sorgulama tarafından silinmez; bağlantı için yeniden deneme vardır.
- Üst çubukta tüm rollere Bildirimler zili eklendi. Okunmamış mesaj sayısı, gönderen,
  öğrenci, önizleme ve doğru görüşmeye bağlantı gösterilir. Yeni mesaj uygulama içi
  bildirim oluşturur. Gizli sekmede sorgulama durur; görünür olunca yenilenir.
- `/api/messages/notifications` yalnızca oturum sahibinin güncel olarak erişebildiği
  görüşmelerdeki gelen, okunmamış mesajları döndürür. Yanıtlar önbelleğe alınmaz.
  Bildirim listesini açmak mesajları okundu saymaz; sohbet açılmalıdır.
- Yeni dosyalar: `src/lib/message-notifications.ts`,
  `src/app/api/messages/notifications/route.ts`, `src/components/MessageNotifications.tsx`,
  `tests/message-notifications.test.ts`. Mesaj action'ları, Chat, AppShell, mesaj
  testleri ve belgeler güncellendi. Şema veya ortam değişkeni değişikliği gerekmez.
- Doğrulama: 13 dosyada 45 test geçti. `crypto.randomUUID` kapatılarak yapılan
  tarayıcı testinde gönderim, alım ve okundu bilgisi çalıştı. Öğrenci, öğretmen ve
  veli başka sayfadayken gelen mesajın zil sayacını güncellediği ve bildirimin doğru
  görüşmeye açıldığı doğrulandı. Mobil bildirim kutusunda ve üç rolün mobil/masaüstü
  sohbetlerinde axe WCAG A/AA ihlali ve tarayıcı çalışma hatası bulunmadı.

## Mesajlaşma ve panel sadeleştirme — 19 Ekim 2026

- Öğretmen menüsü üç ana bağlantı ve yalnızca yöneticiye görünen ayrı Yönetim
  bağlantısı içerir. Kontrol paneli yalnızca doğal sıralı, tıklanabilir şube kartlarıdır.
  Eski rehberlik/not sayfaları korunmuştur; arama kısayolunun yalnızca ipucu kaldırılmıştır.
- Mevcut öğrenci detayının `?tab=` yapısı korunmuştur: `ogrenci-mesaj` (Ö-Ö-İ)
  ve `veli-mesaj` (Ö-V-İ). Veli seçimi `veli` parametresiyle yapılır.
  Öğrenci ve veli gelen kutuları `/ogrenci/mesajlar`, `/veli/mesajlar` adreslerindedir.
- Roller `TEACHER`, `STUDENT`, `PARENT`; veli bağlantısı `StudentParent`, yakınlık alanı
  `yakinlik` (ANNE/BABA/VELI), öğrenci hesabı `Student.userId` olarak kullanılmıştır.
  Şube–öğretmen ilişkisi olmadığından tüm etkin öğretmenlere yazılabilir.
- Conversation ve Message tabloları yabancı anahtarlarla eklendi. Görüşme anahtarı
  tür, öğrenci, öğretmen ve katılımcı birleşiminde benzersizdir. Mesaj oluşturma ve
  son mesaj zamanı tek veritabanı işleminde güncellenir.
- Katılımcı üyeliği, güncel öğrenci/veli bağı ve hesap etkinliği her erişimde denetlenir.
  Gönderen oturumdan belirlenir; öğretmen başka öğretmen adına görüşme açamaz.
  Okundu işlemi yalnızca karşı tarafın okunmamış mesajlarına uygulanır.
- Ortak Chat bileşeni düz metin, tarih ayırıcıları, tek tik/mavi çift tik, geçici mesaj
  gösterimi, gönderim hatası ve kaydırma konumunu koruma içerir. En son 200 mesaj
  gösterilir; dört saniyede bir yenilenir, gizli sekmede durur, görünür olunca yenilenir.
- Mesaj en fazla 2000 karakterdir; dakikada kullanıcı başına 20 gönderim kabul edilir.
  SQLite ve bellek içi sınırlayıcı tek süreç içindir; çok süreçte ortak sayaç gerekir.
  İleride sorgulama SSE/WebSocket ile değiştirilebilir. Menü rozetleri sunucuda hesaplanır.
- Şema yerelde `npx prisma db push --skip-generate` ve `npx prisma generate` ile uygulandı.
  Mevcut veri yeniden seed edilmedi; `.env` değiştirilmedi. Başka bilgisayarda:
  `npx prisma db push` ve `npx prisma generate` çalıştırın.

### Bu değişikliğin doğrulaması ve dosyaları

- `npx prisma generate`, `npx tsc --noEmit`, `npm run lint`, `npm test` ve
  `npm run build` başarılı. 12 test dosyasında 39 test geçti; dokuzu mesajlaşmaya aittir.
- Geliştirme sunucusunda tarayıcı üzerinden şube kartları, yönetici menüsü, Ctrl+K,
  öğretmen–öğrenci mesajı, öğrenci yanıtı, veli seçimi ve tek tikten mavi çift tike
  geçiş doğrulandı. Mesaj içindeki HTML düz metin olarak gösterildi.
- Üç rolün 375 ve 1280 piksel mesaj ekranlarında sayfa taşması, tarayıcı çalışma
  hatası veya axe WCAG A/AA ihlali bulunmadı. Yanlış rolün sayfaya erişimi engellendi.
  Kontrol için açılan geçici oturumlar ve test mesajları işlem sonunda temizlendi.
- Eklenen dosyalar: `src/actions/messages.ts`, `src/lib/messages.ts`,
  `src/components/Chat.tsx`, `src/components/TeacherChat.tsx`,
  `src/components/MessageInbox.tsx`, `src/app/ogrenci/mesajlar/page.tsx`,
  `src/app/veli/mesajlar/page.tsx`, `tests/messages.test.ts`.
- Güncellenen dosyalar: `prisma/schema.prisma`, `src/components/AppShell.tsx`,
  `src/app/ogretmen/layout.tsx`, `src/app/ogretmen/page.tsx`,
  `src/app/ogretmen/ogrenci/[studentId]/page.tsx`, `src/app/ogrenci/layout.tsx`,
  `src/app/veli/layout.tsx`, `README.md`, `UYGULAMA_NOTLARI.md`.
- Kullanıcının `promt.md` değişikliği korundu; dosyaya müdahale edilmedi.

Önceki sürüme ait uygulama notları aşağıdadır.

Beş ana görevin zorunlu kod değişiklikleri sırayla uygulandı. Mevcut `promt.md`
değişikliği korundu. İsteğe bağlı Upload tablosu eklenmedi; isteğe bağlı demo
şifresi denetimi eklendi.

## Şema

- User: `isAdmin`, `mustChangePassword`, `disabledAt`.
- InviteCode: tek kullanımlık, HMAC özeti saklanan öğrenci/veli davetleri.
- Student: `@@unique([classId, no])` ve davet ilişkisi.
- Yerel veritabanında şube/numara tekrar kontrolü yapıldı: tekrar bulunmadı.
  `prisma db push` yerel veritabanına uygulandı; mevcut veriler yeniden seed edilmedi.

## Ortam değişkenleri

- `INVITE_CODE_SECRET`: üretimde zorunlu, kalıcı rastgele gizli değer. Yerel `.env`
  için rastgele değer oluşturuldu; bu dosya Git'e alınmaz.
- `TRUST_PROXY`: `none` (varsayılan), `hops:N` veya `cloudflare`.
- `ALLOW_SEED`: üretim benzeri ortamda seed/setup için bilinçli istisna;
  reset için hiçbir istisna yoktur.
- `SEED_PASSWORD`: tanımlı değilse yerel seed için rastgele, geçici parola
  oluşturulur ve yalnızca seed komutunun sonunda gösterilir. Üretimde
  en az 12 karakterli, ortama özel bir parola açıkça belirlenmelidir.
- `ADMIN_PASSWORD`: ilk yönetici komutunda isteğe bağlı; normal kullanımda
  terminalde gizli şifre sorulur.

## Kurulum ve manuel adımlar

Node.js 20.12+ kullanın. Başka bir kurulumda `npm ci` ve `npx prisma db push`
çalıştırın. Yeni benzersizlik kuralı öncesinde eski şube/numara tekrarlarını düzeltin.

İlk yöneticiyi oluşturmak veya mevcut öğretmeni yükseltmek için:

```bash
npm run admin:create -- --email yonetici@birikim.k12.tr --name "Okul Yöneticisi"
```

En az 12 karakterlik şifreyi gizli terminal sorusuna girin. Yönetici oturumu
açıldığında Yönetim menüsünden öğretmen oluşturma/sıfırlama yapılabilir.
Tüm öğretmenler Öğrenci yönetimi ve Davet kodları menülerini kullanabilir.

Eski yükleme adreslerini önce değişiklik yapmadan inceleyin:

```bash
npm run uploads:sanitize
npm run uploads:sanitize -- --apply
```

İkinci komut yalnızca temizlemeyi uygulamak istediğinizde kullanılmalıdır.
Yerel taramada `/uploads/seed-avatar-elif.svg` adresi geçersiz bulundu;
dry-run kayıtları değiştirmedi. Ekranlar geçersiz adresi göstermiyor.

Üretimde gizli anahtarı ve güvenilir proxy ayarını belirleyin. Cloudflare
kipinde origin yalnızca Cloudflare ağlarından trafik kabul etmelidir.
Çok süreçli kurulumda bellek içi rate limiter yerine ortak depolama gerekir.

## Doğrulama

- 26 test geçti: sahte öğretmen kaydı, yönetici/oturum korumaları, ilk yönetici
  oluşturma, şifre değişimi, davet üretme/normalleştirme/HMAC, eşzamanlı kod
  kullanımı, anne/baba tekilliği ve rollback, CSV, IP, login, rate limiter,
  yükleme URL'leri ve üretim seed/reset engelleri.
- `npx tsc --noEmit`, `npm run lint`, `npm run build` başarılı.
- HTTP kontrolü: öğretmen giriş sayfası 200, öğretmen kayıt sayfası 404;
  girişsiz yönetim ve şifre değiştirme sayfaları `/login` adresine yönlendiriliyor.
- Uygulama `http://localhost:3000` adresinde yeniden başlatıldı.

## Değişen ve eklenen dosyalar

- `.env.example`
- `README.md`
- `eslint.config.mjs`
- `package-lock.json`
- `package.json`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `scripts/check-demo-accounts.ts`
- `scripts/create-admin.ts`
- `scripts/guard-dev-only.mjs`
- `scripts/sanitize-upload-urls.ts`
- `src/actions/books.ts`
- `src/actions/exam.ts`
- `src/actions/invites.ts`
- `src/actions/student-management.ts`
- `src/actions/students.ts`
- `src/actions/teachers.ts`
- `src/app/api/upload/route.ts`
- `src/app/hesap/sifre/PasswordForm.tsx`
- `src/app/hesap/sifre/actions.ts`
- `src/app/hesap/sifre/page.tsx`
- `src/app/kayit/RegisterForm.tsx`
- `src/app/kayit/[rol]/page.tsx`
- `src/app/kayit/actions.ts`
- `src/app/kayit/page.tsx`
- `src/app/login/[rol]/page.tsx`
- `src/app/login/actions.ts`
- `src/app/ogretmen/layout.tsx`
- `src/app/ogretmen/ogrenci/[studentId]/deneme/[examId]/yazdir/page.tsx`
- `src/app/ogretmen/yonetim/davet-kodlari/InviteManager.tsx`
- `src/app/ogretmen/yonetim/davet-kodlari/page.tsx`
- `src/app/ogretmen/yonetim/ogrenciler/StudentManager.tsx`
- `src/app/ogretmen/yonetim/ogrenciler/page.tsx`
- `src/app/ogretmen/yonetim/ogretmenler/TeacherManagement.tsx`
- `src/app/ogretmen/yonetim/ogretmenler/page.tsx`
- `src/app/veli/LinkChildForm.tsx`
- `src/app/veli/page.tsx`
- `src/components/AppShell.tsx`
- `src/components/Avatar.tsx`
- `src/components/BookCorner.tsx`
- `src/components/ExamAnalysisEditor.tsx`
- `src/components/ExamAnalysisView.tsx`
- `src/instrumentation.ts`
- `src/lib/audit.ts`
- `src/lib/auth-roles.ts`
- `src/lib/auth.ts`
- `src/lib/client-ip.ts`
- `src/lib/invite.ts`
- `src/lib/rate-limit.ts`
- `src/lib/student-csv.ts`
- `src/lib/upload-url.ts`
- `tests/admin-bootstrap.test.ts`
- `tests/auth-guards.test.ts`
- `tests/client-ip.test.ts`
- `tests/invite.test.ts`
- `tests/login-limits.test.ts`
- `tests/password-change.test.ts`
- `tests/rate-limit.test.ts`
- `tests/seed-guard.test.ts`
- `tests/teacher-security.test.ts`
- `tests/upload-url.test.ts`
- `vitest.config.mts`
