# Task: Frontend redesign — Birikim Kutusu (visual and UX only)

## Context

You are working on **Birikim Kutusu**, an existing Turkish school management app. Do NOT scaffold a new project and do NOT change the stack.

- Next.js 15.1 App Router, React 19, TypeScript, Tailwind CSS 3.4, `lucide-react`, `recharts`
- Prisma/SQLite backend, cookie-session auth, server actions in `src/actions/*`
- Roles: `TEACHER` / `STUDENT` / `PARENT` (each has its own panel under `/ogretmen`, `/ogrenci`, `/veli`)
- **All UI text must be in Turkish.**
- The app has a strict CSP (`next.config.mjs`): `font-src 'self' data:`, `img-src 'self' data: blob:`, `connect-src 'self'`. Do NOT load fonts, icons, scripts or images from any CDN. Use `next/font` (self-hosted) only.

Read these first: `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/constants.ts`, `src/components/AppShell.tsx`, `src/components/AuthShell.tsx`, `src/components/StudentGrid.tsx`, `src/components/BookCorner.tsx`, `src/components/ExamSessionView.tsx`, `src/components/ExamDonutView.tsx`, `src/components/ExamSessionPuanChart.tsx`, `src/app/ogretmen/page.tsx`, `src/app/ogrenci/page.tsx`, `src/app/veli/page.tsx`, `src/app/login/*`.

## Scope rules (important)

- **Visual and UX changes only.** Do not change server actions, auth logic, Prisma schema, route paths, or form field names. The only allowed backend addition is a read-only student search endpoint for the command palette (Phase 7).
- Do not break the print layout: the exam print page (`.../deneme/[examId]/yazdir`) and `.print-sheet` / `@media print` rules in `globals.css` must render exactly as before. Anything new in shared shells must be `print:hidden` where the current one is.
- Keep Server Components as the default. Add `"use client"` only where interactivity requires it.
- Add dependencies sparingly; allowed: `clsx`, `tailwind-merge`, `class-variance-authority`, `sonner`, `cmdk`, Radix primitives (via shadcn/ui, Tailwind v3-compatible setup). No UI kits that need a Tailwind v4 migration.

## Problems found in the current UI (fix these)

1. Many labels use `text-[10px]`/`text-[11px]`/`text-[12px]` and `text-slate-400` on white (about 2.6:1 contrast, fails WCAG AA 4.5:1). Parents and students mostly use phones.
2. `AppShell` has a fixed `w-56` sidebar with no responsive behavior; on mobile it eats the screen.
3. The brand color is applied through inline `style={{ background: RED }}` in many components; there is only one brand shade in the Tailwind config.
4. System font stack only; no visual hierarchy between page title, section title and body.
5. No loading, empty, or error states; destructive actions have no confirmation dialog.
6. Dashboards show raw numbers without context; student cards show only name and number.

## Design direction

Clean, warm, school-friendly; not corporate-gray. Keep the Birikim red (`#c1272d`) as the single accent.

- **Brand scale:** extend `tailwind.config.ts` `birikim` with 50–900 (keep `DEFAULT: #c1272d`, `dark`, `light`, `track` for backward compatibility). Derive chart colors in `src/lib/constants.ts` from the same values so recharts and Tailwind never drift.
- **Neutrals:** page background `#f6f7f9` (slightly warm), cards white with `border-slate-200/70` and a very soft shadow. Radius: `rounded-xl` for cards, `rounded-lg` for controls, `rounded-full` for badges/avatars.
- **Typography:** load **Plus Jakarta Sans** (or Inter) with the `latin` and `latin-ext` subsets via `next/font/google`, applied on `<body>` through a CSS variable and `fontFamily.sans` in Tailwind. Body 15px, helper text min 13px. **No text below 12px anywhere.** Page title `text-2xl font-bold`, section title `text-base font-semibold`.
- **Text colors:** body `slate-800`, secondary `slate-600`, muted `slate-500`. Never use `slate-400` for text (icons/borders only).
- **Interaction:** visible `focus-visible` rings (brand color), min 40px tap targets on mobile, hover/active states on every clickable element, transitions 150ms, respect `prefers-reduced-motion`.

## Phases (one commit per phase)

### Phase 1 — Foundation
- Tailwind tokens, `next/font`, `globals.css` base styles (body size, selection color, focus ring, scrollbar), utility `cn()` in `src/lib/utils.ts`.
- Create `src/components/ui/`: `Button` (primary/secondary/ghost/danger, sizes, loading state), `Card`, `Badge` (neutral/success/warning/danger/brand), `Input`/`Select`/`Textarea` with label + error + hint, `Tabs`, `Skeleton`, `EmptyState` (icon, title, description, optional action), `PageHeader` (title, subtitle, actions), `StatCard` (label, value, delta, icon), `ConfirmDialog` (Radix AlertDialog), `Toaster` (sonner, mounted in root layout).
- Replace inline `style={{ background: RED }}` and hard-coded hex values in components with token classes. Keep the exported constants only where recharts needs hex.

### Phase 2 — Responsive app shell
- Rebuild `AppShell` (keep its props: `user`, `sections`, `pageTitle`, `children`; keep logout and "all devices" actions).
- Desktop (≥1024px): sticky sidebar `w-64`, brand logo, grouped nav with icons, active item with brand-50 background and a left accent bar; user chip with avatar, name, role/title at the bottom.
- Tablet/mobile teacher panel: top bar with a hamburger that opens a slide-over drawer containing the same nav.
- Mobile student and parent panels: fixed **bottom tab bar** (max 5 items, icon + 12px label, safe-area padding) instead of a drawer.
- Header shows page title and, for teachers, a search button (opens the command palette in Phase 7).
- Everything in the shell stays `print:hidden`.

### Phase 3 — Auth pages (`/login`, `/login/[rol]`, `/kayit`, `/kayit/[rol]`)
- `AuthShell`: split layout on desktop (left: brand panel with logo, school name and a short motto/illustration made with CSS/SVG, no external images; right: form card); single column on mobile.
- Role selection as large cards with icon, title, description and hover state.
- Forms: show/hide password toggle, inline field errors, a pending state on the submit button via `useFormStatus`, autofocus on the first field, proper `autocomplete` attributes. If the registration form already has an invite-code field, render it as a monospace, uppercase, letter-spaced input.
- Do not change form field names or action wiring.

### Phase 4 — Teacher dashboard and student lists
- `/ogretmen`: greeting + date, row of `StatCard`s (students, classes, this week's absences, unread/new notes), a **"Dikkat gerektirenler"** list (students with rising absences, a falling latest exam net, or other signals you can derive from existing queries — read-only, computed from existing data), class overview cards, quick actions.
- `StudentGrid` cards: avatar, name, class and number, small badges (absence count, latest exam net with ▲/▼ change), selected state with brand ring. Add a search box and class filter chips above lists (client-side filtering).
- Student detail page tabs (Devamsızlık, Deneme Analizi, Rehberlik, Kitap Köşesi): use the new `Tabs`, sticky on mobile, with counts in badges.

### Phase 5 — Exam analysis and charts
- Update styling of `ExamSessionView`, `ExamDonutView`, `ExamSessionPuanChart`, `ExamSessionList` to the new tokens.
- Add a **radar chart** of per-subject net (recharts `RadarChart`), a **net trend line** with latest value emphasized, and delta chips (green ▲ / red ▼) on lists.
- Tooltips in Turkish with 1-decimal numbers; consistent chart colors from the brand scale; charts must be responsive (`ResponsiveContainer`).
- The print page output must remain unchanged.

### Phase 6 — Book Corner, notes, absences
- `BookCorner`: bookshelf grid of cover cards (cover image or generated gradient placeholder with initials), status chip (Okunuyor/Okundu/Planlandı), page-progress style bar when pages are known, star rating, hover actions. Quotes as typographic cards with a large quote mark, source and book chip, favorite heart toggle.
- Notes (guidance notes): timeline-style list with author avatar/title, "Yeni" badge for unread, visibility chip ("Öğrenciye açık"/"Gizli").
- Absences: compact table on desktop, card list on mobile, month grouping.
- All destructive actions use `ConfirmDialog` (replace any `window.confirm`). Success/error feedback via `sonner` toasts.

### Phase 7 — Student and parent panels, command palette
- `/ogrenci`: friendly summary cards (books read, latest exam, absences, unread notes) with clear empty states.
- `/veli`: mobile-first; child switcher as a horizontal avatar/segmented control; summary cards per child; shared notes list.
- Teacher **command palette** (Ctrl/Cmd+K, `cmdk`): search students by name/number across all classes and jump to their page. Add a read-only route handler `GET /api/students/search?q=` guarded by `requireUser(["TEACHER"])`, max 10 results, returning only `id, name, no, class name, photoUrl`. Rate-limit it using the existing limiter. This is the only allowed backend addition.

### Phase 8 — States, polish, accessibility
- `loading.tsx` skeletons for the main route segments (`/ogretmen`, `/ogrenci`, `/veli`, student detail), `error.tsx` and `not-found.tsx` pages in Turkish with a way back.
- Empty states for every list (no students in class, no books, no notes, no absences).
- Accessibility pass: labels on all inputs, `aria-label` on icon-only buttons, `aria-current="page"` on active nav, heading order, keyboard operability of drawer/dialog/palette, contrast ≥ 4.5:1 for text.
- Optional (only if everything else is done): dark mode with `next-themes` and CSS variables.

## Acceptance checklist

- [ ] No `text-[10px]`/`text-[11px]` left; no `text-slate-400` used for text.
- [ ] No inline `style={{ background: RED }}` left except where a chart library needs a hex value.
- [ ] All pages usable at 375px, 768px and 1280px widths without horizontal scroll; student/parent panels use a bottom tab bar on mobile, teacher panel uses a drawer.
- [ ] Fonts are self-hosted (`next/font`); no CSP violations in the browser console on any page.
- [ ] Exam print page looks identical to before (compare before/after PDF or screenshot).
- [ ] Every destructive action asks for confirmation; every list has an empty state; main routes have loading skeletons.
- [ ] All three role demo accounts can still log in and use every existing feature (`npm run setup` demo data).
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run build` pass.

## Process

Work phase by phase, one commit per phase. If Playwright is available, take screenshots of each main page at 375/768/1280px before and after, and an axe accessibility check; otherwise list the pages you could not verify visually. At the end, report: files changed/added, new dependencies, and anything you intentionally skipped.
