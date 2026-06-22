# Admin UI

Slim CMS: seven routes (dashboard, theme, fonts, assets, content, story, settings) + login. Every editor uses `AdminLayout layout="workspace"` → `AdminWorkspace` (primary column + sticky `AdminRailPanel` at `≥1280px`).

| Route | Editor | Rail |
|---|---|---|
| `/admin` | Active landing page picker | Status + quick help |
| `/admin/theme` | 15-token palette + preview | Live preview + WCAG contrast |
| `/admin/fonts` | Font families | Type preview |
| `/admin/assets` | Media library + slot assignment | Slot controls |
| `/admin/content` | Landing copy + flexible Oath tenets + scene asset fields | Overrides help |
| `/admin/story` | Chapters / acts / cast (relational) | Saga model help |
| `/admin/settings` | Session + local reset | Status + about |

Sync: `AdminSyncIndicator` + `AdminWorkspaceStatusPanel` show Supabase vs local target. Saves flush via `cmsWriteThrough` (immediate) or `adminCmsRemoteSync` (850 ms debounce).

---

## Sign-in (`/admin/login`)

- **Route:** `src/routes/admin/-adminLogin.tsx` (`AdminLoginPageRoute`).
- **Password:** **`IconButton`** toggle (**`Eye` / `EyeOff`**, **`aria-pressed`**, **`aria-label`**) shows plain text vs masked input; **44×44** target matches **`IconButton`** defaults.
- **Supabase Auth:** `/admin/login` uses **`signInWithPassword`**. After GoTrue returns a session, the app waits for the bearer token to attach, reads **`public.cms_profiles`** with retries (**`adminSupabaseAuthFlow.ts`**), and only then sets React session state. **Logout** (sidebar) calls **`signOut`**, disposes the admin browser client, and clears legacy keys. Sessions **persist across reload** (Supabase storage key **`anvl.supabase.admin.v1`**).
- **First admin user:** Supabase Auth alone is not enough — an **`admin`** row in **`public.cms_profiles`** for that user's Auth **`user_id`** (create in Supabase Dashboard → SQL Editor while signed in as project owner).
- **Remote CMS sync:** After sign-in, workspace data pulls in the **background**; **`AdminLayout`** shows a sync banner until localStorage hydration finishes. Auth bootstrap no longer blocks the admin shell on the full Supabase pull.

## Settings / danger zone

- **Route:** `/admin/settings` (`src/routes/admin/-adminSettings.tsx`).
- **Local CMS reset:** Primary control is **destructive**, **full-width** (max `max-w-xl` on wide layouts), **≥44px** touch height, **`focus-ring`**, with **no ellipsis** (labels wrap). Opening it shows the shared **`Modal`**: forged **inset rim + shadow** tokens aligned with **`AdminCard`**, **`aria-describedby`** on the summary copy.
- **Gate:** When **Supabase env is set**, reset requires **two matching confirmation fields** (any shared secret — typically the same password used for Supabase sign-in); it does **not** use `VITE_ANVL_ADMIN_PASSWORD`. **Legacy (no Supabase):** reset runs only after two fields match **and** pass **`verifyAdminPassword`** (`src/features/admin/auth/adminAuth.storage.ts` — same comparison as login against build-time `VITE_ANVL_ADMIN_PASSWORD`). **Cancel**, backdrop, and **Escape** close without resetting. Wrong or non-matching input uses **inline** `FormField` errors; submit stays **disabled** until the gate passes.

## Global chrome (`AdminTopbar`, sidebar footer)

- **`AdminLayout`** (`src/features/admin/components/AdminLayout.tsx`): shell, grid, and main column use **`min-h-[100dvh]`** (dynamic viewport height) so the admin floor matches mobile browser chrome; **`main`** uses modest **`pb-8`** (with **`lg:py-10`**) so the page doesn’t leave a tall empty band on desktop; toast clearance stays on the global **`sonner`** **`Toaster`** (**`AppProviders`**: `offset` / `mobileOffset`).
- **`AdminSidebar`** (desktop **`lg:flex`** column): **`lg:self-start lg:sticky lg:top-0`** with **`h` / `min-h` / `max-h` `100dvh`** so the rail stays viewport-sized and does not stretch to match a very tall **`main`** row (grid default **`stretch`**). Nav links, footer actions, and auth are unchanged. Mobile **`Drawer`** copy still uses **`density="drawer"`**; the panel remains **`h-[100dvh]`** (`Drawer.tsx`).
- **`AdminTopbar`** (`src/features/admin/components/AdminTopbar.tsx`): sticky document header with mobile nav trigger, **micro label `ANVL Admin`**, optional **signed-in label** (Supabase: **`session.displayName`** from Auth **`user_metadata`** keys such as `full_name` / `name` / `display_name`, else email local-part; legacy: **`username`**) on the row above the page title, **primary page title + optional description** from **`AdminLayout`**, and trailing **`admin-page-actions`** from **`AdminPageActionsProvider`**. **`--admin-topbar-height`** in **`src/styles.css`** approximates this block for layout math (e.g. drop editor live preview **`min-height`**).
- **Page actions API:** `AdminPageActionsProvider` wraps the **`/admin`** route **`Outlet`** (`src/routes/admin/route.tsx`). Routes call **`useAdminPageActions()`** and **`useEffect`** (`setActions(<Fragment/>)` + cleanup `setActions(null)`). **`useAdminPageActionsSlot()`** is read-only for layout/tests.
- **Sidebar footer:** **`AdminSidebar`** anchors **View storefront** (opens `/` in a new tab, **`focus-ring`**, **≥44px** height) and **Logout** (same **`useAdminAuth`** `logout` as before) under **`border-t`**, freeing the top bar’s trailing cluster for route actions only.

## Shared admin primitives (2026-05)

Consolidated UI building blocks live under `src/features/admin/components/`:

| Primitive | Role |
|-----------|------|
| **`AdminForgedLink`** | Router or external links with forged CTA / outline / icon variants (`adminForgedLinkStyles.ts`). Replaces duplicated `Link` + long `className` strings on dashboard, drops list, products index. |
| **`AdminStatusBadge`** | CVA status chips (`dropStatusBadgeTone` for drop lifecycle). |
| **`AdminFormField`** / **`AdminFieldLabel`** | Oath-dark label rhythm (`stacked`, `filter`, `micro`). Prefer over storefront `FormField` in `/admin`. |
| **`AdminConfirmDialog`** | `Modal` + title + body + Cancel/Confirm footer (drops list lifecycle modals). |
| **`AdminPanel`** | Toolbar / inset / filter shells (lighter than full `AdminCard`). |
| **`AdminLoadingState`** | `AdminSpinner` + message (auth gate, list loading). |
| **`AdminEmptyState`** | Empty list card + optional forged CTA; **`AdminMediaThumbPlaceholder`** for catalog thumbs. |
| **`AdminMicroHeading`** | Uppercase sub-section labels in editor panels. |
| **`AdminNativeSelect`** | Native `<select>` with `adminStackedFieldClass` for long/dynamic option lists (catalog filters). |

**Page actions:** Product editor and website layout register Save / navigation in **`AdminTopbar`** via **`useAdminPageActions()`** (same pattern as drop editor) — no duplicate section-header action rows.

**No shadcn registry** — keep CVA + Radix wrappers (`AdminSelect`, `AdminDropdownMenu`, `AdminPopover`). Style new controls to match `AdminCard` rim/shadow tokens.

## Drops list / drop editor — **REMOVED**

The drop-builder CMS (`/admin/drops`, act editor, live preview) was removed 2026-06-07. Landing pages are code-owned; see `docs/landing-pages.md`. The sections below describing drops/products CMS editors are **historical** — kept for primitive reference only.

## Buttons (historical context — primitives still valid)

- **Implementation:** `src/shared/components/ui/Button.tsx` (CVA + `forwardRef`) is the canonical control. **`AdminButton`** in `src/features/admin/components/AdminButton.tsx` re-exports it so admin routes import from the feature boundary.
- **Tokens:** Variants use CSS variables from `src/styles.css` (`--color-bg`, `--color-surface`, `--color-line`, `--color-text`, `--color-heading` / bone via accent pairings, `--color-accent`, `--color-text-muted`, `--color-chip`). These align with `data-theme="oath-dark"` on admin shells.
- **Focus:** Every variant includes the global **`focus-ring`** class (`outline` + `:focus-visible` using `--color-accent`).
- **Motion:** Pressable styles rely on global `button` rules in `src/styles.css` (`filter: brightness` on hover, reduced-motion clamp). Tab variants do not add extra transforms.
- **Segmented tabs:** `variant` values **`adminTabList`**, **`adminTabEditor`**, and **`adminTabProduct`** expect **`data-active="true" | "false"`** so selected vs idle states stay in one place.

## Drops list (`/admin/drops`)

- **Layout:** Redundant **`AdminSectionHeader`** strip was removed here — context stays in **`AdminTopbar`** + a compact **toolbar card** (`--color-line`, `--color-surface-soft`) with search, status tabs (segmented **`AdminButton`** pills), square **`Plus`** link (**`focus-ring`**, **`aria-label="Create new drop"`**), and **View site**.
- **Table:** **`@tanstack/react-table`** drives desktop rows with client sort on Campaign title, slug, status (live-first), dates, counts, **Last edited** (default desc), sticky header, zebra/active tint, and **`cursor-col-resize`** handles on headers (sizes not persisted).
- **Row actions:** **`DropRowOverflowMenu`** — **`AdminButton`** **`ghost`** **`compact`** trigger (**`MoreVertical`**, **`aria-label`** per row) opens **`AdminDropdownMenu`** (Radix **`@radix-ui/react-dropdown-menu`**) with forge styling + **`admin-dropdown-menu-content`** motion only when **`prefers-reduced-motion: no-preference`** (`src/styles.css`).
- **Mobile:** Same overflow menu on **`AdminCard`** headers; row order follows the sorted table model.

## Drop editor (`/admin/drops/:id`)

- **Toolbar:** No **`AdminSectionHeader`** strip — document title + status/error chips stay in **`AdminTopbar`** via **`AdminLayout`**. Primary controls register into the top bar as **`IconButton`** controls (**`RotateCcw`**, **`Trash2`**, **`Save`** / **`Check`** flash, **`aria-label`**, **`focus-ring`**, **44×44** targets): **Reset**, **Delete**, **Save** (disabled when validation blocks persistence). Each opens the shared **`Modal`** (**never `window.confirm()`**): **Reset** — “Discard unsaved changes?” (copy explains defaults restore); **Delete** — destructive confirm (**`AdminButton`** **`destructive`** on confirm); **Save** — “Commit changes to storage?” with persistence summary plus **`AdminCheckbox` Activate this drop after saving** (same helper text as before; drives **`saveDrop(..., { makeActive })`**). The drops index still has its own activate/archive flow.
- **Form controls:** **`AdminInput`** / **`AdminTextarea`** (`src/features/admin/components/AdminInput.tsx`), **`AdminDateTimeField`** (`AdminDateTimeField.tsx`), **`AdminCheckbox`** (`AdminCheckbox.tsx`), and **`AdminSelect`** share the oath-dark admin field chrome. **`MediaPickerField`** (`src/shared/components/ui/MediaPickerField.tsx`) shares the same URL-row chrome and uses **`AdminSpinner`** for embed loading. The current editors — **Theme** (`site-theme/`), **Fonts** (`site-font/`), **Assets** (`site-assets/`), **Content** (`landing-content/`), and **Story** (`story/`) — use these primitives instead of ad-hoc `<input>` chrome where practical.

## Menus / dropdowns

- **Implementation:** `src/features/admin/components/AdminDropdownMenu.tsx` wraps Radix primitives with oath-dark tokens (`--color-bg`, `--color-line`, `--color-chip`, inset shadow aligned with **`AdminCard`**). Prefer this for admin menus instead of pulling the full shadcn registry; no **`components.json`** required for this primitive-only install.

## Select fields

- **Implementation:** `src/features/admin/components/AdminSelect.tsx` wraps **`@radix-ui/react-select`** with the same forged surface tokens / shadows as **`AdminDropdownMenu`**. Use for compact enumerated fields (currency, status, origin) instead of native `<select>` where the oath-dark chrome matters — e.g. **Quick create product** on **`DropEditorRoute`**.

## Date & time pickers

- **Implementation:** **`AdminDateTimeField.tsx`** (UTC ISO / `Date`, optional **`clear`**, minute **`timeStepMinutes`**) and **`AdminDateField.tsx`** (**`YYYY-MM-DD`** string, optional **`clear`**). Both mount **`AdminPopover.tsx`** (**`@radix-ui/react-popover`**) with **`AdminCard`/`AdminSelect`**-grade rim + shadow tokens (**`z-[85]`**, oath-dark **`--color-*`**). Calendars use **`react-day-picker` v9** (`adminCalendarSkin.ts`, `react-day-picker/style.css`), **`focus-ring`** navigation, and **`motion-reduce`**-friendly hovers.
- **Persistence contract:** Store **UTC ISO timestamps** on the wire (`toISOString()`). The calendar + 24h selects reflect the **browser’s local wall clock**, matching the old **`<input type="datetime-local>`** behavior (`adminDateTime.ts` + inline footer on the datetime popover).
- **Call sites:** **`DropEditorRoute`** (Basics release), **`DropsAdminList`** (schedule modal), **`ProductEditorRoute`** (release/sale windows), **`/admin/products` index** (**Updated from / to** filters keeps `YYYY-MM-DD` filter strings).

## Non-goals

- **`AdminCard`** uses **border + shadow** hover only ( **`motion-safe` / `motion-reduce`**); the shell **no longer translates**. Dashboard **`DashboardCardCtaLink`** (and similar **`focus-ring`** row-height links) uses the global **–1px** CTA hover lift from **`src/styles.css`** (still suppressed automatically when **`prefers-reduced-motion: reduce`**).
