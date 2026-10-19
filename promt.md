# TASK: UI cleanup + teacher/student/parent messaging for "Birikim Kutusu"

You are working in an existing Next.js 15 (App Router) + Prisma + SQLite + Tailwind + TypeScript project. It is a school management system with three roles: teacher (öğretmen, some are admins), student (öğrenci), parent (veli). The UI language is TURKISH. Keep ALL user-facing strings in Turkish; code, comments, and commit messages in English.

Work in phases. Finish and verify each phase before the next. Do not ask me questions unless something is truly blocking; make reasonable assumptions, and list them in your final report.

---------------------------------------------------------------------
## PHASE 0 — Explore first (no edits yet)
---------------------------------------------------------------------
Read these before changing anything and summarize to yourself how they work:
- README.md, UYGULAMA_NOTLARI.md
- package.json (scripts), tsconfig.json, eslint config, vitest config, tests/
- prisma/schema.prisma, prisma/seed.ts
- src/lib/auth.ts, src/lib/auth-roles.ts (find `requireUser`, `assertCanAccessStudent`, session user shape, role enum/values, admin flag)
- src/components/ (especially AppShell and any sidebar / top-nav / student search component)
- src/app/ogretmen/** (dashboard page, student list pages, student detail page + its top tab menu, rehberlik, yonetim, davet-kodlari, ogrenci-yonetimi)
- src/app/ogrenci/** and src/app/veli/** layouts and navigation
- src/actions/** (follow the existing server action style, validation approach, and error handling)
- Any existing rate limiting helper

Note the exact route names, component names, and role identifiers you find, and use THOSE (not my guesses below) throughout.

---------------------------------------------------------------------
## PHASE 1 — Teacher UI cleanup
---------------------------------------------------------------------

### 1.1 Remove the "Ctrl+K" hint
In the student search box (teacher area), a "Ctrl+K" label/badge is displayed. Remove that visible text/badge only. The search itself and any keyboard shortcut behavior must keep working unless the shortcut exists purely for that label; if the shortcut handler exists, keep it (just hide the hint).

### 1.2 Simplify the teacher sidebar
The teacher sidebar must show ONLY these three items (Turkish labels):
1. Kontrol Paneli
2. Öğrenci Yönetimi
3. Davet Kodları

Remove every other teacher nav item from the sidebar (e.g. Rehberlik). Do NOT delete the underlying pages/routes; only remove the nav links.
Exception: if the project has an admin-only "Yönetim" link (teacher/account management at /ogretmen/yonetim/ogretmenler), keep it visible ONLY for admin users, otherwise admins lose access to it. Render it as a clearly separate item below the three main ones.
Mobile navigation (drawer/bottom bar, if any) must reflect the same list.

### 1.3 Redesign the teacher dashboard (Kontrol Paneli)
- Remove ALL stat/summary cards and phrases such as "Toplam öğrenci", "Şubeler", counts of classes, etc. Search the whole dashboard for those strings and any similar aggregate widgets.
- Replace with a grid of class blocks (cards), one per class/şube, fetched from the database (reuse the existing query/helper that lists classes; keep ordering natural, e.g. 5-A, 5-B, 6-A...).
- Each block shows only the class name (large, centered or left-aligned, consistent with the existing design language). No student counts.
- Clicking a block navigates to that class's student list (reuse the existing per-class student list page/route; if it only exists as a filter on another page, link to it with the right query param).
- Grid: 1 column on mobile, 2 on small, 3 on lg, 4 on xl. Blocks must be keyboard-focusable links with visible focus and hover states.
- Remove the bottom-of-page shortcuts/buttons "Rehberlik notu ekle" and "Davet kodu" (and their wrapping section/headings).
- Handle empty state: if there are no classes, show a short Turkish message.

### Phase 1 acceptance
- grep confirms the strings "Ctrl+K" (as visible text), "Toplam öğrenci", "Rehberlik notu ekle" no longer render on the teacher dashboard.
- Sidebar shows exactly the 3 items (+ admin-only Yönetim).
- `npx tsc --noEmit` and `npm run lint` pass.

---------------------------------------------------------------------
## PHASE 2 — Messaging data model
---------------------------------------------------------------------
Add to prisma/schema.prisma (adapt relation fields to existing User/Student models if you want proper relations; keep the unique constraint and indexes):

```prisma
model Conversation {
  id            String    @id @default(cuid())
  kind          String    // "OGRENCI" = Ö-Ö-İ (teacher<->student) | "VELI" = Ö-V-İ (teacher<->parent)
  studentId     String    // the student this conversation is about
  teacherId     String    // teacher User.id
  participantId String    // the student's or parent's User.id
  lastMessageAt DateTime  @default(now())
  createdAt     DateTime  @default(now())
  messages      Message[]

  @@unique([kind, studentId, teacherId, participantId])
  @@index([teacherId, lastMessageAt])
  @@index([participantId, lastMessageAt])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  body           String
  createdAt      DateTime     @default(now())
  readAt         DateTime?    // set when the OTHER participant opens the conversation

  @@index([conversationId, createdAt])
}
```

Run `npx prisma db push` (this project uses db push, not migrations) and `npx prisma generate`. Do NOT run seed/setup/db:reset against any existing data. If you want demo conversations, add them to prisma/seed.ts only; do not execute the seed.

---------------------------------------------------------------------
## PHASE 3 — Messaging server actions (src/actions/messages.ts)
---------------------------------------------------------------------
Follow the existing server action conventions ("use server", validation, return shape). Implement:

1. `ensureConversation(kind, studentId, teacherId, participantId)`
   - upsert on the compound unique key.
   - Authorization (critical): the caller must be authenticated; use the existing `assertCanAccessStudent` for the student. Rules:
     * Teacher caller: kind may be OGRENCI or VELI; participantId must be the student's own account (OGRENCI) or one of that student's linked parent accounts (VELI); teacherId must equal the caller.
     * Student caller: kind must be OGRENCI; participantId must equal the caller; the student record must be the caller's own; teacherId must be an active teacher.
     * Parent caller: kind must be VELI; participantId must equal the caller; the student must be linked to this parent (via StudentParent); teacherId must be an active teacher.
   - Reject anything else with an error.

2. `sendMessage(conversationId, body)`
   - Load conversation; caller must be `teacherId` or `participantId`, otherwise throw.
   - trim body, reject empty, cap at 2000 chars, normalize line endings.
   - Create message and update `lastMessageAt` in one `$transaction`.
   - Rate limit: max 20 messages per user per minute (reuse the existing rate-limit helper if present; otherwise a small in-memory limiter consistent with the project's current approach, documented as single-process like the login limiter).

3. `fetchAndMarkRead(conversationId)`
   - Authorization same as above.
   - `updateMany` set `readAt = now` where `conversationId` matches, `senderId != caller`, `readAt is null`.
   - Return `{ me: callerId, messages }` ordered ascending by createdAt, last 200 messages.

4. `getUnreadCounts()` helper (or per-context variants) returning unread message counts for the caller, grouped as needed for badges (per student and kind for teachers; total for students/parents).

5. `listConversationsForUser()` for student/parent pages: conversations with the other party's name, last message preview, unread count.

All actions must only trust the session user, never user-supplied sender IDs.

---------------------------------------------------------------------
## PHASE 4 — Chat UI
---------------------------------------------------------------------
Create ONE shared client component `src/components/Chat.tsx` used by teacher, student, and parent pages.

Props: `conversationId: string`, `title: string`.

Behavior (WhatsApp-like):
- Bubble layout: my messages right-aligned with green background, the other party's left-aligned with white background and border. Rounded bubbles, max width ~75%, `whitespace-pre-wrap break-words`.
- Each bubble shows time (HH:mm, tr-TR). Group/date separators ("Bugün", "Dün", or date) between days.
- Read receipts on MY messages only: single check "✓" (gray) = sent/delivered, double check "✓✓" (blue) = read (`readAt` not null). Add an accessible label (aria-label "Gönderildi"/"Okundu").
- Input: textarea; Enter sends, Shift+Enter inserts newline; Send button disabled while pending or empty; clear input immediately on send (optimistic append with a temporary id, reconcile after reload).
- Live updates: poll `fetchAndMarkRead` every 4 seconds; skip polling while `document.hidden`; also refresh immediately when the tab becomes visible again. Clean up the interval on unmount.
- Auto-scroll to bottom on first load and when new messages arrive, but do NOT yank the scroll if the user has scrolled up to read history (only auto-scroll when already near the bottom, or when the user's own message is sent).
- Render message text as plain text only. Never use dangerouslySetInnerHTML.
- Loading and empty states in Turkish ("Henüz mesaj yok. İlk mesajı siz gönderin.").
- Fixed-height container (e.g. h-[70vh]) with scrollable message area; works on mobile.
- Match the project's existing Tailwind style and colors.

---------------------------------------------------------------------
## PHASE 5 — Pages and navigation
---------------------------------------------------------------------

### 5.1 Teacher side — student detail page top menu
When a teacher clicks a student, the student detail page has a top tab menu. Add two tabs to it:
- **Ö-Ö-İ** → teacher ↔ student chat. Route e.g. /ogretmen/ogrenci/[id]/ogrenci-mesaj (use the project's real student-detail route pattern).
- **Ö-V-İ** → teacher ↔ parent chat. Route e.g. /ogretmen/ogrenci/[id]/veli-mesaj.

Details:
- Ö-Ö-İ: resolve the student's linked user account; if the student has no account yet (no invite used), show a clear Turkish message ("Bu öğrenci henüz hesap oluşturmadı.") instead of a chat.
- Ö-V-İ: a student can have multiple parents (Anne, Baba, Diğer). Show a parent selector at the top (labels like "Anne", "Baba", "Diğer veli" using the existing relationship field), each with its own conversation and its own unread badge. If no parent account is linked, show a Turkish empty message.
- Both tabs show an unread-count badge when > 0. Opening the chat marks messages read (handled by `fetchAndMarkRead`).
- Highlight the active tab consistently with the existing tab styling.

### 5.2 Student panel
Add "Mesajlar" to the student navigation and a page at /ogrenci/mesajlar: list of teachers the student can write to (at minimum all active teachers; if the data model has a class–teacher relation, prefer that), existing conversations with last-message preview and unread badge, and the Chat view for the selected one. Starting a new conversation uses `ensureConversation`.

### 5.3 Parent panel
Add "Mesajlar" to the parent navigation and a page at /veli/mesajlar: if the parent has multiple children, a child selector; teacher selection as above; conversations list with unread badges; Chat view. Kind is always VELI.

### 5.4 Unread badge in navigation
Show a total unread badge next to "Mesajlar" in student and parent navs. Compute it server-side in the layout (no client polling needed beyond the page itself).

### 5.5 Auth on every page
Each page must call `requireUser([...allowed roles])` like existing pages do. A teacher must not be able to open another role's route and vice versa.

---------------------------------------------------------------------
## PHASE 6 — Tests and docs
---------------------------------------------------------------------
Add vitest tests (follow the existing test setup in tests/) covering at least:
- A user who is not a participant cannot send to or read a conversation.
- A parent cannot create a conversation for a student they are not linked to.
- A student cannot create a VELI conversation.
- `fetchAndMarkRead` marks only the other party's messages as read, and the sender's own messages stay unread by themselves.
- Empty and over-length bodies are rejected; rate limit triggers after 20 messages/min.

Update README.md and UYGULAMA_NOTLARI.md: new sidebar, new dashboard behavior, messaging feature (roles, routes, read receipts, 4s polling, rate limit, security rules), and note that polling can later be replaced by SSE/WebSocket and that SQLite/in-memory limiter are single-process.

---------------------------------------------------------------------
## FINAL VERIFICATION (must all pass)
---------------------------------------------------------------------
Run and fix until clean:
- `npx prisma generate`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`

Then manually sanity-check via `npm run dev` (do not reseed existing data): teacher dashboard shows class blocks, sidebar has 3 items, Ö-Ö-İ / Ö-V-İ tabs appear on a student page, a message sent as teacher appears for the student with single tick and turns to double blue tick after the student opens it.

## RULES
- Do not break existing features. Pages removed from the sidebar must still exist and work.
- Do not delete or reset the database. Never run `db:reset`, `setup`, or `db:seed` against existing data.
- Do not commit secrets or modify .env.
- Keep changes minimal outside the described scope; match existing code style.
- No new heavy dependencies; use what is already installed.

## FINAL REPORT FORMAT
End with: (1) list of files created/modified, (2) any assumptions you made (route names, role names, schema relations), (3) anything you could not complete and why, (4) the exact commands I should run to apply the schema change on my machine.