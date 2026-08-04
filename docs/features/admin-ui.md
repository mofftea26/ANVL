# Admin UI

ANVL Studio ("/admin") is the CMS admin shell. It is **not** a seven-route "Slim CMS" anymore — the categorized sidebar (`adminNav.ts`, `src/features/admin/components/adminNav.ts`, the single IA source) currently lists **17 nav items across 8 categories** (Dashboard · Design · Content · Commerce · Passports · Gamification · Media · Settings), plus a handful of routes that don't appear in the sidebar (login, per-category landing pages, a nested passport-content wizard). Every editor route renders inside `AdminLayout layout="workspace"` → `AdminWorkspace` (primary column + sticky `AdminRailPanel` at `≥1280px`).

## Routes (from `adminNav.ts` + `src/routes/admin/`)

| Category | Route | Purpose |
|---|---|---|
| Dashboard | `/admin` | One-screen control room — every surface one strike away |
| Design | `/admin/theme` | 15-token palette + `dataTheme` mode, live preview |
| Design | `/admin/fonts` | Heading / body / display typeface families |
| Content | `/admin/content` | Landing copy — per-scene copy overrides with designed defaults |
| Content | `/admin/about` | About page — hero, orbs (free-form sections), marquee |
| Content | `/admin/story` | Story saga — chapters, acts, cast (relational) |
| Content | `/admin/coming-soon` | Pre-launch site mode — reveal copy, countdown, capture, assets, SEO |
| Content | `/admin/legal` | Privacy / terms / cookies / accessibility copy |
| Content | `/admin/support` | FAQ, contact, shipping, returns, care + size guides |
| Commerce | `/admin/shop` | Shop layout, product cards, filters, sort, PDP toggles |
| Commerce | `/admin/products` | Per-product PDP editorial content + assets |
| Commerce | `/admin/techpacks` | Ingest supplier techpack PDFs, review parsed reads, publish images |
| Passports | `/admin/passports` | Per-unit QR passports — generate, track claims, print sheets, passport content |
| Gamification | `/admin/gamification` | Ranks, challenges, Forge XP, badges |
| Media | `/admin/assets` | Media library + general/per-drop slot assignments |
| Settings | `/admin/analytics` | Analytics/marketing tags (GA4, GTM, Meta Pixel, Hotjar), SEO defaults |
| Settings | `/admin/settings` | Session + local reset |

Auxiliary routes not represented in the sidebar nav:
- `/admin/login` — sign-in (own layout, no `AdminLayout` shell — see below).
- `/admin/category/$categoryKey` — per-category landing tile page generated from `adminCategoryHref()`; redirects to `/admin` for unknown slugs.
- `/admin/passports/content/$slug` (`passports_.content.$slug.tsx`) — the per-product passport-content wizard, opened from within `/admin/passports`.

Sync: `AdminSyncIndicator` + `AdminWorkspaceStatusPanel` show Supabase vs local target. Saves flush via `cmsWriteThrough` (immediate) or `adminCmsRemoteSync` (850 ms debounce).

---

## Sign-in (`/admin/login`)

- **Route:** `src/routes/admin/-adminLogin.tsx` (`AdminLoginPageRoute`).
- **Password:** `IconButton` toggle (`Eye` / `EyeOff`, `aria-pressed`, `aria-label`) shows plain text vs masked input; 44×44 target matches `IconButton` defaults.
- **Supabase Auth only:** Auth is Supabase-only — there is no static env-file password gate (removed 2026-07-04, see technical debt SEC-01/02/03 in `CLAUDE.md`). After GoTrue returns a session, the app waits for the bearer token to attach and reads `public.cms_profiles` (`useAdminAuth` / `AdminAuthProvider`). Only a user with an `admin` row in `public.cms_profiles` for their Auth `user_id` can use the panel.
- **Remember me:** Controls session persistence; sessions persist across reload (Supabase storage key `anvl.supabase.admin.v1`).
- **Remote CMS sync:** After sign-in, workspace data pulls in the background; `AdminLayout` shows a sync banner until localStorage hydration finishes.

## Settings / danger zone

- **Route:** `/admin/settings` (`src/routes/admin/-adminSettings.tsx`).
- **Local CMS reset:** Primary control is destructive, full-width (`max-w-xl`), ≥44px touch height, `focus-ring`. Opening it shows the shared `Modal` from `src/shared/components/ui/`.
- **Gate:** Two plain-text confirmation fields that must simply match each other (no comparison against a stored password or Supabase secret) — confirm is disabled until they match. This clears the browser's cached CMS working copy only; **remote Supabase data is untouched**.
- Cancel, backdrop, and Escape close without resetting. Non-matching input uses inline `FormField` errors.

## Global chrome (`AdminTopbar`, sidebar footer)

- **`AdminLayout`** (`src/features/admin/components/AdminLayout.tsx`): shell, grid, and main column use `min-h-[100dvh]` (dynamic viewport height) so the admin floor matches mobile browser chrome; `main` uses modest `pb-8` (with `lg:py-10`).
- **`AdminSidebar`** (desktop `lg:flex` column, `src/features/admin/components/AdminSidebar.tsx`): `lg:self-start lg:sticky lg:top-0` with `h`/`min-h`/`max-h` `100dvh` so the rail stays viewport-sized. Renders the 8 categories from `adminNavCategories()`, collapsible to an icon rail (preference in `anvl.adminSidebar.v1`); drawer below `lg`.
- **`AdminTopbar`** (`src/features/admin/components/AdminTopbar.tsx`): sticky document header with mobile nav trigger, micro label "ANVL Admin", optional signed-in label (`AdminTopbarSessionChip`), primary page title + optional description from `AdminLayout`, and trailing `admin-page-actions` from `AdminPageActionsContext`.
- **Page actions API:** `AdminPageActionsProvider`-equivalent context wraps the `/admin` route `Outlet` (`src/routes/admin/route.tsx`). Routes call `useAdminPageActions()` inside `useEffect` (`setActions(<Fragment/>)` + cleanup `setActions(null)`).
- **Sidebar footer:** `AdminSidebar` anchors **View storefront** (opens `/` in a new tab) and **Logout** (`useAdminAuth().logout`) under `border-t`.

## Shared admin primitives

Consolidated UI building blocks that still exist under `src/features/admin/components/`:

| Primitive | Role |
|-----------|------|
| **`AdminCard`** | Base bordered/shadow card shell used across editor panels. |
| **`AdminForgedLink`** | Router or external links with forged CTA / outline / icon variants (`adminForgedLinkStyles.ts`). |
| **`AdminConfirmDialog`** | `Modal` + title + body + Cancel/Confirm footer (two-way destructive confirms). |
| **`AdminChoiceDialog`** | Three-way decision modal — primary ("Save"), secondary ("Discard"), cancel ("Continue editing"); same `Modal` foundation as `AdminConfirmDialog`. |
| **`AdminPromptDialog`** | Small prompt modal: title, one labeled `Input` (initial focus), optional extra `Select` choice, Confirm/Cancel. |
| **`AdminLoadingState`** | `AdminSpinner` + message (auth gate, list loading). |
| **`AdminEditorLoading`** | In-content pending state for lazy admin child routes — renders inside the persistent shell's scroll area so switching editors never blanks the sidebar/topbar. |
| **`AdminEntityCard`** | Shared chrome for an editable entity card (title + Save/Delete + delete-confirm), wraps `AdminCard` — used by list-of-records editors (story acts, cast, chapters). |
| **`AdminFieldSelect`** | Wraps `@/shared/components/ui/Select`, adding a synthetic "none" option (Radix rejects an empty-string item value) for fields like "All products" / "Unassigned". |
| **`AdminRangeField`** | Labeled range slider (label shows the live value) — admin config sliders. |
| **`AdminSaveAction`** | Icon-only Save control for the `AdminTopbar` page-actions slot — floppy icon, spinner while saving, check flash on success, copper "unsaved" dot while dirty. |

**Form controls are the shared storefront kit, not admin-only wrappers.** Admin editors import `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `FormField`, `IconButton`, `Modal` directly from `src/shared/components/ui/` (same components the storefront uses) — there are no admin-specific `AdminButton` / `AdminSelect` / `AdminDropdownMenu` wrapper components anymore. See **Removed (historical)** below.

**No shadcn registry** — the project has its own primitives; style new controls to match `AdminCard` rim/shadow tokens.

## Non-goals

- `AdminCard` uses border + shadow hover only (`motion-safe` / `motion-reduce`); the shell does not translate. Some admin list rows use a small `focus-ring` hover-lift utility from `src/styles.css`, automatically suppressed under `prefers-reduced-motion: reduce`.

---

## Removed (historical)

**The drop-builder admin CMS (`/admin/drops`, act editor, live drop preview) was removed 2026-06-07.** Landing pages are code-owned; see `docs/landing-pages.md` and `docs/cms-architecture.md`. There is no `/admin/drops` route, no drops list, no drop editor, and no `anvl_drops` table today — everything below is historical context only, kept because some primitives it introduced outlived the feature (and some did not).

- **Drops list / drop editor UI** (`DropsAdminList`, `DropRowOverflowMenu`, `DropEditorRoute`, `DropActsBuilderPanel`) — all gone along with the feature.
- **`@tanstack/react-table`** — used to drive the old drops-list desktop table. Removed under **PERF-11** (2026-06-11); not a dependency anymore (verify against `package.json`).
- **`react-day-picker`** and the admin-specific **`AdminDateTimeField`** / **`AdminDateField`** popovers — removed under **PERF-11** (2026-06-27) once the drop release/schedule fields that used them went away.
- **`react-colorful`** and the admin-specific **`ColorField`** — removed under **PERF-11** (2026-06-27); the theme editor uses the shared palette-token UI instead.
- **`AdminButton`, `AdminInput`, `AdminTextarea`, `AdminCheckbox`, `AdminSelect`, `AdminDropdownMenu`, `AdminNativeSelect`, `AdminStatusBadge`, `AdminPanel`, `AdminEmptyState`, `AdminFormField` / `AdminFieldLabel`, `AdminMicroHeading`, `AdminMediaThumbPlaceholder`** — none of these admin-only wrapper primitives exist in the current tree. Admin editors now use the shared `src/shared/components/ui/` kit directly (see **Shared admin primitives** above).
- `@radix-ui/react-dropdown-menu` was also removed under PERF-11; the `AdminDropdownMenu`/`AdminSelect` Radix wrappers went with it. Current admin `Select`/menu needs are met by the shared UI kit (`@radix-ui/react-select` and `@radix-ui/react-popover` remain dependencies for `AdminPopover`/`AdminFieldSelect`-style compositions).
