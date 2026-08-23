# Feature Prompt — Exam Analysis & Guidance Interview Module

## Context

You are working on **Birikim Kutusu**, an existing Turkish school management app. Do not scaffold a new project — extend the current one.

**Stack (already in place, do not change):**
- Next.js 15.1 App Router, React 19, TypeScript
- Prisma 6 + SQLite (`prisma/schema.prisma`, `prisma/dev.db`)
- Tailwind CSS 3.4, `lucide-react` icons, `recharts` charts
- Custom cookie session auth in `src/lib/auth.ts` (`requireUser(roles)`, `requireStudentProfile()`, `assertCanAccessStudent()`)
- Roles: `TEACHER` / `STUDENT` / `PARENT`. Counselors are **not** a separate role — they log in as `TEACHER` with `title` set to e.g. `"Rehber Öğretmen (PDR)"`.
- Server Actions in `src/actions/*.ts`, audit logging via `writeAuditLog()` in `src/lib/audit.ts`
- File uploads via the existing `POST /api/upload` route (magic-byte validated, writes to `public/uploads`)
- Brand color `RED = "#c1272d"` from `src/lib/constants.ts`

**All UI text must be in Turkish.** Code, comments, and identifiers in English or the existing Turkish convention — match whatever the surrounding file already does.

---

## Goal

Turn the paper form **"SINAV ANALİZ VE REHBERLİK GÖRÜŞME FORMU"** (attached image) into a digital workflow:

1. A teacher opens a class → sees student cards with **photos** → clicks a student → lands on a **student detail page** with tabs for Attendance, Exam Analysis, Guidance, and Book Corner.
2. Inside Exam Analysis the teacher fills in the full form, saves it, and generates a **print-ready PDF** identical in layout to the paper form.
3. Everything the teacher saves becomes **read-only** on the student's own panel.

---

## Part 1 — Data model changes (`prisma/schema.prisma`)

### 1.1 Add a student photo

Add to `Student`:
```prisma
photoUrl String?
```
Uploaded through the existing `/api/upload` endpoint. Update `src/components/Avatar.tsx` to accept an optional `photoUrl` and render an `<img>` (with `next/image` or plain `img`, rounded, `object-cover`) when present, falling back to the current initials-and-color circle when it is `null`. Every existing call site keeps working unchanged.

### 1.2 Replace the single `ExamAnalysis` with multiple exam records

**This is a breaking change and the most important part of the task.** Right now `ExamAnalysis` has `studentId String @unique`, so a student can only ever have one exam. The form is per-exam, and teachers run many trial exams per year, so this must become one-to-many.

Create a new model — name it `ExamSession` — holding one filled-in form:

```prisma
model ExamSession {
  id        String  @id @default(cuid())
  studentId String
  student   Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  // Section 1 — SINAV BİLGİLERİ
  sinavAdi       String
  sinavTarihi    DateTime
  sinavSaati     String?    // free text, e.g. "09:30"
  gorusmeTarihi  DateTime?
  danismanId     String?    // counselor User id, nullable
  danisman       User?      @relation("ExamCounselor", fields: [danismanId], references: [id], onDelete: SetNull)

  // Section 2 — SINAV YÖNETİMİ
  toplamCozumSuresi Int?     // minutes

  // Section 3 — SINAV SÜRECİ DEĞERLENDİRMESİ
  icselProblem      Boolean  @default(false)
  icselAciklama     String?
  dissalProblem     Boolean  @default(false)
  dissalAciklama    String?
  hataYapildi       Boolean  @default(false)
  hataTurleri       String   @default("[]")  // JSON string array of error-type keys
  hataDigerAciklama String?

  // Section 4 — aggregate results
  toplamNet     Float?
  puan          Float?
  yuzdelikDilim Float?
  turkiyeSirasi Int?
  kurumSirasi   Int?
  sinifSirasi   Int?

  // Section 5 — ANALİZ NOTLARI
  genelDegerlendirme String?
  kararlarOneriler   String?

  // Section 6 — İMZALAR (digital confirmation, not drawn signatures)
  ogrenciOnayAt DateTime?
  rehberOnayAt  DateTime?

  visibleToStudent Boolean @default(true)

  subjects ExamSubjectResult[]
  gains    MissedGain[]

  createdById String?
  createdBy   User?   @relation("ExamAuthor", fields: [createdById], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([studentId, sinavTarihi])
}

/// One row per subject: merges the Section-2 timing table and the Section-4 nets table,
/// because both are keyed by the same subject list.
model ExamSubjectResult {
  id      String      @id @default(cuid())
  examId  String
  exam    ExamSession @relation(fields: [examId], references: [id], onDelete: Cascade)

  ders        String   // Türkçe | Matematik | Fen Bilimleri | Sosyal Bilgiler | İngilizce | Din Kültürü
  cozumSuresi Int?     // Section 2: minutes spent
  cozumSirasi Int?     // Section 2: 1 = solved first
  dogru       Int      @default(0)
  yanlis      Int      @default(0)
  bos         Int      @default(0)
  net         Float    @default(0)   // computed server-side, stored for reporting
  order       Int      @default(0)

  @@index([examId])
}

/// Section 4 right column — "KAÇIRILAN (ÇALIŞILACAK) KAZANIMLAR", free-text bullets per subject.
model MissedGain {
  id     String      @id @default(cuid())
  examId String
  exam   ExamSession @relation(fields: [examId], references: [id], onDelete: Cascade)

  ders  String
  metin String
  order Int    @default(0)

  @@index([examId, ders])
}
```

Add the matching back-relations on `Student` (`examSessions ExamSession[]`) and `User` (`examSessionsAuthored`, `examSessionsAsCounselor`).

**Migration:** keep the old `ExamAnalysis` / `SubjectTime` / `WrongItem` / `ScorePoint` models in place for now so the existing donut and score-trend views (`src/components/ExamAnalysisEditor.tsx`, `ExamAnalysisView.tsx`, `ExamDonutView.tsx`) do not break. Write a one-off script under `prisma/` that copies any existing `ExamAnalysis` row into a single `ExamSession` per student, and state clearly in a code comment that the legacy models are deprecated. Do not silently drop data. The project uses `prisma db push`, not migration files — follow that.

### 1.3 Constants

In `src/lib/constants.ts` add:

```ts
export const SINAV_DERSLERI = [
  "Türkçe", "Matematik", "Fen Bilimleri",
  "Sosyal Bilgiler", "İngilizce", "Din Kültürü",
] as const;

export const HATA_TURLERI = [
  { key: "KODLAMA",     label: "Kodlama Hatası" },
  { key: "YANLIS_OKUMA",label: "Soruyu Yanlış Okuma" },
  { key: "ISLEM",       label: "İşlem Hatası" },
  { key: "BILGI_EKSIGI",label: "Bilgi Eksikliği" },
  { key: "DIKKATSIZLIK",label: "Dikkatsizlik" },
  { key: "STRATEJI",    label: "Strateji Hatası" },
  { key: "SURE_YONETIMI",label: "Süre Yönetimi" },
  { key: "DIGER",       label: "Diğer" },
] as const;
```

Net formula (LGS convention): `net = dogru - (yanlis / 3)`, rounded to 2 decimals. Compute it in a shared helper in `src/lib/exam.ts` and use the **same helper** on both client (live preview) and server (persisted value) so they can never diverge. Never trust a client-sent `net`.

---

## Part 2 — Teacher: class view with photos

**File:** `src/app/ogretmen/sube/[sube]/page.tsx` and `src/components/StudentGrid.tsx`

- The class page currently renders a grid of initials avatars. Change it so each card shows the student's **photo** (falling back to initials), the name, the student number, and the class name.
- Clicking a card must **not** open the current inline side panel. It navigates to the new student detail route below. Keep the card grid itself as the only interaction — no hover menus.
- Add a small photo-upload control on the student detail page (teacher only) that posts to `/api/upload` and saves the returned URL to `Student.photoUrl` via a new server action.

---

## Part 3 — Teacher: student detail page

**New route:** `src/app/ogretmen/ogrenci/[studentId]/page.tsx`

Header: photo, full name, class + student number, guardian name and phone from `Student.veliAdi` / `telefon`. Below it, four tabs driven by a `?tab=` search param, matching the existing tab pattern already used in `sube/[sube]/page.tsx`:

| Tab | Key | Content |
|---|---|---|
| Devamsızlık | `devam` | Existing absence list + add/delete, reuse `src/actions/absences.ts` |
| Deneme Analizi | `deneme` | List of that student's `ExamSession` records (newest first) + "Yeni Analiz" button; each row links to the form editor |
| Rehberlik | `rehberlik` | Existing `Note` create/list/delete, reuse `src/actions/notes.ts`, keep the `visibleToStudent` toggle |
| Kitap Köşesi | `kitap` | Existing book add/edit/delete, reuse `src/actions/books.ts` and `src/components/BookCorner.tsx` |

Reuse the logic already inside `src/components/TeacherStudentPanel.tsx` rather than rewriting it — lift it into tab components if that is cleaner. Guard the whole route with `requireUser(["TEACHER"])` **and** `assertCanAccessStudent(user, studentId)`.

Update `src/app/ogretmen/sube/[sube]/page.tsx` so the old inline panel and the separate `/ogretmen/deneme/[studentId]` entry point both redirect into this unified page — one place per student, not three.

---

## Part 4 — The exam analysis form

**New route:** `src/app/ogretmen/ogrenci/[studentId]/deneme/[examId]/page.tsx`, where `examId` may be the literal `yeni` for a new record.

**New client component:** `src/components/ExamSessionForm.tsx`

Lay it out as six numbered sections that visually mirror the paper form — numbered circular badges, one color per section (blue / green / orange / blue / purple / slate as in the image), rounded cards with 1px borders. Match the existing app's density: `text-[12px]`–`text-[13px]` labels, `rounded-xl` cards, `border-slate-200`.

### Section 1 — Sınav Bilgileri
Sınav Adı (text, required) · Sınav Tarihi (date, required) · Sınav Saati (time) · Görüşme Tarihi (date) · Danışman (select of `TEACHER` users, default = current user).

### Section 2 — Sınav Yönetimi (Zaman ve Çözüm Stratejisi)
"Toplam Çözüm Süresi (dk)" number input, then a table with one row per subject in `SINAV_DERSLERI`: **Ders | Çözüm Süresi (dk) | Çözüm Sırası**. Çözüm Sırası is a number 1..N. Show a live warning (not a hard block) if the per-subject minutes sum exceeds the declared total, or if a solve-order value is duplicated.

### Section 3 — Sınav Süreci Değerlendirmesi
Three side-by-side cards:
- **İçsel (Ruhsal) Problem Yaşandı mı?** — Hayır/Evet radio; when Evet, reveal a textarea "Açıklama".
- **Dışsal Problem Yaşandı mı?** — same shape.
- **Sınav Esnasında Hata Yapıldı mı?** — Hayır/Evet radio; when Evet, reveal the `HATA_TURLERI` checkbox grid; when `DIGER` is checked, reveal a free-text input.

Persist checked keys as a JSON string array in `hataTurleri`. Hide (don't just disable) the dependent fields when the answer is Hayır, and clear their values on save so stale explanations can't linger.

### Section 4 — Sınav Sonuç Analizi (Netler)
Left: editable table **Ders | Doğru | Yanlış | Boş | Net**, one row per subject, plus a bold **TOPLAM** row. Net is computed and read-only. Doğru+Yanlış+Boş per subject should be validated against an optional per-subject question count if you add one; otherwise just warn on negative or absurd values.

Below the table, six summary boxes styled like the form: **Toplam Net · Puan · Yüzdelik Dilim · Türkiye Sırası · Kurum Sırası · Sınıf Sırası**. Toplam Net auto-sums from the table; the other five are manual entry.

Right: **KAÇIRILAN (ÇALIŞILACAK) KAZANIMLAR** — one bordered block per subject with a small subject icon, containing an add/remove list of free-text bullet lines. Persist as `MissedGain` rows. Start each subject with two empty lines like the paper form.

### Section 5 — Analiz Notları
Two textareas: "Genel Değerlendirme" and "Bir sonraki sınav için alınacak kararlar / öneriler".

### Section 6 — İmzalar
Do **not** implement drawn signatures. Instead show two confirmation states — "Öğrenci Onayı" and "Rehber Öğretmen Onayı" — each a button that stamps `ogrenciOnayAt` / `rehberOnayAt` with the current time and displays who confirmed and when. The counselor button is available to `TEACHER`; the student one is confirmed from the student's own panel (Part 6). On the printed sheet, render blank ruled signature lines when unconfirmed and the confirming name + date when confirmed.

### Behavior
- Autosave is **not** required; use an explicit "Kaydet" button with a `useTransition` pending state, matching `ExamAnalysisEditor.tsx`.
- Warn on navigating away with unsaved changes (`beforeunload`).
- After a successful save of a new record, replace the URL from `.../deneme/yeni` to `.../deneme/<newId>` so a refresh doesn't create a duplicate.

---

## Part 5 — Server action and PDF output

### 5.1 Server action

**New file:** `src/actions/exam-session.ts`

```ts
saveExamSession(studentId: string, examId: string | null, data: ExamSessionInput)
deleteExamSession(examId: string)
confirmExamSession(examId: string, who: "OGRENCI" | "REHBER")
```

Follow the exact pattern of the existing `src/actions/exam.ts`:
- `requireUser(["TEACHER"])` then `assertCanAccessStudent(user, studentId)` at the top of every mutation. `confirmExamSession` with `who: "OGRENCI"` is the one exception — it is called by the student and must verify that the exam belongs to the calling student's own profile.
- Sanitize every string (trim, cap length ~500 for free text, ~2000 for the two long textareas) and clamp every number to a sane range. Reject `NaN`.
- Recompute all `net` values and `toplamNet` server-side.
- Rewrite `ExamSubjectResult` and `MissedGain` children inside a `prisma.$transaction`, deleting and re-creating with preserved `order`, exactly like `saveExamAnalysis` does today.
- `writeAuditLog()` with new actions `EXAM_SESSION_SAVE`, `EXAM_SESSION_DELETE`, `EXAM_SESSION_CONFIRM`, entityType `ExamSession`.
- `revalidatePath` for `/ogretmen`, `/ogrenci`, `/veli` with `"layout"`, as the existing action does.

### 5.2 Printable output

**New route:** `src/app/ogretmen/ogrenci/[studentId]/deneme/[examId]/yazdir/page.tsx`

Server-render a single self-contained A4 page that reproduces the paper form 1:1 with the saved values filled in. This is the primary print path — the teacher opens it and uses the browser's own print dialog, which both prints to a physical printer and produces a PDF via "Save as PDF". Requirements:

- A dedicated print stylesheet: `@page { size: A4 portrait; margin: 12mm; }`, `-webkit-print-color-adjust: exact; print-color-adjust: exact;` so the section colors survive.
- `@media print` hides the app shell, sidebar, and all buttons.
- Must fit on **one** A4 page. Use fixed mm-based dimensions rather than viewport units. Test by rendering with a full six-subject dataset and long text in every free-text field.
- Checkboxes render as filled/empty squares, not native inputs.
- A "Yazdır" button (hidden in print) that calls `window.print()`, and an auto-print option via `?auto=1`.
- Add a school header with the student's photo, name, class and number in the top-right of the sheet.

**Optional server-side PDF** — only add this if a true file download is required (e.g. to attach a PDF to a record). If so, add a `GET /api/exam-session/[examId]/pdf` route. Do **not** pull in Puppeteer or headless Chromium; it will not run in a typical shared-host deployment and bloats the image. Prefer `@react-pdf/renderer`, which is pure JS, or `pdf-lib` if you template the sheet. Reuse the same data-loading helper as the print page so the two outputs cannot drift apart. Ask before adding the dependency.

Add a **shared loader** `getExamSession(examId)` in `src/lib/exam-session.ts` returning a plain serializable object, mirroring how `getExamData()` works today. Editor, print page, student view, and any PDF route all consume this one function.

---

## Part 6 — Student panel

**File:** `src/app/ogrenci/layout.tsx` — the sidebar already has Özet / Kitap Köşesi / Deneme Analizi / PDR Notlarım. Add **Devamsızlığım** (`/ogrenci/devamsizlik`, `calendar` icon) so the student menu covers all four areas the teacher fills in.

- **`/ogrenci/deneme-analizi`** — replace the single-record view with a list of the student's `ExamSession` records where `visibleToStudent` is true, newest first, showing exam name, date, toplam net, puan, and yüzdelik dilim. Clicking one opens `/ogrenci/deneme-analizi/[examId]` with a **read-only** rendering of the full form, plus the student's "Onayla" button for Section 6. Add a small `recharts` line chart of puan over time across sessions — this is what the deprecated `ScorePoint` model was doing, now derived from real records.
- **`/ogrenci/devamsizlik`** — read-only list of `Absence` rows with date and reason, and a total count.
- **Kitap Köşesi and PDR Notlarım** keep their current behavior. Books added by a teacher must appear in the student's list, distinguished by a small "Öğretmen ekledi" badge using the existing `Book.addedById`.
- The student can **never** edit exam, absence, or note data. Enforce this in the server actions, not just by hiding UI.
- Mirror the same read-only exam list on the parent panel `src/app/veli/page.tsx`.

---

## Constraints

- **No new heavy dependencies** without asking. The print-CSS approach needs zero.
- Keep server actions as the mutation path; do not introduce API routes for writes.
- Every new mutation gets an `AuditLog` entry.
- Every new page validates role **and** student ownership server-side.
- Do not break existing routes, seed data, or `prisma/seed.ts` — update the seed to include a couple of `ExamSession` fixtures and at least one `photoUrl` so the new screens have something to render.
- Run `npx tsc --noEmit` and `npm run lint` clean before you finish.

## Deliverable order

Work in this sequence and stop for review after each step: (1) schema + migration script + seed, (2) Avatar photo support + class grid, (3) student detail page with four tabs, (4) exam form component + server action, (5) print page, (6) student and parent panels.