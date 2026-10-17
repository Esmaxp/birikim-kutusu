# promt.md uygulama notları

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
