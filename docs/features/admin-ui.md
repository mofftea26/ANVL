# Admin UI primitives

## Settings / danger zone

- **Route:** `/admin/settings` (`src/routes/admin/-adminSettings.tsx`).
- **Local CMS reset:** Primary control is **destructive**, **full-width** (max `max-w-xl` on wide layouts), **≥44px** touch height, **`focus-ring`**, with **no ellipsis** (labels wrap). Opening it shows the shared **`Modal`**: forged **inset rim + shadow** tokens aligned with **`AdminCard`**, **`aria-describedby`** on the summary copy.
- **Gate:** Reset runs only after **two password fields** match each other **and** pass **`verifyAdminPassword`** (`src/features/admin/auth/adminAuth.storage.ts` — same comparison as login against build-time `VITE_ANVL_ADMIN_PASSWORD`). **Cancel**, backdrop, and **Escape** close without resetting. Wrong or non-matching input uses **inline** `FormField` errors; submit stays **disabled** until the gate passes.

## Buttons

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

## Menus / dropdowns

- **Implementation:** `src/features/admin/components/AdminDropdownMenu.tsx` wraps Radix primitives with oath-dark tokens (`--color-bg`, `--color-line`, `--color-chip`, inset shadow aligned with **`AdminCard`**). Prefer this for admin menus instead of pulling the full shadcn registry; no **`components.json`** required for this primitive-only install.

## Non-goals

- Dashboard card primary links remain **`DashboardCardCtaLink`** (and similar link CTAs) where the global CTA / `AdminCard` hover contract applies.
