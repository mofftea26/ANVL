## 2026-05-20 — Admin nav drawer at all breakpoints

- **`AdminLayout`:** Removed persistent `lg:grid-cols-[280px_1fr]` sidebar column; main content is full width at every breakpoint. Nav opens via the shared left `Drawer` (focus trap, Escape, backdrop click, route-change close via `onNavigate`).
- **`AdminTopbar`:** Burger menu button is always visible (removed `lg:hidden`).
- **`Drawer` / `styles.css`:** Slide-in + backdrop fade animations gated on `prefers-reduced-motion: no-preference`.
- **Tests:** `AdminLayout` (no persistent aside, burger opens drawer, nav link closes), `AdminTopbar` (burger not `lg:hidden`).

## 2026-05-20 — Admin sidebar chip nav (desktop / drawer parity)

- **`AdminSidebar`:** Nav links use shared `adminChipButtonVariants` pills (`primary` when active); removed secondary badge pills (Overview, System, …) and desktop-only descriptions.
- **Footer:** “View storefront” and Logout both use chip styling (`AdminTopbarChipButton` / chip link classes).
- **Layout:** Persistent `lg:` sidebar and mobile drawer share the same compact nav chrome; section cluster labels stay muted uppercase.
- **Tests:** `AdminSidebar` asserts badge pills are absent and active route uses `aria-current="page"`.

## 2026-05-20 — Admin CMS chip field controls (shared `cmsFieldStyles`)

- **`cmsFieldStyles`:** Pill / soft-surface tokens aligned with `adminChipButtonVariants` — `adminFieldControlClass`, `adminFieldTextareaClass`, `adminSelectTriggerClass`, clear-button + compact row helpers.
- **Primitives:** `AdminInput`, `AdminTextarea`, `AdminSelect`, `AdminNativeSelect`, `AdminCheckbox`, `AdminDateField`, `AdminDateTimeField` use shared classes; dropdown panels stay elevated/readable.
- **Pickers:** `ColorField` compact row + fine inputs, `MediaPickerField` URL row, media library search inherit chip chrome.
- **Tests:** `cmsFieldStyles`, `AdminSelect` trigger chrome, updated `ColorField` / `MediaPickerField` class assertions.

## 2026-05-20 — Drop editor status badge dedupe

- **`DropEditorRoute`:** One emerald **Live** chip when the drop is storefront-active; otherwise CMS status only (Draft, Scheduled, …). Removed redundant **ACTIVE** + **Active drop** pair.
- **`DropAdminListCard`:** Same single-badge rule; removed extra **Storefront drop** label.
- **`AdminStatusBadge`:** `size="chip"` (`h-9`) for topbar alignment; shared `dropStatusBadgeLabel` helper; live tone tokens aligned with chip `success` variant.

## 2026-05-20 — Admin CMS pill chip buttons (shared variants)

- **`adminChipButtonStyles`:** CVA tokens (`default`, `primary`, `destructive`, `ghost`, `success`) + `icon` size for overflow/menu triggers.
- **`AdminTopbarChipButton`:** `variant`, `size`, `loading`; re-exports class helpers.
- **`AdminButton`:** `primary` / `secondary` / `ghost` / `destructive` render as chips; tab variants still use shared `Button`.
- **Migrated:** Editor topbars (variant props), `AdminSaveBar`, `AdminConfirmDialog` footers (via `AdminButton`), drops overflow trigger, forged/outline/icon links, `AdminSecondaryExternalLink`.
- **Tests:** Chip variant coverage on `AdminTopbarChipButton`, `AdminButton`, `adminChipButtonStyles`.

## 2026-05-20 — Act preset registry + GSAP scroll animations (PR-8 / PERF-12 RESP-15)

- **`act-presets/`:** Registry maps `nature × preset` → lazy storefront renderers for all seven existing act natures; defaults align with CMS builder seeds.
- **`useActScrollReveal`:** Shared ScrollTrigger helper gated on `(min-width: 768px) and (prefers-reduced-motion: no-preference)`; mobile shows static final state.
- **Presets:** Default wrappers for legacy sections (`HeroForgeSequence`, `OathStampSequence`, etc.) plus alternate layouts (`splitProduct`, `splitText`, carousel, specs grid, split waitlist, …).
- **`PublicLandingActs`:** Registry lookup by `act.nature` + `act.preset` (fallback to nature default); `vite.config.ts` **`act-presets`** manual chunk.

## 2026-05-20 — Admin drops list card grid (all breakpoints)

- **`DropsAdminList`:** Removed desktop TanStack Table; drop cards render in a responsive grid (`1` / `sm:2` / `xl:3` columns) at every breakpoint.
- **Sort:** Column-header sorting replaced with a **Sort by** dropdown (default **Last edited (newest)**); logic extracted to **`dropsListSort.ts`**.
- **`DropAdminListCard`:** Card UI extracted from the list page; active drops keep a subtle emerald border tint.

## 2026-05-20 — Admin topbar chip actions + drop activate toggle

- **`AdminTopbarChipButton`:** Shared pill control (`h-9`, `rounded-full`, `surface-soft`) for topbar actions and session chip.
- **`DropEditorRoute`:** Reset / Delete / Save / Activate|Deactivate use chip buttons; activate toggle calls `setAdminActiveDrop` / `deactivateAdminDrop` with confirm dialogs.
- **`ProductEditorRoute`:** Catalog / Save / Delete topbar actions use chip styling.
- **Backend:** `deactivateDrop`, `clearStorefrontActiveDrop`, `deactivateAdminDrop` on CMS client + `useDeactivateAdminDropMutation`.

## 2026-05-20 — Admin drops list card redesign

- **`DropAdminListCard`:** Campaign grid cards with right-aligned emblem watermark (gradient scrim), optional theme-accent wash, live storefront styling, and preserved overflow menu + metadata.
- **`AdminDropListItem`:** List mappers now include `emblemImageUrl` and `themeAccent` from drop visuals/theme (localStorage + Supabase).

## 2026-05-20 — CMS editor actions in admin topbar

- **Pattern:** All CMS editors register Save / Reset / Delete via `useAdminPageActions()` + `AdminTopbarChipButton` pills in the `admin-page-actions` slot (reference: `DropEditorRoute`).
- **Migrated:** `ProductEditorRoute` (Catalog, Save, Delete), `SiteSeoEditor`, `SiteLayoutEditor` (inline validation alert when save blocked), `SiteThemeEditor`.
- **Removed:** Sticky bottom `AdminSaveBar` from site SEO, layout, and brand-fallbacks editors.
- **Tests:** Topbar slot coverage for product + site editors; layout validation error + disabled save.

## 2026-05-20 — Admin mobile nav control styling

- **`AdminTopbar`:** Mobile menu button matches session chip — `h-9`, `rounded-full`, `bg-[var(--color-surface-soft)]`, muted 14px icon (replaces square `IconButton`).

## 2026-05-20 — Drop functional gaps (PR-7 / MAINT-20)

- **DB:** Migration **`20260620130000_cms_scheduled_activation.sql`** — `_cms_publish_drop_core`, **`cms_process_scheduled_drops()`** (service_role; Edge/cron — pg_cron not used); refactors **`cms_publish_drop`** to delegate to core.
- **Admin sync:** **`scheduleDropActivation`** already writes **`status: scheduled`** + **`scheduled_activation_at`** via **`buildAnvlDropRemoteRow`** (Vitest coverage added).
- **Storefront:** **`PublicLandingActs`** product showcase uses act **`productIds`** when set; otherwise first six products.


- **DB:** Migration **`20260620120000_cms_media_assets.sql`** — `cms_media_assets` catalog with RLS (CMS read; editor/admin write).
- **Admin:** `MediaLibraryPage` grid (search, mime filters, inline alt, copy URL, delete confirm), drag-drop upload to `cms-media` + catalog row.
- **Sync:** `flushAdminCmsRemoteSync` patches **`storefront_publication.media_index`** from the catalog.
- **Picker:** `MediaPickerField` optional **Browse library** modal; `uploadCmsMediaFile` supports `registerInCatalog`.

## 2026-05-20 — Site SEO editor + structured data (PR-5 / MAINT-21)

- **`SiteSeoEditor`:** Defaults / Pages tabs, char-count meta fields, live Google + Twitter preview, sticky **`AdminSaveBar`**.
- **Persistence:** **`saveSiteSeoContentAsync`** write-through to **`storefront_publication.site_seo`**.
- **Storefront:** **`buildSeoHeadForSiteStaticPath`** merges **`site_seo.staticPages`** on `/`, `/shop`, `/about`, `/size-guide`.
- **JSON-LD:** **`dropStructuredDataJsonLd`** on homepage (when active drop sets type) and drop route.

## 2026-05-20 — Brand fallbacks editor redesign (PR-4 / MAINT-21)

- **`SiteThemeEditor`:** hero strip, side-by-side emblem tiles, read-only active drop palette swatches, sticky **`AdminSaveBar`**.
- **Nav:** Site item renamed **Brand fallbacks** (badge **Global**).
- **Route shell:** `-adminTheme.tsx` delegates to `src/features/admin/site-theme/`.
- **Storefront:** `previewLoadingSrc` test confirms drop emblems win over global fallbacks.

## 2026-05-20 — Site Layout editor redesign (PR-3 / RESP-15)

- **`SiteLayoutEditor`:** tabbed Header / Footer / Announcement panels; sticky **`AdminSaveBar`**; live **`SiteLayoutPreview`** (lg+ column, mobile `<details>`).
- **Route shell:** `-websiteLayoutRoute.tsx` delegates to feature module under `src/features/admin/site-layout/`.
- **Copy:** trimmed `/drop/` campaign slot helper text; save moved off topbar page actions.

## 2026-05-20 — Admin topbar + CMS copy trim (PR-2 / MAINT-21)

- **`AdminTopbarSessionChip`:** compact account pill with menu (storefront, settings, logout).
- **Topbar:** single-line title, no duplicate “ANVL Admin” + username row; description only on Dashboard.
- **Copy:** shortened nav descriptions, trimmed site route helper text (SEO, Media, Theme, Settings, Drops list).

## 2026-05-20 — Supabase CMS single source of truth (PR-1 / MAINT-20)

- **`cmsPersistenceMode`:** `shouldStorefrontUseLocalCmsFallback()` — public site never reads admin `localStorage` when `VITE_SUPABASE_*` is set; sync helpers use `canWriteCmsDraftsToSupabase` (`editor` + `admin`).
- **Write-through:** `cmsWriteThrough.afterLocalCmsMutation()` + `saveWebsiteLayoutContentAsync` / `saveGlobalBrandSettingsAsync` flush to Supabase on explicit Save (layout + brand fallbacks).
- **Storefront sync:** `storefrontCmsSync` returns seed snapshot on Supabase-configured browsers until publication hooks resolve (no draft leakage).
- **Admin:** Re-hydrates CMS from Supabase on window focus / tab visible when signed in.
- **DB:** Migration **`20260620100000_storefront_site_drafts.sql`** — `storefront_publication.media_index` placeholder for Media library (PR-6).

## 2026-05-20 — Admin CMS UI primitives consolidation (full pass)

- Summary: Added reusable admin UI primitives and completed a five-step CMS UI pass: (1) migrated `ProductEditorRoute`, website layout, settings, login, and products filters to `AdminFormField` / `AdminInput` / `AdminSelect` / `AdminNativeSelect` / `AdminCheckbox`; (2) `AdminConfirmDialog` on drop editor save/reset/delete and product delete; (3) `DropActsBuilderPanel` uses `AdminPanel`, `AdminFieldLabel`, `AdminMicroHeading`; (4) `motion-safe` transitions on `AdminPanel`, `Modal`, `AdminConfirmDialog`; (5) trimmed redundant `AdminSectionHeader` strips — product/website editors register actions in `AdminTopbar` via `useAdminPageActions`. Vitest coverage for core primitives. See `docs/features/admin-ui.md`.

## 2026-05-19 — Storefront acts + drop theme follow published snapshot

- **Landing acts:** Public `composeLandingPageFromDrop` prefers **`Drop.acts`** (acts builder) when non-empty, then falls back to **`landingActSequence`**. **`LandingPageCmsContent.dropActs`** carries full act rows so **`PublicLandingActs`** overlays copy on `/` (same path as drop editor **`draftActs`**).
- **Theme/colors:** Published drop palette CSS targets `:root[data-theme="oath-dark"]` so it overrides static defaults in `styles.css`; theme style tag keys off drop id + `updatedAt` for reliable updates after publish.

## 2026-05-19 — Fix cms_publish_drop UUID error + sync drops table actions

- **DB:** Migration **`20260519230000_cms_publish_drop_client_drop_ids.sql`** — `cms_publish_drop` resolves product **`dropIds`** via **`anvl_drops.client_drop_id`** (fixes `invalid input syntax for type uuid: "drop_the-oath"` on save/activate when products link to drops).
- **Drops list:** Duplicate, schedule, archive, and delete now **`flushAdminCmsRemoteSync`** before the list refetches Supabase (actions were local-only until debounced sync).
- **Edge:** **`publish-storefront`** accepts app **`Drop.id`** (`client_drop_id`) or UUID PK.

## 2026-05-19 — Create new drop inserts `anvl_drops` row before editor

- **`/admin/drops/new`:** **`createDraftDropAsync`** saves default draft values locally, inserts into **`public.anvl_drops`** immediately when Supabase is configured, invalidates the admin drops list, then redirects to **`/admin/drops/:dropId`**. Remote insert failure rolls back the local draft and shows an error.

## 2026-05-19 — Fix cms_profiles timeout on admin sign-in

- **Role read:** After `signInWithPassword`, `cms_profiles.role` is fetched via PostgREST with the sign-in **access token** (bypasses GoTrue `getSession` lock when bootstrap is still running on the same storage key).
- **Session:** Calls `setSession` from the sign-in response before CMS hydration; stale bootstrap work aborts when the admin client is disposed.
- **Supabase setup:** If sign-in succeeds but access is still denied, ensure a row exists: `INSERT INTO public.cms_profiles (user_id, role) VALUES ('<auth-user-id>', 'admin') ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;` — RLS policy `cms_profiles_select_self` already allows `SELECT` where `auth.uid() = user_id`.

## 2026-05-19 — Fix admin sign-in spinner stuck (auth client lock)

- **Login:** Disposes in-memory Supabase client before sign-in so a hung bootstrap `getSession` cannot block `signInWithPassword`. Sign-in and `cms_profiles` role read use **20s / 12s timeouts**; errors surface instead of infinite loading.
- **Bootstrap:** When `getSession` times out, drops the in-memory client and recreates it for subsequent login.

## 2026-05-19 — Fix Supabase "No API key found in request"

- **Clients:** All browser Supabase clients set an explicit **`apikey`** header via **`createAnvlSupabaseClient`**. Admin singleton recreates when URL/key changes.
- **Env:** Rejects placeholder keys (`sb_publishable_...`); **`getSupabaseEnvIssue()`** shows setup instructions on admin login when URL is set but the key is missing/invalid.
- **`.env.example`:** Removed misleading placeholder publishable key.

## 2026-05-19 — Fix admin sign-in hang + persist session across reload

- **Auth:** `onAuthStateChange` clears session only on **`SIGNED_OUT`** (not every null session event). Login skips slow **`getSession`** retries when **`signInWithPassword`** already returned a user; role check is single-shot on login.
- **Bootstrap:** When **`getSession`** times out but **`anvl.supabase.admin.v1`** has tokens, falls back to **`getUser()`** to restore the session without clearing storage.
- **Tab close:** No **`pagehide`** / tab-close logout — session persists until explicit sidebar logout.

## 2026-05-19 — Admin UX: session persistence, publish-on-save, media upload, button loading

- **Auth:** Bootstrap **`getSession`** waits up to **20s** without clearing **`anvl.supabase.admin.v1`** on timeout; provider watchdog **120s** disposes in-memory client only (session tokens preserved for refresh).
- **Drop editor:** Header **Active** badge reads **`storefront_publication.active_drop_id`** via **`useDropLiveOnStorefront`**. Save publishes when the drop is already live (not only “Activate after saving”). Validation errors switch tab + scroll to **`data-drop-field`** targets.
- **Preview:** Live preview iframe uses fixed max height so acts do not stretch when the builder column is tall.
- **Media:** Visual + OG pickers upload to Supabase **`cms-media`** at **`drops/{slug}/{role}-{timestamp}.{ext}`** when configured.
- **UI:** Shared **`Button`** **`loading`** prop (inline spinner) on login + save modal; media picker uses inline loader during upload/embed.
- **Tests:** **`uploadCmsMedia`**, **`Button`**, **`dropEditorValidationNavigation`**, auth bootstrap + preview layout expectations updated.

## 2026-05-19 — Fix `anvl_drops_single_active` on CMS sync / activate

- **Sync:** Before upserting drops, demote stale **`status = 'active'`** rows in Supabase, then upsert **non-active first, active last** so the partial unique index is never violated.
- **Tests:** **`adminCmsRemoteSyncOrder`**.

## 2026-05-19 — Admin drops: backend live status + save loading

- **Drops list:** When Supabase is configured, **Live/active** badge reads **`storefront_publication.active_drop_id`** (not localStorage). Hydration normalizes **`isActive`** for all drops from that row.
- **Activate / save+activate:** **`cms_publish_drop`** demotes other actives on the server; local storage rehydrates after publish so only one drop stays active.
- **Drop editor save modal:** Shows **Saving…** spinner, awaits **flush + publish**, then closes the modal.
- **Tests:** **`adminCmsDropsList`**.

## 2026-05-19 — Admin + storefront: drop publish path + stale session UX

- **Auth:** Stale-session banner only when **`anvl.supabase.admin.v1`** had tokens before GoTrue timed out (avoids false alarm on cold login).
- **Admin drops:** Save with **Activate after saving** and reset of the active drop call **`cms_publish_drop`**; activate mutation invalidates storefront publication cache.
- **Storefront:** **`useStorefrontActiveDrop`** + **`ActiveDropThemeProvider`** read published drop theme from Supabase; **`useLandingCms`** no longer falls back to admin localStorage when Supabase is configured.
- **Tests:** **`useStorefrontActiveDrop`**, bootstrap/auth storage coverage updated.

## 2026-05-19 — Cleanup: remove unused bootstrap ops + tab-close helper

- **Removed:** **`scripts/bootstrap-cms-admin.mjs`**, **`supabase/scripts/`**, migration **`20260519180000_cms_profiles_bootstrap_fn.sql`**, **`adminTabCloseCleanup`** (unused after explicit logout-only auth). **`.env.example`** trimmed to URL + publishable key only.
- **Docs:** **`supabase-cms.md`**, **`admin-ui.md`**.

## 2026-05-19 — Admin: fix Supabase bootstrap timeout (stale session / hanging getSession)

- **Auth:** **`readBootstrapAdminSession`** — single **`getSession`** with **8s** timeout; clears **`anvl.supabase.admin.v1`** when GoTrue hangs (common after switching anon ↔ publishable keys). Watchdog **20s**; **`detectSessionInUrl: false`** on admin client.
- **Helpers:** **`resetAdminSupabaseBrowserClient`**, **`withTimeout`** on profile reads.
- **Tests:** **`adminSupabaseAuthFlow`**, bootstrap provider tests updated.

## 2026-05-19 — Fix duplicate GoTrue client (remove `shared/lib/supabase.ts`)

- **Removed:** **`src/shared/lib/supabase.ts`** — duplicate `createClient` (tutorial pattern); ANVL uses **`getAdminSupabaseBrowserClient`** + **`getSupabasePublicationAnonClient`** instead.
- **Auth client:** Admin singleton stored on **`globalThis`** so Vite HMR does not warn about multiple **`anvl.supabase.admin.v1`** GoTrue instances.
- **Tests:** **`adminSupabaseBrowserClient.test.ts`**.

## 2026-05-19 — Env: publishable key only (`VITE_SUPABASE_PUBLISHABLE_KEY`)

- **App:** **`getSupabasePublicEnv`** prefers **`VITE_SUPABASE_PUBLISHABLE_KEY`** over legacy **`VITE_SUPABASE_ANON_KEY`**; error copy updated. **`.env.example`** trimmed to URL + publishable key.
- **Tests:** **`supabasePublicEnv.test.ts`**.
- **Docs:** **`supabase-cms.md`**, **`AGENTS.md`**.

## 2026-05-19 — Ops: `pnpm bootstrap:cms-admin` (service role, no SQL CREATE)

- **Script:** **`scripts/bootstrap-cms-admin.mjs`** upserts **`cms_profiles`** via **`SUPABASE_SERVICE_ROLE_KEY`** when Dashboard SQL hits **`permission denied for schema public`** or RLS on direct **`INSERT`**.
- **Package:** **`pnpm bootstrap:cms-admin -- <auth-user-uuid>`**.
- **DB:** Migration grants **`service_role`** DML on **`cms_profiles`**.
- **Docs:** **`supabase-cms.md`**, **`admin-ui.md`**, bootstrap SQL comments.

## 2026-05-19 — Supabase: `bootstrap_cms_profile` RPC (RLS-safe admin row)

- **DB:** Migration **`20260519180000_cms_profiles_bootstrap_fn.sql`** — **`SECURITY DEFINER`** **`bootstrap_cms_profile(uuid, text)`** so first admin row can be created from SQL Editor (direct **`INSERT`** hits RLS **`42501`**).
- **Ops:** **`supabase/scripts/bootstrap-cms-admin-profile.sql`** updated (use **`SELECT bootstrap_cms_profile(...)`**, not Table Editor insert).
- **Docs:** **`supabase-cms.md`**, **`admin-ui.md`**.

## 2026-05-19 — Admin: fix Supabase sign-in after GoTrue session + cms_profiles gate

- **Auth:** New **`adminSupabaseAuthFlow.ts`** — wait for session attach, retry **`cms_profiles`** read, assert admin role, pull CMS in background. Login no longer blocks on full hydration; **`ProtectedAdminRoute`** gates on auth only; **`AdminLayout`** shows sync/error banners.
- **Removed:** **`pagehide`** auto-logout (broke reload and raced bootstrap). Logout is explicit via sidebar only.
- **Errors:** Access-denied copy includes Auth **`user_id`** + sample **`INSERT INTO cms_profiles`** SQL.
- **Ops:** **`supabase/scripts/bootstrap-cms-admin-profile.sql`** for first admin row.
- **Tests:** **`adminSupabaseAuthFlow.test.ts`**; bootstrap test retained.
- **Docs:** **`admin-ui.md`**, **`supabase-cms.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Docs: `.env.example` Supabase publishable vs anon

- **Env:** Clarified that **`VITE_SUPABASE_ANON_KEY`** or **`VITE_SUPABASE_PUBLISHABLE_KEY`** is enough (same resolver as **`getSupabasePublicEnv`**).

## 2026-05-19 — Admin: Supabase bootstrap timeout + tab-close guard

- **Auth:** **`pagehide`** cleanup runs only after **`isHydrated`** (avoids racing bootstrap). Bootstrap timeout sets **`timedOut`** so a slow **`getSession`** cannot overwrite session state after the watchdog fires. Timer handle typing uses **`number`** for **`window.setTimeout`** (Windows/ DOM typings).
- **Tests:** **`AdminAuthProvider.bootstrap.test.tsx`** (hang + no-session paths).
- **Docs:** **`docs/features/admin-ui.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Admin: show/hide password on sign-in

- **UI:** `/admin/login` password field includes an **`IconButton`** visibility toggle (**`Eye` / `EyeOff`**, **`aria-pressed`**).
- **Tests:** `-adminLogin.test.tsx`; **`getSupabasePublicEnv`** mocked in **`-adminSettings.test.tsx`** so reset-modal labels stay deterministic when **`.env`** enables Supabase.
- **Docs:** `docs/features/admin-ui.md`.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Admin: sign out when browser tab closes

- **Auth:** While a CMS session exists under **`AdminAuthProvider`**, a **`pagehide`** listener (skips **`persisted`** BFCache) runs **`runAdminTabCloseSessionCleanup`**: Supabase **`signOut`** + dispose client + **`clearAdminSession`** for legacy keys. Same path runs on full unload/reload (not on in-app TanStack navigation away from `/admin`).
- **Tests:** **`adminTabCloseCleanup.test.ts`**.
- **Docs:** **`docs/features/admin-ui.md`**, **`docs/features/supabase-cms.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Supabase: single publication anon client (GoTrue warning)

- **App:** `publicStorefrontPublication` uses **`getSupabasePublicationAnonClient`** (per-URL singleton + **`auth.storageKey` `anvl.supabase.storefront-public.v1`**) instead of creating a new **`createClient`** on every fetch — removes **“Multiple GoTrueClient instances”** when TanStack Query refocuses alongside other Supabase usage.
- **Tests:** `publicStorefrontPublication.test.ts` (singleton assertion).
- **Docs:** `docs/features/supabase-cms.md`.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Admin: fix stuck loading + top bar display name

- **Auth:** Supabase bootstrap always ends in **`try/finally`** so **`isHydrated` / `isRemoteCmsReady`** run even when **`cancelled`** mid-await (e.g. React Strict Mode) or after early **`return`** from hydration errors — fixes endless “Loading admin…”.
- **Session:** Supabase sessions include **`displayName`** from Auth **`user_metadata`** (`full_name`, `name`, `display_name`, …) or email local-part (**`adminDisplayName.ts`**).
- **UI:** **`AdminTopbar`** shows the signed-in label; **`ProtectedAdminRoute`** loading copy distinguishes sync vs redirect; **Settings** user line uses display name + email.
- **Tests:** **`adminDisplayName.test.ts`**, **`AdminTopbar.test.tsx`**.
- **Docs:** **`docs/features/admin-ui.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Fix admin hydration: `site_seo.staticPages` + clearer CMS role errors

- **CMS:** `storefront_publication.site_seo` blobs with `staticPages` keys set to `null` / `undefined` no longer break `saveSiteSeoContent` / Supabase hydration (Zod 4 enum-key `z.record` required every path). Sanitize via **`sanitizeStaticPagesLoose`** + **`z.unknown().transform(...)`** in **`siteSeo.local.ts`**.
- **Auth:** **`fetchCmsProfileRole`** returns **`{ role, selectError }`**, normalizes **`role`** with trim + lowercase, surfaces PostgREST errors; login uses **`formatCmsAdminAccessDeniedReason`** for targeted copy (RLS vs missing row vs editor/viewer).
- **Tests:** **`siteSeo.local.test.ts`**, **`adminCmsProfileRole.test.ts`**, **`adminCmsPublish.test.ts`** mock shape.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Admin: `cms_profiles` role read after Supabase sign-in

- **Auth:** `fetchCmsProfileRole` accepts an optional Supabase **`user.id`** so login and session restore query **`public.cms_profiles`** immediately (same **`role = admin`** gate); avoids an extra **`getUser()`** when the id is already known.
- **Tests:** `adminCmsProfileRole.test.ts`.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Storefront: Supabase reads with local/seed offline fallback

- **Reads:** `useLandingCms` and `useHomeProducts` prefer published Supabase data when `VITE_SUPABASE_*` is set, then SSR loader data, then the **existing** local/seed storefront (`storefrontReadFallback.ts`). Avoids replacing the live site with seed-only when the backend is down or unpublished.
- **Commerce:** `commerceClient.supabase` falls back to `localStorageCommerceClient` in the browser and `seedCommerceClient` on SSR when publication fetch fails.
- **Runtime:** Supabase CMS slice fallbacks use `getStorefrontOfflineLandingCms` / `getStorefrontOfflineActiveDrop` instead of seed-only on the client.
- **Tests:** `storefrontReadFallback.test.ts`.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Supabase: publish on activate + lock down cms_publish_drop RPC

- **App:** **`publishStorefrontDropByClientId`** flushes debounced CMS sync, resolves **`anvl_drops.id`** by **`client_drop_id`**, then calls **`cms_publish_drop`** when an admin sets the active drop (storefront reads **`published_drop_snapshot`** immediately).
- **DB:** Migration **`20260519120000_revoke_anon_cms_publish_drop.sql`** revokes **`anon`** / **`PUBLIC`** execute on **`cms_publish_drop`** (authenticated admins only).
- **Tests:** **`adminCmsPublish.test.ts`**.
- **Docs:** **`docs/features/supabase-cms.md`** (auth + publish flow).
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Supabase: admin Auth (admin role) + debounced CMS writes

- **DB:** Migration **`20260518220000_anvl_drops_client_id_admin_rls.sql`** — **`anvl_drops.client_drop_id`** (stable app `Drop.id`), idempotent **`storefront_publication`** catalog columns, **admin-only** INSERT/UPDATE/DELETE RLS on **`anvl_drops`**, **`cms_admin_products`**, and **`storefront_publication`** updates; **`cms_publish_drop`** now requires **`cms_profiles.role = admin`** (catalog snapshot refresh preserved).
- **App:** When **`VITE_SUPABASE_*`** is set, **`AdminAuthProvider`** uses Supabase **`signInWithPassword`**, **`hydrateAdminCmsFromSupabase`**, and **`scheduleAdminCmsRemoteSync`** after saves (drops / products / layout / site SEO / global brand). Legacy **`VITE_ANVL_ADMIN_*`** remains when Supabase env is absent. **`ProtectedAdminRoute`** waits for remote hydration; **`/admin/settings`** shows Supabase email and uses a dual-field confirmation for local reset when Supabase is on.
- **Tests:** **`adminCmsProfileRole.test.ts`**.
- **Docs:** **`docs/features/supabase-cms.md`**, **`docs/features/admin-ui.md`**, **`AGENTS.md`**, **`docs/audit-2026-05-17.md`**, **`.env.example`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Supabase: publication catalog snapshot + storefront commerce read path

- **Schema:** Migration **`20260518140000_storefront_publication_catalog.sql`** adds **`products_snapshot`**, **`catalog_drop_index`**, **`global_brand`**, **`campaigns`**, **`lookbook`**, **`legacy_landing_cms`** on **`storefront_publication`**; **`cms_publish_drop`** now aggregates **`cms_admin_products`** into **`products_snapshot`** and rebuilds **`catalog_drop_index`** from **`anvl_drops`** referenced by product **`dropIds`**.
- **App:** **`publicStorefrontPublication`** selects/normalizes the new columns (Zod parity with **`persistedProductSchema`**, catalog index, global brand merge, campaigns/lookbook). **`supabaseCommerceClient`** serves **`CommerceClient`** from the published projection on SSR and CSR when Supabase env is set (**`createRuntimeClients`**). **`supabaseStorefrontReaders`** uses layout for announcement bar and publication rows for campaigns/lookbook when present. Root loader / theme bridge can consume published **`globalBrand`**.
- **Bootstrap:** **`tools/genBootstrapSql.mjs`** / **`tools/oath-bootstrap.sql`** reset and set the new publication columns for idempotent Oath seeds.
- **Docs / DX:** **`.env.example`**, **`storageKeys.ts`** mapping comment, **`docs/features/drops-cms.md`**, **`docs/features/supabase-cms.md`**, **`publicStorefrontPublication.test.ts`** (extended normalization cases).
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Supabase: published storefront CMS + Edge publish stubs

- **Backend / CMS:** Added tracked migration **`supabase/migrations/20260518120000_anvl_cms_core.sql`** (`storefront_publication`, `anvl_drops`, `cms_profiles`, `cms_admin_products`, RLS, **`cms_publish_drop`** RPC). Edge Functions **`publish-storefront`** (forward JWT → RPC) and **`medusa-webhook-stub`** (shared secret placeholder).
- **App:** When **`VITE_SUPABASE_URL`** + anon key are set, **`createRuntimeClients`** overlays Supabase **public read** slices for CMS landing/active drop, **website layout**, and **SEO** via **`publicStorefrontPublication`** (Zod parity with **`persistedDropSchema`** / layout schema). Admin list/mutations still use existing local adapters. **`tsconfig`** excludes **`supabase/functions/**`** from `tsc`.
- **Docs / tests:** **`docs/features/supabase-cms.md`**, **`publicStorefrontPublication.test.ts`**, **`parseSiteSeoUnknown`** helper, **`seedSeoResolutionContext`** export.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: ViewportIframe fills shell height

- **UX:** **`ViewportIframe`** iframe uses **`flex-1 min-h-0 h-full max-w-full w-full`** (no **`62dvh`/`760px`** cap) so it consumes the **`drop-editor-viewport-iframe-shell`** height inside the gradient card; **`justify-start`** stays **top-aligned**. Shell adds **`overflow-hidden`** to reduce double-scrollbar risk.
- Files: **`DropEditorLivePreview.tsx`**, **`__tests__/DropEditorLivePreview.test.tsx`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Storefront: single active-drop resolver + live theme provider

- **Storefront:** Added **`storefrontCmsSync`** so SSR (`SEED_DROP` / `SEED_WEBSITE_LAYOUT`) and browser (`localStorage` CMS) resolve the active drop + layout the same way for composed landing content, seed **`CmsClient` / `SeoClient`**, homepage catalog picks, and related helpers. **`ActiveDropThemeProvider`** now owns the public **`:root`** palette `<style>` (id **`anvl-active-drop-theme`**) and subscribes to drop storage changes so theme/nav/footer stay aligned without relying on root loader re-runs.
- Files: **`src/features/cms/runtime/storefrontCmsSync.ts`**, **`publicLanding.ts`**, **`cmsClient.seed.ts`**, **`cmsClient.localStorage.ts`**, **`seoClient.seed.ts`**, **`products.commerce.ts`**, **`ActiveDropThemeProvider.tsx`**, **`__root.tsx`**, **`DropLoadingIndicator.tsx`**, **`storefrontCmsSync.test.ts`**, **`docs/features/drops-cms.md`**, **`docs/design-system.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: viewport iframe shell top-aligned

- **UX:** **`ViewportIframe`** shell (**`drop-editor-viewport-iframe-shell`**) uses **`justify-start`** so the iframe aligns to the **top** of the preview chrome (no vertical centering gap above).

## 2026-05-18 — Drop editor live preview: capped iframe box + shell letterboxing

- **UX:** After the **`ViewportIframe`** shell fix, **`height:100%`** on the iframe stretched the iframe to the full preview column, so **`svh`-based landing sections reflowed and the hero read “huge” on desktop.** Fix:** Shell stays **`flex-1 min-h-0 self-stretch`** with **`justify-start`**; iframe **`width`** stays Fit **`100%`** or device widths **390 / 820 / 1280**. **`height` / `max-height`** use Tailwind **`h-[min(62dvh,760px)] max-h-[…]`** (avoids jsdom stripping `min()` in React inline styles while matching browser intent); surplus shell letterboxes inside the gradient chrome.
- Files: **`DropEditorLivePreview.tsx`**, **`__tests__/DropEditorLivePreview.test.tsx`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.


- **RCA:** **`ViewportIframe`** rendered the **`<iframe>`** as the **direct flex item** of the preview row (`DropEditorLivePreview`). For replaced elements, **`height: 100%`** often **does not resolve** when the flex item’s used size is still tied to the **intrinsic default iframe height (~150px)** — so the live preview band collapsed while the builder column stayed tall. Separately, the **`layout="wide"`** content wrapper did not participate in a **`flex-1` / `min-h-0`** chain under **`main`**, so the split row could not reliably consume **remaining viewport height** below the top bar.
- **Fix:** Wrap the iframe in a **`flex-1 min-h-0 self-stretch`** shell (**`data-testid="drop-editor-viewport-iframe-shell"`**); iframe keeps **`h-full min-h-0 flex-1`** inside that shell. **`AdminLayout`** (`wide` only): **`main`** + inner **`max-w-[1600px]`** wrapper use **`flex flex-col flex-1 min-h-0`**. **`DropEditorRoute`** split: **`flex-1 min-h-0`** + **`xl:flex-nowrap`**. Dropped redundant **`max-h-full`** / **`h-full`** duplications on the iframe **`className`** in **`DropEditorLivePreview`** (height comes from the shell + inline **`height: 100%`**).
- Files: **`AdminLayout.tsx`**, **`DropEditorRoute.tsx`**, **`DropEditorLivePreview.tsx`**, **`__tests__/DropEditorLivePreview.test.tsx`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: `main` gutter in `min-h`, `xl` split row floor, tighter device shell

- **UX:** **`DROP_EDITOR_PREVIEW_PANE_MIN_H_CLASS`** and new **`DROP_EDITOR_SPLIT_XL_MIN_H_CLASS`** subtract **`--admin-main-block-gutter`** (**`3rem`**, in **`src/styles.css`**) from **`100dvh`** alongside **`--admin-topbar-height`** + safe-area so the preview lane matches “viewport below top bar + **main** breathing room.” On **`xl`**, the **split row** shares that **`min-h`** so a **short** builder stack still yields a tall preview column; **`items-stretch`** + builder **`xl:flex xl:h-full`** keep the **live preview** stack aligned with the **BASICS/THEME** tab row + forms when the rail grows. **`DropEditorLivePreview`** trims **`gap`/`p`** on the device shell; the **Live preview** **`AdminCard`** uses slightly tighter padding (**`!p-4` / `sm:!p-5`**) to reduce dead chrome.
- Files: **`src/styles.css`**, **`dropEditorRoute.shared.ts`**, **`DropEditorRoute.tsx`**, **`DropEditorLivePreview.tsx`**, **`DropEditorRoute.visuals.test.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor `xl` preview column: full stack height + iframe fills shell

- **UX:** Row stretch height applies to the **entire** preview column (**toolbar** + **AdminCard** chrome + body). **`DropEditorLivePreview`** uses **`overflow-hidden`** on the outer shell so scrolling stays **inside the iframe**; the iframe host row drops **`items-start`** so **`height:100%`** no longer leaves a **gray slab** under the device frame. **`AdminCard`** wraps **`children`** in **`min-h-0 flex-1`** so the live preview body participates in the height chain below the header.
- Files: **`DropEditorRoute.tsx`**, **`DropEditorLivePreview.tsx`**, **`AdminCard.tsx`**, **`DropEditorRoute.visuals.test.tsx`**.

## 2026-05-18 — Drop editor live preview: viewport `min-height` + `xl` row stretch

- **UX:** The **Live preview** column uses **`min-h-[calc(100dvh-var(--admin-topbar-height)-env(safe-area-inset-top,0px))]`** so the chrome fills roughly **one viewport below the sticky top bar** at every breakpoint; **`--admin-topbar-height`** (**`6.5rem`**) lives in **`src/styles.css`** as an apron for **`AdminTopbar`** (incl. description slot). On **`xl`**, **`h-full`** + **`self-stretch`** remain so when the **builder** rail is taller than that minimum, the **preview** column **matches the row height** (sash split unchanged; no builder column scroll traps).
- Files: **`src/styles.css`**, **`dropEditorRoute.shared.ts`** (**`DROP_EDITOR_PREVIEW_PANE_MIN_H_CLASS`**), **`DropEditorRoute.tsx`**, **`DropEditorRoute.visuals.test.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor `xl`: stretch preview + builder row, document-scroll forms

- **RCA:** **`xl:items-start`** on the split row matched preview height to short **Basics** content but left the **live preview** column visually shorter than the **builder** column when the form grew; nested **`min-h-0` / flex scroll chains** on the builder rail also encouraged **column-internal** scrolling instead of **`AdminLayout` `main`**.
- **Fix:** Restore **`xl:items-stretch`** on the **`xl`** split flex row; keep preview column **`min-h-0`** + **`xl:h-full`** **`AdminCard`** so **`DropEditorLivePreview`** still scrolls inside the preview chrome. Builder rail uses **`xl:overflow-visible`** and drops **`xl:min-h-0`**; tab **`AdminCard`**s (and **`DropActsBuilderPanel`**) pass **`h-auto min-h-0`** so cards **hug tab content** without a giant empty **Basics** plate.
- Files: **`DropEditorRoute.tsx`**, **`DropActsBuilderPanel.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: re-bootstrap on new iframe `Document`

- **RCA:** `readystatechange` was attached **once** (`if detachReadystate return`), so when `iframe` fired **`load`** again and the browser handed us a **fresh** `contentDocument`, the listener stayed on the **old**, detached `Document`. Meanwhile `bootstrappedRef` short-circuited **`bootstrap()`**, so we never recloned styles or re-pointed **`createPortal`** at the new **`body`** → **blank white frame** after reloads/hidden-preview/show cycles/engines that recreate the srcdoc document.
- **Fix:** Track **`wiredPreviewDocRef`** (`Document` identity): if `contentDocument` differs, run full bootstrap again; **rebind** `readystatechange` whenever the active iframe document changes; **try/finally** + **`bootstrapInFlight`** guard against re-entrant double head clears.
- **Tests:** `DropEditorLivePreview` asserts **`body`** contains **`[data-anvl-drop-preview-scope]`** before/after viewport toggle; second **`load`** after **`contentDocument` swap** must repopulate **`style[data-anvl-preview-reset]`** and the scope marker. **`minimalProps`** aligns with the route via **`editorPreviewHeroFallback: true`**.
- Files: **`DropEditorLivePreview.tsx`**, **`__tests__/DropEditorLivePreview.test.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Admin shell: trim main bottom padding (desktop)

- **RCA:** **`AdminLayout`** **`main`** used **`pb-28` / `lg:pb-32`**, which exaggerated the empty strip below page content on desktop. **Toasts** are already lifted via global **`sonner`** **`Toaster`** (`offset`, **`mobileOffset`**).
- **Fix:** **`pb-8`** / **`lg:pb-8`** alongside existing horizontal + top padding. **Regression:** mobile nav **`Drawer`** unchanged; long drop/product pages still scroll inside **`main`** as before.
- **Verify hardening:** Vitest **`testTimeout: 15s`** so parallel admin UI suites don’t flake at the default 5s; **`DropEditorRoute.products.test.tsx`** / **`newDropRoute.test.tsx`** avoid untyped **`jest-dom`** matchers under strict **`tsc`**.
- Files: **`AdminLayout.tsx`**, **`__tests__/AdminLayout.test.tsx`**, **`vitest.config.ts`**, **`DropEditorRoute.products.test.tsx`**, **`newDropRoute.test.tsx`**, **`docs/features/admin-ui.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Admin: `/admin/drops/new` without “Missing drop” flicker

- Summary: **`createDraftDrop`** could run while **`useDropsList`** had no active subscriber, leaving the hook’s snapshot stale so **`DropEditorRoute`** briefly rendered **Missing drop**. **Fix:** bump a persist generation at the start of **`persistDropsState`** so **`ensureSnapshots`** always refreshes after writes. **Bootstrap UX:** **`AdminSpinner`** + verified id before **`replace`** navigation; storage verify failure surfaces an alert + back link.
- Files changed: **`drops.persistGeneration.ts`**, **`drops.service.ts`**, **`useDrops.ts`**, **`-newDrop.tsx`**, **`useDropsList.cache.test.ts`**, **`-newDropRoute.test.tsx`**, **`src/test/setup.ts`** ( **`@testing-library/jest-dom`** ), **`vitest.config.ts`** ( **`maxWorkers` cap** ), **`docs/features/drops-cms.md`**, **`docs/changelog.md`**. Stabilized **`DropEditorRoute`** header + products RTL tests ( **`waitFor`** / duplicate **Active** pill assertions ).
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor `xl`: resizable live preview / builder split

- Summary: At **`xl`**, the drop editor uses a **sash** between **Live preview** and the form column: **pointer capture** drag, clamp **320px–70%** of the split container width, optional persist to **`ANVL_DROP_EDITOR_PREVIEW_SPLIT_PX`**, **←/→** nudge when the sash is focused. **`overflow-x-hidden`**, **`min-w-0`**, and **`overscroll-x-contain`** avoid horizontal page scroll while dragging; **no width transition** (respects reduced-motion expectations). **`clampDropEditorPreviewWidthPx`** unit-tested.
- Files changed: **`DropEditorRoute.tsx`**, **`useDropEditorXlPreviewSplit.ts`**, **`dropEditorPreviewSash.ts`**, **`dropEditorPreviewSash.test.ts`**, **`storageKeys.ts`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**. Manual: drag sash at **`xl`**, reload confirms width; narrow window clamps. **Vitest** default timeout raised to **15s** (parallel Windows runs); **`@testing-library/jest-dom/vitest`** in setup + **`vite-env`** reference fixes **`tsc`** on DOM matchers.

## 2026-05-18 — Drop editor Products tab: responsive roster cards

- Summary: Product roster under **Products** replaced viewport **`sm:grid-cols-2`** (which forced two cramped columns inside the **`xl`** ~**460px** rail) with **container-query** columns and per-card **stack → row** breakpoints; thumbnails use a controlled **5:4 / square** aspect, **`min-w-0`** + **`line-clamp-2`** on titles, refined status / **Active** · **Hidden** pills, lazy images, and RTL-safe toolbar spacing (**`me-1.5`**). **Tests:** **`DropEditorRoute.products.test.tsx`** (roster smoke + RTL checkbox).
- Files changed: **`DropEditorRoute.tsx`**, **`DropEditorRoute.products.test.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Admin sidebar: `100dvh` + sticky rail (lg+)

- Summary: **`AdminSidebar`** (default density) uses **`lg:self-start lg:sticky lg:top-0`** with **`h` / `min-h` / `max-h` `100dvh`** so the left column tracks the dynamic viewport instead of stretching with a tall document row; **`AdminLayout`** shell/grid/main use **`min-h-[100dvh]`**. **`src/test/setup.ts`** imports **`@testing-library/jest-dom/vitest`** ( **`@testing-library/jest-dom`** devDep) so matcher typings match usage across tests. **`AdminSidebar.test.tsx`** covers logout + drawer **`onNavigate`**; **`AdminLayout.test.tsx`** **`useRouterState`** mock supports **`select`**.
- Files changed: **`AdminSidebar.tsx`**, **`AdminLayout.tsx`**, **`src/test/setup.ts`**, **`package.json`**, **`pnpm-lock.yaml`**, **`AdminSidebar.test.tsx`**, **`AdminLayout.test.tsx`**, **`docs/features/admin-ui.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**. **Manual (Chrome, ≥lg):** open a long admin page (e.g. drop editor); sidebar height stays one viewport; scroll **`main`** — rail stays pinned; border/footer do not extend with page height.

## 2026-05-18 — Drop editor xl split: form cards hug content

- Summary: On **`xl`**, the editor grid used **`items-stretch`**, so the form column matched the tall preview row and **`AdminCard`**’s default **`h-full`** left empty space below short tabs (e.g. **Basics**). **Fix:** **`xl:items-start`** on the grid and **`xl:self-stretch xl:h-full xl:min-h-0`** on the preview column so only the live-preview pane fills the row; form **`AdminCard`**s height follows tab content. **&lt;xl** layout unchanged.
- Files changed: **`DropEditorRoute.tsx`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**. Manual: at **`xl`**, **Basics** card ends after fields; preview column still fills.

## 2026-05-18 — Drop editor live preview: iframe `contentDocument` / `readystatechange` bootstrap

- Summary: **RCA (still-blank iframe):** `ViewportIframe` could strand React portal wiring when `iframe.contentDocument` was **temporarily null**, or when `readyState` stayed **`loading`** until a later **`readystatechange`** after microtask/`rAF` retries (so **`load`** and one-shot probes were not enough). **Fix:** **`requestAnimationFrame`** poll (bounded) until `contentDocument` exists, plus a **`readystatechange`** listener on the iframe document to re-run bootstrap, keeping **`scheduleRetries`** as extra coverage. **Tests:** **`DropEditorLivePreview`** asserts **`[data-anvl-drop-preview-scope]`** appears under the iframe **`body`**; iframe helper tests cover marker toggles under **`loading`**.
- Files changed: **`DropEditorLivePreview.tsx`**, **`__tests__/DropEditorLivePreview.test.tsx`**, **`__tests__/dropEditorLivePreviewIframe.test.ts`**, **`ColorField.test.tsx`** (assertions aligned with compact row DOM), **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — ColorField compact: input-height row (quick create modal)

- Summary: **`density="compact"`** is a fixed **`h-10 max-h-10`** bordered control (inset swatch chip + mono hex, **`rounded-md`**) so grid **`items-stretch`** no longer grows a full-bleed swatch tile; **Quick create** modal grid adds **`sm:items-end`** plus **`flex flex-col gap-1`** stacks and **`AdminInput mt-0`** for aligned label/control pairs.
- Files changed: **`ColorField.tsx`**, **`ColorField.test.tsx`**, **`DropEditorRoute.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor: iframe preview bootstrap, Oath hero fallback, palette presets

- Summary: **RCA (blank preview):** some `srcDoc` iframes stayed on `readyState === "loading"` after `head`/`body` existed, so `isDropEditorPreviewIframeDocumentReady` never bootstrapped the portal (white iframe). **Fix:** treat `loading` as ready when the stub’s `data-anvl-drop-editor-live-preview` is on `<html>`; **unmount** clears `body` portal state. **Empty / all-disabled acts:** `composeLandingPageFromDrop(..., { editorActsPreview: true, editorPreviewHeroFallback: true })` uses `publicLandingActsHeroSlotOnly()` (canonical hero slot + Oath preset wiring; copy from composed `landing.hero`). **Theme:** **Save as preset** persists Zod-validated rows to **`ANVL_DROP_THEME_PALETTE_PRESETS`**; preset select merges built-ins + `user-…` rows. **Quick create product** uses **`DebouncedColorField`** for swatch + popover hex UX.
- Files changed: `dropEditorLivePreviewIframe.ts`, `DropEditorLivePreview.tsx`, `composeLandingPageFromDrop.ts`, `landingActs.normalize.ts`, `DropEditorRoute.tsx`, `DropThemePaletteCard.tsx`, `dropThemePalettePresets.*`, `drops.persistence.zod.ts` (export palette schema), `storageKeys.ts`, tests, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — `ColorField` swatch tile, popover editor, hex copy

- Summary: **Default** `ColorField` is **swatch-first** (~7–7.5rem min height): checkerboard under semi-transparent fills, forge-style rim, mono **hex** copy (**`toast.success`**), **`SlidersHorizontal` `IconButton`** opens a **non-modal** Radix popover (`modal={false}`, no inner scroll, `w-[min(22rem,92vw)]`) containing **`ColorFieldPopoverForm`** (native wheel + HEX / RGB / α). **`rgbaToClipboardHex`** in **`color.ts`** emits **`#RRGGBB`** / **`#RRGGBBAA`**. **`inline`** keeps compact always-visible controls. **`DebouncedColorField`** behavior unchanged (**`startTransition` + debounce**).
- Files changed: **`src/shared/lib/color.ts`**, **`src/shared/components/ui/ColorField.tsx`**, **`src/shared/components/ui/__tests__/ColorField.test.tsx`**, **`docs/design-system.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor preview: act copy overlay + xl height / Fit iframe

- Summary: **Live preview** now merges **`draft.acts`** row fields (eyebrow/title/subtitle/body + **`content` CTAs**) over composed landing slices in **`PublicLandingActs`**, so Acts builder edits re-render immediately. **`ViewportIframe`** supports **`fill`** (**Fit** = `width: 100%` / `max-width: 100%`); **Fit** always uses the iframe+portal path (breakpoints still match the iframe width). **`DropEditorRoute`** **`xl`** grid uses **`items-stretch`** / **`min-h-0`**, preview **`AdminCard`** drops **`sticky`** so column height tracks the builder; preview scroll stays inside **`overflow-y-auto`**. **`DropActsBuilderPanel`** **`onChange`** uses functional **`setDraft`** to avoid stale merges.
- Files changed: **`landingActPreviewOverlay.ts`**, **`PublicLandingActs.tsx`**, **`DropEditorLivePreview.tsx`**, **`DropEditorRoute.tsx`**, tests, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: remove viewport status caption

Removed the trailing **`fits preview pane`** / simulated-width caption from **`DropEditorLivePreview`** viewport toolbar (**`pnpm verify`**).

## 2026-05-18 — Drop editor Visuals: reliable media fallbacks + AdminSpinner

- Summary: **`MediaPickerField`** adds **`onError`** recovery for raster previews, **`fallback="wordmark"`** (inline **`AnvlWordmark`**), and **`AdminSpinner`** for file-embed loading (`prefers-reduced-motion` safe). **Visuals** tab uses **Basics/Theme-style** subsection shells (**emblem → wordmark → hero**, then **Additional lockups**), hero previews use **`fallback="none"`**, wordmark chains **logo → emblem → global emblem fallback**. New **`AdminSpinner`** in shared UI.
- Files changed: **`MediaPickerField.tsx`**, **`AdminSpinner.tsx`**, **`index.ts`**, **`AnvlCrest.tsx`**, **`AnvlWordmark.tsx`**, **`DropEditorRoute.tsx`**, **`MediaPickerField.test.tsx`**, **`DropEditorRoute.visuals.test.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — MediaPickerField: hoist trimmed (toast TDZ) + test repair

- Summary: Move **`trimmed`** / SEC-20 preview flags before file handlers so synchronous **`toast`** cannot trigger **`ReferenceError`** from the **`trimmed`** temporal dead zone. Restore **`onError`** preview test (**`fireEvent.error`**) and use **`queryByRole`** assertions instead of untyped **`toBeInTheDocument`**.
- Files changed: **`MediaPickerField.tsx`**, **`MediaPickerField.test.tsx`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Acts builder: icon reorder/remove toolbar (44px targets)

- Summary: **`DropActsBuilderPanel`** act rows replace **Up / Down / Remove** text buttons with **`IconButton`** + **lucide** (**`ChevronUp`**, **`ChevronDown`**, **`Trash2`**), **`aria-label`** move/remove copy (optional position when multiple acts), disabled **up**/**down** at ends, destructive styling on remove, compact bordered **`inline-flex`** group.
- Files changed: **`DropActsBuilderPanel.tsx`**, **`DropActsBuilderPanel.test.tsx`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin date fields: trigger height matches AdminInput

- Summary: **`AdminDateTimeField`** / **`AdminDateField`** popover triggers drop **`min-h-[44px]`** so height follows shared **`adminFieldControlClass`** (**`py-2`**, **`text-sm`**, **`focus-ring`**, same border as **`AdminInput`**). **`AdminDateField`** adds **`mt-1`** + **`self-center`** on icons for parity; clear side buttons rely on row **`items-stretch`** instead of a fixed **44px** min-height.
- Files changed: **`AdminDateTimeField.tsx`**, **`AdminDateField.tsx`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin forge date pickers: oath accent selection + taller popover shell

- Summary: **`adminCalendarSkin`** replaces the library default **blue** selection/`--rdp-accent-*` with **`--color-accent`** + **bone-tinted** border/fill (**`color-mix`**) and **`focus-visible`** rings on **`rdp-day_button`**; tightens **rdp** cell/nav sizing. **`AdminPopoverContent`** shell uses **`max-h-[min(520px,var(--radix-popover-content-available-height))]`**, **`flex flex-col`**, and a **single** **`overflow-y-auto`** (removed the old **`!overflow-hidden`** fight). **`AdminDateTimeField`** / **`AdminDateField`** drop duplicate max-height/padding overrides; datetime time block **`pt-2`**/**`gap-2.5`**.
- Files changed: **`adminCalendarSkin.ts`**, **`AdminPopover.tsx`**, **`AdminDateTimeField.tsx`**, **`AdminDateField.tsx`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Acts builder: Radix AdminSelect for nature / preset / fields

- Summary: **`DropActsBuilderPanel`** replaces native **`<select>`** (nature, preset, animation intensity, product showcase card style, lookbook layout) with **`AdminSelect`** (Radix), **`aria-labelledby`** + trigger **`id`** parity with Basics Status, and **`data-testid="drop-acts-builder-panel"`** on the Acts **`AdminCard`** for tests. Optional card style / lookbook layout use a **`__inherit__`** sentinel item for “schema default” (maps to **`undefined`** in content).
- Files changed: **`DropActsBuilderPanel.tsx`**, **`AdminCard.tsx`**, **`DropActsBuilderPanel.test.tsx`**, **`docs/features/acts-builder.md`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor Visuals tab + MediaPickerField chrome alignment

- Summary: **Visuals** **AdminCard** uses **`testId="drop-editor-visuals"`**; **Emblem alt** uses the **Basics-style** label + **`aria-labelledby`** pattern. **`MediaPickerField`** **Hide crest preview** uses **`adminCheckboxControlClass`**; the **URL** row uses **`adminFieldControlClass`** from **`src/shared/lib/cmsFieldStyles.ts`** (also sourced by **`AdminInput`**, **`AdminCheckbox`**, **`dropEditorRoute.shared`**). **`DropEditorRoute.visuals.test.tsx`** smoke: open **Visuals** tab, **`querySelector('select')`** is null inside the card, **Emblem alt** textbox present.
- Files changed: **`cmsFieldStyles.ts`**, **`dropEditorRoute.shared.ts`**, **`AdminInput.tsx`**, **`AdminCheckbox.tsx`**, **`MediaPickerField.tsx`**, **`DropEditorRoute.tsx`**, **`MediaPickerField.test.tsx`**, **`DropEditorRoute.visuals.test.tsx`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor theme: AdminSelect preset + admin chrome on color HEX/RGB inputs

- Summary: **`DropThemePaletteCard`** preset uses **`AdminSelect`** (Radix combobox) instead of a native **`<select>`**. **`DebouncedColorField`** passes shared **`adminFieldControlClass`** into **`ColorField`** via new **`fineInputControlClass`** so HEX / numeric channel inputs match **`AdminInput`** styling while **`startTransition`** debounced commits are unchanged.
- Files changed: **`DropThemePaletteCard.tsx`**, **`DebouncedColorField.tsx`**, **`ColorField.tsx`**, **`DropThemePaletteCard.test.tsx`**, **`ColorField.test.tsx`**, **`DropActsBuilderPanel.tsx`** (remove unsupported Radix **`modal`** prop), **`DropActsBuilderPanel.test.tsx`** (explicit **`disabled`** assertions), **`DropEditorRoute.visuals.test.tsx`** (scoped **`querySelector`**), **`AdminDateTimeField.test.tsx`** (longer timeout for jsdom), **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor: legacy Act I–VI panel removed; acts merge + builder bootstrap

- Summary: Deleted **`DropLandingActsEditor`** (legacy **`<details>`** block editing **`Drop.landingContent`** Act I–VI). The **Acts** tab now loads **`DropActsBuilderPanel`** with **`React.lazy`** + **`Suspense`** from **`DropEditorRoute`**. **`resolveActsForMergedDrop`** / **`mergeDropPartial`** preserve persisted **`acts: []`** instead of re-deriving acts from merged landing; partial rows **without** an **`acts`** key still seed via **`landingContentToSimpleActs`** for migration. **`DropActsBuilderPanel`** no longer auto-imports landing JSON on mount when acts are empty — operators use **Reset acts from landing copy** explicitly. **`Drop.landingContent`** remains stored and used by default homepage compose (non-preview paths) and section payloads; **`composeLandingPageFromDrop(..., { editorActsPreview: true })`** continues to build **`landingActs`** only from **`Drop.acts`**.
- Files changed: **`DropEditorRoute.tsx`**, **`DropActsBuilderPanel.tsx`**, **`drops.service.ts`**, removed **`DropLandingActsEditor.tsx`**, **`resolveActsForMergedDrop.test.ts`**, **`docs/features/drops-cms.md`**, **`docs/features/acts-builder.md`**, **`docs/features/admin-ui.md`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: reliable `ViewportIframe` bootstrap

- Summary: **`ViewportIframe`** retries **`srcDoc`** mounting (**`interactive`** or **`complete`**, **`queueMicrotask`**, double **`requestAnimationFrame`**, synchronous probe, **`load`** listener **+ React `onLoad`**) so **`setBody`** / portal wiring is not stranded when navigation completes before **`useLayoutEffect`**. Stub HTML lives in **`dropEditorLivePreviewIframe.ts`** with **`data-anvl-drop-editor-live-preview`** on **`<html>`** for regressions/tests.
- Files changed: **`DropEditorLivePreview.tsx`**, **`dropEditorLivePreviewIframe.ts`**, **`__tests__/dropEditorLivePreviewIframe.test.ts`**, **`DropEditorLivePreview.test.tsx`**, **`AdminDateTimeField.test.tsx`** (hour option **17** avoids duplicate **MM** vs **HH** labels in open Radix lists), **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin `AdminDateTimeField` popover polish (calendar + time row)

- Summary: **Forge date+time picker** uses **`navLayout="around"`** with **`IconButton`** month nav, restored **`rdp-*` skin classes** so react-day-picker positioning works, **`MMM yyyy`** caption, **accent ring** selection + **today** outline, **months** area owns **vertical scroll** on short viewports while the **popover shell** stays **`overflow-hidden`** (no redundant axes). **Hour / minute** use **`AdminSelect`** in one row; **Today** shortcut in the calendar footer; helper copy tightened.
- Files changed: `AdminDateTimeField.tsx`, `AdminDateField.tsx`, `adminCalendarSkin.ts`, `adminDayPickerChrome.tsx`, `AdminDateTimeField.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin forge calendar pickers (`react-day-picker` + Radix popover)

- Summary: **`AdminDateTimeField`** / **`AdminDateField`** replace native **`<input type="datetime-local>`** / **`<input type="date>`** on drop editors, schedules, product editor pricing windows, and product index Updated filters (`src/features/admin/lib/adminDateTime.ts` explains UTC ISO persistence + legacy `datetime-local` semantics). Dependencies: **`react-day-picker` v9**, **`@radix-ui/react-popover`**.
- Files changed: `src/features/admin/components/AdminDateTimeField.tsx`, `AdminDateField.tsx`, `AdminPopover.tsx`, `adminCalendarSkin.ts`, `adminDateTime.ts`, `DropEditorRoute.tsx`, `DropsAdminList.tsx`, `ProductEditorRoute.tsx`, `-adminProductsIndex.tsx`, shared route helpers, Vitest specs, `package.json`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin/storefront: drop card shell hover translate

- Summary: **`AdminCard`** loses **`motion-safe:hover:-translate-y`** and **`transform`** transitions — hover stays **border + inset/ambient shadow** only ( **`motion-reduce`** still kills transitions ). Global CSS **removed** the **`.group/card`** override that zeroed CTA **`translateY`** now that the plate no longer lifts, so **`DashboardCardCtaLink`** and peers regain the usual **micro-lift**. **Pieces grid** product links drop **`hover:-translate-y`** / **`will-change-transform`** for a subtle **border** transition instead. **`anvl-global-interactive-styles`** contract test updated.
- Files changed: `AdminCard.tsx`, `PiecesGrid.tsx`, `src/styles.css`, `src/test/anvl-global-interactive-styles.test.ts`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests: **`pnpm verify`**.

## 2026-05-18 — Global scrollbars + admin mobile drawer from left

- Summary: Site-wide **thin scrollbars** use **`scrollbar-color`** (Firefox) plus **`::-webkit-scrollbar-*`** (Chromium/Safari), themed from **`--color-*`** (`--anvl-scrollbar-thumb` / hover / track). **`color-scheme`** follows **`data-theme="bone-light"`** vs dark defaults. **`Drawer`** adds **`placement="left"`**; **`AdminLayout`** mobile nav uses it with **`overflow-hidden`** shell + **`AdminSidebar`** **`density="drawer"`** (no inner nav scroll, tighter spacing, truncated labels, descriptions omitted). **`pnpm verify`** passes.
- Files changed: `src/styles.css`, `Drawer.tsx`, `AdminLayout.tsx`, `AdminSidebar.tsx`, `Drawer.test.tsx`, `docs/design-system.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**. **Manual QA:** Firefox + Chromium/Edge — viewport scrollbar readable (thumb visible on Windows); **`/admin`** &lt; `lg`: menu opens from **left**, backdrop dismisses; sidebar clusters fit **`100dvh`** without an interior scroll strip (short viewport may clip — acceptable); storefront **`Drawer`** still slides from **right**. **PR screenshots:** narrow **`/admin`** with drawer open (left rail); optional storefront **`Drawer`** unchanged.

## 2026-05-18 — Drop editor: Basics status AdminSelect

- Summary: **Basics** tab **Status** uses **`AdminSelect`** (Radix) instead of a native **`<select>`**, with labelled trigger (**`id`** + **`aria-labelledby`**) matching other admin fields.
- Files changed: `DropEditorRoute.tsx`, `DropEditorRoute.header.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor: live preview collapse in preview chrome

- Summary: Below **`xl`**, **Hide / Show live preview** **`IconButton`** (**`EyeOff`** / **`Eye`**) sits in **`AdminCard` `actions`** on the same row as **Live preview** (**`aria-label`**, **`title`**, **`aria-expanded`**); **`DropEditorLivePreview`** only applies **`max-xl:hidden`** to the viewport toolbar + scrollable iframe shell when collapsed (no overlay on the preview frame).
- Files changed: `DropEditorRoute.tsx`, `DropEditorLivePreview.tsx`, `DropEditorLivePreview.test.tsx`, `DropEditorRoute.header.test.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor: activate-after-save in save modal only

- Summary: **Activate this drop after saving** moved from the editor body into the **Commit changes to storage?** modal (same label/description; summary copy + `saveDrop(..., { makeActive })` unchanged). Vitest covers modal-only checkbox + `makeActive` + re-open pre-check.
- Files changed: `DropEditorRoute.tsx`, `DropEditorRoute.header.test.tsx`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin: global page actions + drop editor top bar icons

- Summary: **`AdminPageActionsProvider`** wraps the **`/admin`** **`Outlet`** so routes register **`ReactNode`** toolbar slots via **`useAdminPageActions()`** (cleanup on unmount). **`AdminTopbar`** renders the slot (**`data-testid="admin-page-actions"`**); **`View storefront`** + **Logout** moved to **`AdminSidebar`** footer (**≥44×44** targets). **`DropEditorRoute`** drops **`AdminSectionHeader`** — **Reset** / **Delete** / **Save** are **`IconButton`** controls with themed **`Modal`** confirms (**Commit changes to storage?**, **Discard unsaved changes?**, destructive delete). Vitest: **`AdminPageActionsContext`**, updated **`DropEditorRoute`** toolbar tests (`DropEditorRoute.header.test.tsx`).
- Files changed: `src/routes/admin/route.tsx`, `AdminPageActionsContext.tsx`, `AdminTopbar.tsx`, `AdminSidebar.tsx`, `DropEditorRoute.tsx`, tests under `src/features/admin/**/__tests__/`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**. **Manual:** `/admin/drops/:id` — icons in top bar, modals fire; sidebar footer opens storefront + logs out; **`/admin`** dashboard — top actions region empty, sidebar footer unchanged behavior.

## 2026-05-18 — Drop editor: quick-create catalog modal + preview viewport stability

- Summary: **`AdminSelect`** (`@radix-ui/react-select`) matches **`AdminDropdownMenu`** forge styling. **Quick create product** uses **`MediaPickerField`** (native picker + drag-drop + optional URL), exposes pragmatic **`AdminProduct`** fields (slug, category, descriptions, tags, PDP detail lines, color + comma-separated sizes, visibility toggles, listing origin), **SKU prefix**, and **Quantity** (UI label — persists as **`stockQuantity`** on each variant via **`buildQuickCreateAdminProduct`** + **`rebuildAvailabilityMatrix`**). **Link this drop** controls **`dropIds`** / roster append. **`DropEditorLivePreview`**: iframe viewport glitch fixed (no breakpoint **`key`** remount; drop **`height`** from CSS transition; stable fixed viewport shell + **width-only** animation); preview shell uses **bounded height** with **sticky viewport toolbar** and **scrollable** chrome/iframe region.
- Files changed: `src/features/admin/components/AdminSelect.tsx`, `src/features/admin/drops/quickCreateAdminProduct.ts`, `DropEditorRoute.tsx`, `DropEditorLivePreview.tsx`, `src/test/setup.ts`, `src/features/admin/components/__tests__/AdminSelect.test.tsx`, `src/features/admin/drops/__tests__/quickCreateAdminProduct.test.ts`, `products.persistence.zod.test.ts`, `package.json`, `docs/features/drops-cms.md`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (220 tests). **Manual:** toggle Mobile → Tablet → Desktop — preview height stays stable; quick-create modal scrolls; Radix selects open + persist value.

## 2026-05-18 — Drop editor: P5–P8 follow-through (theme card, products modal, SEO shells)

- Summary: **P5** — `DropThemePaletteCard` unifies preset header, live swatch strip, and per-token `DebouncedColorField` grid; **Revert palette** compares against last saved drop snapshot; **Copy JSON** exports `Drop.theme`; persistence remains **`saveDrop`** (palette-only persistence API still absent). **P2** — Debounced commits (~72ms) replace per-frame draft updates for theme sliders. **P6** — `MediaPickerField` adds **`fallbackPreviewSrc`** (safe relative/https/data-image chain before crest) plus an **embedding spinner** while FileReader runs (`motion-reduce` simplifies animation). **P7** — Products tab uses thumbnail cards + **`AdminCheckbox`** roster, reorder arrows, and a **Quick create product** modal (`uniqueProductSlug`, `upsertAdminProduct`, `persistProductDropLinks`). **P8** — SEO tab splits **Core metadata** vs **Open Graph** inset sections with **`AdminInput`/`AdminTextarea`**. **P4** — `DropActsBuilderPanel` + legacy **`DropLandingActsEditor`** advanced blocks adopt shared admin controls. **`adminProductPrimaryPreviewImage`** powers listing thumbnails; **`AdminLayout`** increases bottom padding (`pb-28`, `lg:pb-32`).
- Files changed: `DropEditorRoute.tsx`, `DropThemePaletteCard.tsx`, `DebouncedColorField.tsx`, `DropActsBuilderPanel.tsx`, `DropLandingActsEditor.tsx`, `MediaPickerField.tsx`, `AdminLayout.tsx`, `products.slug.ts`, `products.mapper.ts`, new/updated Vitest files (`DebouncedColorField`, `DropThemePaletteCard`, `products.slug`, `products.mapper.preview`, `MediaPickerField`), `docs/features/admin-ui.md`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (212 tests).

### Phased checklist (this batch)

| Phase | Status | Notes |
|-------|--------|--------|
| P2 Color perf | Done | `DebouncedColorField` + `startTransition` on flush |
| P4 Admin inputs | Done | Acts builder, legacy landing advanced, visuals/SEO/products |
| P5 Theme cards / palette UX | Done | Unified card; revert + JSON export |
| P6 Visuals fallbacks/spinner | Done | `fallbackPreviewSrc`; embed spinner |
| P7 Products cards + modal | Done | Quick create stays on page |
| P8 SEO hierarchy | Done | Core vs OG panels |

- Notes/debt: **Named palette preset persistence** (user-stored presets beyond Copy JSON / shipped `DROP_THEME_PRESETS`) not implemented. **Quick-create** intentionally seeds a minimal `AdminProduct` — full variant matrix / PDP SEO still require **`ProductEditorRoute`**. **`leaveEmpty` visuals** remain editor-only until storefront honors persisted empties (prior debt). **Zero persisted acts** flag unchanged.

## 2026-05-18 — Drop editor: acts-only preview, layout/iframe QA, admin inputs

- Summary: **P0** — `composeLandingPageFromDrop(..., { editorActsPreview: true })` drives the CMS preview strictly from `Drop.acts` (no `landingActSequence` fallback). `PublicLandingActs` shows an explicit empty state when `cmsPreview` + zero acts. Default Oath / `createEmptyDrop` seed `acts` via `landingContentToSimpleActs`; `mergeDropPartial` bootstraps acts from merged landing when storage has an empty `acts` array (cannot persist a truly empty act list until a flag lands — see debt). **Viewport iframe** uses `useLayoutEffect`, explicit `minHeight`, and `min-h-[280px]`; preview wrapper uses `min-h-0` flex discipline. **P1** — Editor grid is **two-column from `xl` only**; **Hide/Show live preview** below `xl`. **P2 (partial)** — Theme `ColorField` updates wrapped in `startTransition`. **P3** — Slug field help text. **P4 (partial)** — `AdminInput` / `AdminTextarea` / `AdminCheckbox` (+ shared `adminFieldControlClass`) on Basics + Theme. **Layout** — `AdminLayout` main adds bottom padding for toasts/safe scroll.
- Files changed: `composeLandingPageFromDrop.ts`, `PublicLandingActs.tsx`, `DropEditorRoute.tsx`, `DropEditorLivePreview.tsx`, `drops.defaults.ts`, `drops.service.ts`, `dropEditorRoute.shared.ts`, `AdminLayout.tsx`, `AdminInput.tsx`, `AdminCheckbox.tsx`, `src/features/cms/landing/__tests__/composeLandingPageFromDrop.test.ts`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (205 tests).
- **Manual QA matrix (tablet/mobile editor):** (1) `/admin/drops/$id` below 1280px: single column, forms full width. (2) “Hide live preview” hides preview card; “Show” restores. (3) At `xl+`: two columns, preview sticky. (4) Preview pills: Fit vs Mobile/Tablet/Desktop — iframe modes show the same act stack as Fit (GSAP reset CSS). (5) Acts tab reorder/disable — preview updates without relying on slot toggles alone. (6) Slug help reads clearly on narrow widths.

### Phased checklist (this batch)

| Phase | Status | Notes |
|-------|--------|--------|
| P0 Preview + iframe + overlap | Done | Acts-only compose; iframe init/layout; admin main `pb-*` |
| P1 Responsive split | Done | `xl` breakpoint; collapsible preview `< xl` |
| P2 Color perf | Partial | `startTransition` on theme colors; debounce revisit if still janky |
| P3 Slug copy | Done | |
| P4 Admin inputs | Partial | Basics + Theme only |
| P5 Theme cards / palette persist | Deferred | |
| P6 Visuals fallbacks/spinner | Deferred | |
| P7 Products cards + modal create | Deferred | |
| P8 SEO hierarchy | Deferred | |

- Notes/debt: **Empty `acts`** now round-trip on merge without landing re-seed (see newer changelog entry); storefront compose without **`editorActsPreview`** still falls back to **`landingActSequence`** when acts are empty. **ColorField** debounce was reverted (controlled slider sync); prefer `startTransition` + future `memo`d subtree. P5–P8 unchanged in this slice.

## 2026-05-18 — Admin drop editor: streamlined section header toolbar

- Summary: **`DropEditorRoute`** **`AdminSectionHeader`** no longer shows the preview explainer paragraph or the external **Live route** link. The strip keeps **Drop editor** + **title** ( **`Untitled`** when the internal name is blank/whitespace), with **`AdminButton`** actions only: **Reset** (`secondary`), **Delete** (`destructive`), **Save drop** (`primary`, disabled when validation fails). **Make active** was removed from the header (activation remains via **Activate this drop after saving** + save, and the drops index). **`AdminSectionHeader`** tightens vertical rhythm when **`description`** is omitted and tunes the **`h2`** for oath-dark headings. Tests: **`src/features/admin/drops/__tests__/DropEditorRoute.header.test.tsx`**.
- Files changed: `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/components/AdminSectionHeader.tsx`, `src/features/admin/drops/__tests__/DropEditorRoute.header.test.tsx`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-17 — Admin `/admin/drops`: forged outline “Create new drop” icon control

- Summary: Toolbar **`Plus`** link drops the flat **`primary`** pill for a **`DashboardCardCtaLink`-style** forged plate (**OKLab accent border**, **`--color-surface`** fill, inset rim + depth shadow, **`h-11`** / **44px** touch). **`focus-ring inline-flex`** stays on the global CTA hover path (`src/styles.css`).
- Files changed: `src/features/admin/drops/DropsAdminList.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-17 — Admin `/admin/drops`: overflow (⋯) column first on desktop table

- Summary: **`DropsAdminList`** **`ColumnDef`** order puts the **`DropRowOverflowMenu`** (**`actions`**) column **leftmost** before Campaign/Slug/etc.; overflow cell aligns **start**. Test asserts the **first** **`columnheader`** is **Actions** (sr-only).
- Files changed: `src/features/admin/drops/DropsAdminList.tsx`, `src/features/admin/drops/__tests__/DropsAdminList.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**. Manual: desktop **`/admin/drops`** — ⋯ sits in the leading column.

## 2026-05-17 — Admin layout: contain wide drops table (viewport overflow)

- Summary: **`AdminLayout`** main column and **`DropsAdminList`** wrappers use **`min-w-0`** so grid/flex tracks can shrink below the table’s intrinsic width; the desktop table stays inside **`max-w-full overflow-x-auto`** so horizontal scroll is confined to the card, not the whole page (~320–390px sanity). Test asserts the table’s parent carries **`overflow-x-auto`** + **`max-w-full`**.
- Files changed: `src/features/admin/components/AdminLayout.tsx`, `src/features/admin/drops/DropsAdminList.tsx`, `src/features/admin/drops/__tests__/DropsAdminList.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**. Manual: narrow viewport **`/admin/drops`** — body should not gain a horizontal scrollbar; table region may scroll horizontally.

## 2026-05-17 — Admin `/admin/drops`: toolbar table + Radix overflow menus

- Summary: Drops index drops the duplicate **`AdminSectionHeader`** hero in favor of a **toolbar card** (search, segmented status tabs, **`Plus`** square link with **`focus-ring`** / **`aria-label`**, View site). Desktop uses **`@tanstack/react-table`** for sortable columns (title/slug/status/dates/products/last edited), **sticky** header, zebra + active tint, **column resize** handles, and **`DropRowOverflowMenu`** (**`MoreVertical`** + **`AdminDropdownMenu`** / **`@radix-ui/react-dropdown-menu`**). Motion on menu panel respects **`prefers-reduced-motion`** via **`admin-dropdown-menu-content`** (`src/styles.css`). Tests: **`src/features/admin/drops/__tests__/DropsAdminList.test.tsx`** (+ **`@testing-library/user-event`**). **`pnpm verify`** green (**197** tests).
- Files changed: `package.json`, `src/features/admin/drops/DropsAdminList.tsx`, `src/features/admin/drops/DropRowOverflowMenu.tsx`, `src/features/admin/components/AdminDropdownMenu.tsx`, `src/styles.css`, `src/routes/admin/drops/-dropsIndex.tsx`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**. Manual: `/admin/drops` — sort headers, drag resize, ⋯ menu keyboard + reduced-motion OS toggle; confirm storefront bundle still has no admin imports.
- Notes/debt: **`useReactTable`** was not previously used elsewhere (deps already listed **`@tanstack/react-table`**); jsdom ignores Tailwind breakpoints — RTL scopes desktop assertions **`within(table)`**.

## 2026-05-17 — Admin Settings: password-gated local CMS reset

- Summary: **Danger zone** on `/admin/settings` uses a **full-width destructive** control (min height ≥44px, `focus-ring`, no label truncation). **Reset** opens the shared **`Modal`** with **`AdminCard`-style** inset rim/shadow; **`verifyAdminPassword`** in `adminAuth.storage.ts` centralizes the same plain compare as login (dev gate, not a hash). Users must **match admin password in two fields**; inline errors for mismatch / wrong password; **Confirm** stays disabled until valid. **`Modal`** accepts optional **`aria-describedby`**. Tests: `src/routes/admin/__tests__/-adminSettings.test.tsx`, `Modal` described-by case.
- Files changed: `src/features/admin/auth/adminAuth.storage.ts`, `src/features/admin/auth/AdminAuthProvider.tsx` (uses `verifyAdminPassword`), `src/routes/admin/-adminSettings.tsx`, `src/shared/components/ui/Modal.tsx`, `src/shared/components/ui/__tests__/Modal.test.tsx`, `src/routes/admin/__tests__/-adminSettings.test.tsx`, `docs/features/admin-ui.md`, `docs/features/auth-accounts-orders.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (this run). **PR screenshot:** Settings → Danger zone → open modal → show twin password fields + destructive actions on oath-dark panel.
- Notes/debt: Still aligns with temporary **`VITE_ANVL_ADMIN_*`** client-exposed credentials (`SEC-*` debt unchanged).

## 2026-05-17 — Admin: AdminButton + shared pressable variants

- Summary: **`AdminButton`** re-exports the shared **`Button`** (`class-variance-authority` + `forwardRef`) from `src/features/admin/components/AdminButton.tsx` for admin feature imports. Extended **`src/shared/components/ui/Button.tsx`** with **`destructive`**, **`size: none | compact`**, and segmented-tab variants **`adminTabList` / `adminTabEditor` / `adminTabProduct`** (use with **`data-active="true" | "false"`**). Migrated high-traffic controls: drops list status tabs + modals + row actions (**`DropsAdminList`**), product + drop editor tabs and toolbars (**`ProductEditorRoute`**, **`DropEditorRoute`**), acts builder toolbar + reorder/remove (**`DropActsBuilderPanel`**), live preview viewport pills + error fallback (**`DropEditorLivePreview`**). Documented token mapping in **`docs/features/admin-ui.md`**. Tests: **`src/features/admin/components/__tests__/AdminButton.test.tsx`**.
- Files changed: `src/shared/components/ui/Button.tsx`, `src/features/admin/components/AdminButton.tsx`, `src/features/admin/drops/DropsAdminList.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/drops/DropActsBuilderPanel.tsx`, `src/features/admin/drops/DropEditorLivePreview.tsx`, `src/features/admin/products/ProductEditorRoute.tsx`, `src/features/admin/components/__tests__/AdminButton.test.tsx`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (see subagent run).
- Notes/debt: **`AdminTopbar`** and other admin surfaces still import **`Button`** from `@/shared/components/ui/Button` directly; prefer **`AdminButton`** when touching those files. No **shadcn/ui** install — project already had CVA + tokens; path **(A)** chosen for minimal churn.

## 2026-05-17 — Admin dashboard: equal-height cards + pinned footers + Settings CTA label

- Summary: **`AdminCard`** is a **full-height column shell** (`flex flex-col`, `h-full`, `min-h-0`) so grids can **`items-stretch`** tiles; **`/admin`** dashboard cards get **`min-h`** + footer row **`mt-auto`** so the **badge stays bottom-left** and **`DashboardCardCtaLink`** **bottom-right** regardless of description length. **Settings** nav item **`cta`** renamed from “Workspace settings” to **“Settings”** (`adminNav.ts`); **`getByRole('link', { name: card.cta })`** keeps tests aligned. **`DropActsBuilderPanel`** restores the missing **`MediaPickerField`** import so **`pnpm verify`** typechecks (unrelated regressions caught while verifying).
- Files changed: `src/features/admin/components/AdminCard.tsx`, `src/routes/admin/-adminDashboard.tsx`, `src/features/admin/components/adminNav.ts`, `src/features/admin/drops/DropActsBuilderPanel.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (this batch).
- Notes/debt: Other **`AdminCard`** call sites omit **`mt-auto`** on **`children`** so editor forms are unchanged; dashboard owns the pinned footer markup.

## 2026-05-17 — Admin: premium forged AdminCard treatment

- Summary: **`AdminCard`** shell now uses layered inset/ambient shadows, a non-interactive **bone corner wash + inset hairline** overlay, tighter **title/description** rhythm, hover **border brighten + subtle lift** with transitions gated by **`motion-safe`** / **`motion-reduce`**. **Dashboard** tile footer: chip tint + **`DashboardCardCtaLink`** `rounded-lg` and deeper inset/ambient shadow to match the plate; inner CTAs intentionally stay **brightness + shadow-only** on hover (`src/styles.css` already suppresses **`transform`** on `focus-ring` links inside **`group/card`** so the plate lift isn’t doubled). **`AdminCard`** tests in `src/features/admin/components/__tests__/AdminCard.test.tsx`.
- Files changed: `src/features/admin/components/AdminCard.tsx`, `src/routes/admin/-adminDashboard.tsx`, `src/features/admin/components/__tests__/AdminCard.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (see transcript).
- Notes/debt: none for this cosmetic pass.

## 2026-05-17 — Global button + CTA hover affordances

- Summary: Centralized **`cursor: pointer`** and cohesive hover (**brightness + shared transition timing**; **–1px `translateY` only** on CTA-shaped **`a.focus-ring.inline-flex`** with row heights **`h-9`–`h-12` / `min-h-10` / `min-h-11`**, only under **`prefers-reduced-motion: no-preference`**) in **`src/styles.css`**. Native **`button`**, **`input` submit/button/reset**, **`[role='button']`** (when not `aria-disabled`), **`::file-selector-button`**, and **`summary`** inherit the treatment; **native controls intentionally skip hover translate** so **`AdminCard`'s `group/card` plate lift** never stacks with an inner nudge. **Dashboard / admin CTAs inside `AdminCard`** drop CTA translate on hover and use a slightly softer brightness so card + control don’t double-animate. **Hero / drop-reveal** SafeLinks dropped redundant **`transition-transform hover:-translate-y-0.5`** in favor of the global CTA layer (primary hero sheen unchanged). Contract coverage: **`src/test/anvl-global-interactive-styles.test.ts`**.
- Files changed: `src/styles.css`, `src/features/marketing/components/HeroForgeSequence.tsx`, `src/features/marketing/components/DropRevealSection.tsx`, `src/test/anvl-global-interactive-styles.test.ts`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (log on this workstation); optional smoke: hover storefront hero CTAs, admin dashboard tiles, and a native **Join** / form button with motion on vs **reduced motion** in OS — translate should only appear for motion-OK link CTAs outside card shells; brightness-only for reduced motion.
- Notes/debt: Plain text links (`focus-ring` + `inline-flex` without fixed row heights) are unchanged so underline / micro-label patterns are not forced into “button” hover. Any future CTA link that omits both `min-h-*` and `h-*` won’t pick up the global link translate until one is added or the selector is extended.


## 2026-05-17 — Admin dashboard card CTA polish

- Summary: Redesigned dashboard card primary links in `src/routes/admin/-adminDashboard.tsx` from flat accent fills to **outline + inset highlight** (`focus-ring`, bone/heading label, accent-tinted border, restrained hover/active shadow) so CTAs read as forged controls on dark admin chrome. Added a co-located `DashboardCardCtaLink` helper; extended `src/routes/admin/__tests__/-adminDashboard.test.tsx` to assert every tile’s CTA `href`.
- Tests/manual checks: `pnpm verify` — typecheck + **185/185** Vitest tests + production build succeeded. Note: intermittent Windows `EBUSY` when copying `favicon.ico` into `dist` can occur if another process locks `dist`; clearing `dist/` and re-running resolves it.
- Notes/debt: none for this visual-only admin slice.

## 2026-05-17 — Admin dashboard: drop duplicate hero strip

- Summary: Removed the redundant `AdminSectionHeader` block from `/admin` (signed-in eyebrow, personalized welcome, localStorage blurb, and external **View site** CTA). Context already lives in `AdminTopbar`; main content now opens with the CMS destination cards only. Added Vitest coverage in `src/routes/admin/__tests__/-adminDashboard.test.tsx` (layout/auth/router mocks; assertions avoid jest-dom matchers).
- Files changed: `src/routes/admin/-adminDashboard.tsx`, `src/routes/admin/__tests__/-adminDashboard.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` (typecheck, Vitest, production build).
- Notes/debt: `AdminSectionHeader` remains available for other admin routes.

## 2026-05-17 — Integrate cms_merge into cms; trim branches to master + cms

- Summary: Fast-forwarded **`cms`** to **`cms_merge`** tip (`8a734e6`) so the main CMS line carries the full audit **A–J** stack. Deleted **`origin/cms_merge`** and all **`origin/cursor/*`** feature branches on GitHub; removed matching local branches. **Remote default branches remaining:** `master`, `cms`.
- Files changed: none (git-only); this changelog entry.
- Tests/manual checks: merge was fast-forward; prior `pnpm verify` green on merged tip.
- Notes/debt: Clone fresh or `git fetch --prune` so stale remote-tracking refs disappear locally.

## 2026-05-17 — cms_merge: merge Phase G (performance + storage migration)

- Summary: Merged `origin/cursor/audit-remaining-storage-g-drawer-289d` so Phase **G** joins phases **A–J** already integrated on `cms_merge`. Resolved `adminAuth.storage.ts` by combining Phase J `publicEnv` credential reads with Phase G `createLocalStorageChannel` + shared `isBrowser`; `website-layout` uses the lazy route shell from Phase G.
- Files changed (resolution only): `src/features/admin/auth/adminAuth.storage.ts`, `src/routes/admin/website-layout.tsx`.
- Tests/manual checks: `pnpm verify` (typecheck, **178/178** tests, build).
- Notes/debt: Full Phase G file list and audit-doc updates are in the entries immediately below this one.

## 2026-05-17 — cms_merge: merge audit phases A–H with existing D–J integration

- Summary: Merged `cursor/audit-phase-h-responsiveness-289d` (linear phases A through H) into `cms_merge`, which already contained the phase D–J CMS-boundary and hardening work. Resolved conflicts in `docs/changelog.md`, `package.json` (`verify` runs typecheck, Vitest, and build), `SiteFooter.tsx` (storefront CMS types + newsletter toast), and `HeroForgeSequence.tsx` (storefront CMS types). **Phase G** landed in a subsequent merge from `cursor/audit-remaining-storage-g-drawer-289d` (see entry above).
- Files changed: `docs/changelog.md`, `package.json`, `src/shared/components/layout/SiteFooter.tsx`, `src/features/marketing/components/HeroForgeSequence.tsx`, `src/routes/auth/__tests__/-sign-up.test.ts` (renamed from `sign-up.test.ts` so TanStack Router ignores it per `routeFileIgnorePrefix`).
- Tests/manual checks: `pnpm verify` after completing the merge commit.
- Notes/debt: none for this merge-resolution slice.

## 2026-05-17 — Contracts: catalog types out of admin

- Summary: Moved `AdminProduct` and related catalog document types to `src/features/products/types/catalogProduct.types.ts`. `features/admin/products/products.types.ts` re-exports for existing admin imports. `shared/api/contracts/products.contract.ts` now depends only on `features/products`.
- Files changed: `src/features/products/types/catalogProduct.types.ts`, `src/features/admin/products/products.types.ts`, `src/shared/api/contracts/products.contract.ts`, `docs/contracts/README.md`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` (pass). Browser smoke (dev server): `/`, `/shop`, PDP `/shop/oversized-tee`, `/drop/the-oath` — all rendered; only typical Vite/HMR dev warnings in console.
- Notes/debt: none for this slice.

## 2026-05-17 — Audit phases D–J: CMS boundary, editor splits, verify, repatch docs, public env

- Summary: **Phase D —** Moved canonical `Drop` types and `drops.actSequence` to `features/drops/`; website layout types to `features/cms/layout/`; landing compose + act normalization + `LANDING_CMS_VERSION` into `features/cms/landing/`; added `features/cms/read/*` facades and `features/products/catalog/storefrontCatalog.ts` / `productSubscriptions.ts` so public routes and marketing no longer import `@/features/admin/*` for reads. **Phase E —** Extracted shared drop/product editor utilities (`dropEditorRoute.shared.ts`, `DropEditorFieldError.tsx`, `productEditorRoute.shared.ts`). **Phase F —** Added `pnpm verify`. **Phase I —** Added `docs/tooling/router-repatch.md`. **Phase J —** Added Zod-backed `src/app/config/publicEnv.ts`; wired admin auth + international checkout flag. Drop editor imports `composeLandingPageFromDrop` from CMS module.
- Files changed: `src/features/drops/drop.types.ts`, `drops.actSequence.ts`, `src/features/cms/landing/*`, `src/features/cms/layout/websiteLayout.types.ts`, `src/features/cms/read/*`, `src/features/products/catalog/*`, admin re-export shims, `DropEditorRoute.tsx`, `ProductEditorRoute.tsx`, `publicEnv.ts`, `checkoutPayments.config.ts`, `adminAuth.storage.ts`, `package.json`, `vite-env.d.ts`, `docs/architecture.md`, `docs/README.md`, `docs/cursor-workflow.md`, `docs/tooling/router-repatch.md`, `docs/performance-accessibility-security.md`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` (pass).
- Notes/debt: CMS localStorage adapters intentionally call admin services behind `features/cms` facades until a real API exists. Catalog document types (`AdminProduct`, etc.) live in `features/products/types/catalogProduct.types.ts`; contracts import from there, not `features/admin`.

## 2026-05-17 — Audit program closure (documentation + Phase A–J status)
- Summary: Restored and published **`docs/audit-2026-05-17.md`** as the single canonical audit record: condensed finding index (`SEC` / `PERF` / `RESP` / `MAINT` / `REU`), **phase tracker** with **A–C, G, H marked done**, and **D, E, F, I, J explicitly deferred** with rationale (folder boundary, editor splits, DX, codegen, production hardening). Linked the doc from **`docs/README.md`** and added an **“Audit program — closed batch”** section to **`docs/technical-debt.md`** so launch blockers stay visible under Phase J. This closes the **execution scope** of the 2026-05-17 hardening task; remaining work is tracked as follow-up PRs, not as open audit execution.
- Files changed: `docs/audit-2026-05-17.md` (new), `docs/README.md`, `docs/technical-debt.md`, `docs/changelog.md`.
- Tests/manual checks: **Docs-only** — no code paths changed in this changelog entry.
- Notes/debt: Merge **PR #13** (and stacked PRs on `cms_merge` if applicable) to land the last code batch; use `docs/audit-2026-05-17.md` as the handoff for Phase D/E/F/I/J owners.

## 2026-05-17 — Audit Phase C optional + Phase G performance + Drawer focus hook
- Summary: Closes the Phase C follow-up by migrating hand-rolled `localStorage` EventTarget scaffolding on `drops`, `products`, `website-layout`, `global-brand`, and `adminAuth` storage modules to `createLocalStorageChannel`, extended with `readKey` / `writeKey` / `notifyChange` for multi-key drops + mirrored auth writes. `landingCms.storage.ts` only imports the shared `isBrowser` helper. Ships **Phase G** items: every admin route except the `/admin` layout shell uses `lazyRouteComponent` with colocated `-*.tsx` sidecars; `DropActsBuilderPanel` is `React.lazy` + `Suspense` inside `DropLandingActsEditor`; root route preloads Manrope + Bebas Neue latin-400 `woff2`; Vite `manualChunks` adds `vendor-zod`, `vendor-tanstack`, `vendor-react`; router `defaultPreloadStaleTime` is 30s (`PERF-07`). **Drawer** now uses `useDialogFocusTrap` like `Modal` (Phase H optional debt).
- Files changed: `src/shared/lib/storage/*`, admin `*.storage.ts` files above, new `src/routes/admin/**/-*.tsx` sidecars + slim route entries, `DropLandingActsEditor.tsx`, `Drawer.tsx`, `src/routes/__root.tsx`, `src/router.tsx`, `vite.config.ts`, `docs/changelog.md`, `docs/performance-accessibility-security.md`, `docs/features/drops-cms.md`, `docs/features/products-commerce.md`.
- Tests/manual checks: `pnpm verify` — **178/178** tests (**+3** channel tests). Build shows async chunks for admin shells and `DropActsBuilderPanel`.
- Notes/debt: **Phase D / E / F / I / J** still open at large. `src/routes/auth/__tests__/sign-up.test.ts` was renamed to `-sign-up.test.ts` so TanStack’s route scanner ignores it during `vite build`.

## 2026-05-17 — Audit Phase H responsiveness + a11y + smoothness (H1 – H14 batch)
- Summary: Fourth execution pass against `docs/audit-2026-05-17.md`, stacked on PR #11. Closes 13 of the 14 RESP findings the audit listed (RESP-01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14). Six logical commits, all surgical — no admin surface restructure, no behavior changes beyond the focus / motion / overflow fixes. Admin auth still untouched.
  - **RESP-01 / RESP-13 / RESP-14 — Modal focus trap + h2 dialog headings + Accordion aria.** `Modal` now wires `useDialogFocusTrap` (Tab/Shift+Tab cycle inside the panel, programmatic focus on open, focus restored on close, Escape closes) — previously the only way to dismiss was clicking the backdrop. New `title` prop renders an `<h2>` inside the panel with an auto-generated id wired to `aria-labelledby`, replacing inline `<h3>` headings in the settings reset modal and the four `DropEditorRoute` modals (save / activate / reset / delete). Explicit `aria-labelledby` still supported as the escape hatch (kept on `DropsAdminList`, `ProductEditorRoute`, `-adminProductsIndex` modals). `AccordionDisclosure` chevron marked `aria-hidden="true"`; the `<summary>` now uses the shared `focus-ring` utility.
  - **RESP-04 / RESP-05 — focus-ring + 44 px touch targets.** Added `focus-ring` to `ProductCard` link, `ProductGallery` thumb buttons (+ `aria-pressed`), `PiecesGrid` product card link, `AdminSidebar` header link + nav items. Raised `IconButton` to 44 × 44 px (default `type="button"`); `ColorSwatch` hit area expanded to 44 × 44 px with the visible 36 px swatch centered via `aria-hidden` inner span (design density unchanged); `QuantityStepper` switched to `size="md"` buttons with `aria-label` "Decrease/Increase quantity" + `aria-live="polite"` on the value display.
  - **RESP-02 — PDP mobile sticky purchase bar safe-area.** Bar now uses `pb-[max(env(safe-area-inset-bottom,0px),12px)]` so it clears notched-phone home indicators. A matching spacer (`h-[calc(64px+env(safe-area-inset-bottom,0px))]`) under the article prevents the bar from covering related products / accordion on mobile.
  - **RESP-09 — responsive hero scale.** Replaced raw `text-6xl` with `text-4xl sm:text-5xl md:text-6xl` on PDP h1, cart h1, checkout h1, shop/index h1 (matches the existing `DropActivePageView` pattern).
  - **RESP-12 — UTF-8 mojibake.** `routes/shop/index.tsx` SEO description: `ΓÇö` → `—`.
  - **RESP-07 — iOS zoom-on-focus prevention.** `Input` and `Textarea` shared primitives now default to `text-base md:text-sm` (was `text-sm` globally) so iOS Safari doesn't zoom into form fields on focus. Applies storefront-wide via every consumer (shop search, auth, account, checkout, waitlist, every admin editor using the primitives).
  - **RESP-06 — text overflow guards on long CMS names.** `ProductCard` title row gets `min-w-0 break-words` on the `<h3>` + `shrink-0` on the price column; cart line article wraps the title block in `min-w-0` + uses `text-2xl sm:text-3xl break-words`; checkout order summary line gets `gap-3` + `min-w-0 break-words` on the label + `shrink-0` on the price.
  - **RESP-08 — PiecesGrid mobile columns.** Was `grid-cols-3` from 320 px (squeezed type + tap targets). Now `grid-cols-2` on phones, `sm:grid-cols-3` from 640 px.
  - **RESP-03 — GSAP timelines gate on viewport + reduced motion.** Five marketing acts (`OathStampSequence`, `DropRevealSection`, `PiecesGrid`, `MaterialsMarquee`, `WaitlistSection`) previously only gated on `prefers-reduced-motion`. On phones with the default "no preference" motion setting all five ran their full ScrollTrigger timelines (incl. OathStampSequence's infinite shape rotation + parallax scrub). Widened the `gsap.matchMedia` keys so `motionOk = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'` and `reduced = '(max-width: 767px), (prefers-reduced-motion: reduce)'`. Each component's existing `reduced` branch already snaps to final state via `gsap.set`, so the snap path is now re-used on mobile without any callback changes. Matches the `HeroForgeSequence` model.
  - **RESP-10 — SiteFooter newsletter form + heading promotion.** Newsletter input + button were a bare div; now wrapped in `<form onSubmit>` (placeholder handler with sonner toast — real backend lands with Phase J). Input is now `type="email" required` so the browser validates before submit. Footer group titles and newsletter title promoted from styled `<p>` to `<h3>` (visual styling unchanged via `anvl-micro font-normal`) so the footer participates in the document outline.
  - **RESP-11 — responsive Toaster.** `AppProviders` Toaster moved from `position="top-right"` (which fought the sticky header + announcement bar on mobile) to `position="bottom-center"` with `offset={16}` and `mobileOffset={{ bottom: 96 }}` so the toast clears the iPhone home indicator AND the PDP sticky purchase bar.
- Files changed: `src/shared/components/ui/Modal.tsx` (rewritten), `AccordionDisclosure.tsx`, `Input.tsx`, `Textarea.tsx`, `IconButton.tsx`, `ColorSwatch.tsx`, `ProductGallery.tsx`, `ProductCard.tsx`, `QuantityStepper.tsx`, new `__tests__/Modal.test.tsx` + `__tests__/AccordionDisclosure.test.tsx`, `src/features/admin/components/AdminSidebar.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/marketing/components/{OathStampSequence,DropRevealSection,PiecesGrid,MaterialsMarquee,WaitlistSection}.tsx`, `src/routes/admin/settings.tsx`, `src/routes/cart.tsx`, `src/routes/checkout/index.tsx`, `src/routes/shop/index.tsx`, `src/routes/shop/$slug.tsx`, `src/shared/components/layout/SiteFooter.tsx`, `src/app/providers/AppProviders.tsx`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` — typecheck 0 errors, **175/175 tests passed across 20 files** (was 165/18 after PR #11; **+10 tests this PR**, all on the new Modal + AccordionDisclosure tests). `vite build` success. Modal test coverage: closed renders nothing, role=dialog + aria-modal=true, title renders as h2 wired to aria-labelledby, explicit aria-labelledby skips auto-heading, aria-label fallback, Escape closes, backdrop click closes. Accordion test coverage: title + body rendering, chevron is aria-hidden, summary has focus-ring class. Manual GUI testing intentionally skipped per `.cursor/rules/50-testing.mdc` — changes are either purely structural (text scale, focus-ring class additions, type-base size, GSAP matchMedia query strings) or covered by the new Vitest tests; the dev environment doesn't have a working browser harness today and the user previously asked to keep verification light.
- Notes/debt: Phase H is now functionally complete except for **RESP-15** (admin editor density on tablets) and **RESP-16** (skeleton/loading state consistency), both rated Low in the audit and best handled as part of Phase E (the editor splits) and Phase F (DX/reusability), respectively. The Drawer component still hand-rolls a copy of `useDialogFocusTrap` (predates the hook); switching it to use the shared hook is a mechanical zero-behavior follow-up (~25-line diff in `Drawer.tsx`). Next high-leverage targets: **Phase G** (admin route `lazyRouteComponent` + lazy `DropActsBuilderPanel` + expanded `manualChunks` + font preload) and **Phase E** (split the 600+ line editors). Admin auth gate remains unchanged.

## 2026-05-17 — Audit Phase C persistence Zod hardening (C1–C5)
- Summary: Third execution pass against `docs/audit-2026-05-17.md`, stacked on PR #10. Closes `SEC-07` across every non-drop persistence boundary (products, website-layout, global-brand), introduces the generic `createLocalStorageChannel` + `createJsonStore` factories called out by `REU-05`, centralizes every admin `localStorage` key per `MAINT-08`, and validates the `bootstrapFromLanding` JSON paste in the acts builder per `SEC-16`. Admin auth in `src/features/admin/auth/**` still untouched.
  - **C1 + C3 — factories + storage keys:** new `src/features/admin/storageKeys.ts` (`ADMIN_STORAGE_KEYS` map + `ALL_ADMIN_STORAGE_KEYS` list) is the single source of truth for the seven admin keys (`ANVL_DROPS`, `ANVL_ACTIVE_DROP_ID`, `ANVL_PRODUCTS`, `ANVL_WEBSITE_LAYOUT`, `ANVL_GLOBAL_BRAND`, `anvl.landingCms.v1`, `anvl.siteSeo.v1`). New `src/shared/lib/storage/`: `createLocalStorageChannel({ key, changeEvent, alsoListenForKeys? })` owns the SSR-safe read/write/remove + cross-tab event plumbing every `*.storage.ts` previously hand-rolled; `createJsonStore({ channel, schema, transform?, onInvalid? })` pairs a channel with a Zod schema and runs `safeParse` on every read so tampered or stale-schema blobs return `null` instead of an `as` cast. Future `*.storage.ts` migrations will use the channel/store factories instead of copying the scaffolding.
  - **C2 — Zod persistence for products / website-layout / global-brand (closes SEC-07):** new `products.persistence.zod.ts`, `websiteLayout.persistence.zod.ts`, and `globalBrand.persistence.zod.ts` mirror the drops persistence pattern. `products.service.getAdminProducts` now `safeParse`s each row and drops malformed neighbors (instead of wiping the whole catalog); `websiteLayout.service.getWebsiteLayoutContent` and `globalBrand.service.getGlobalBrandSettings` validate before their existing merge-with-defaults pipelines. The hand-written `AdminProduct` / `WebsiteLayoutContent` / `GlobalBrandSettings` types stay the public surfaces; the persistence schemas only guard the storage boundary, documented in each schema file header.
  - **C5 / SEC-16 — `bootstrapFromLanding` JSON paste:** `DropActsBuilderPanel.bootstrapFromLanding` now parses the pasted JSON, then `safeParse`s with `dropLandingContentSchema` (exported from `drops.persistence.zod.ts`) before feeding `landingContentToSimpleActs`. Invalid pastes become a no-op instead of producing unexpected draft state.
  - **C3 — `resetAllLocalCmsKeys` uses the central list:** replaced seven hard-coded literals / scattered key imports in `drops.service.ts` with a loop over `ALL_ADMIN_STORAGE_KEYS`. Adding a new persisted key now automatically includes it in the bulk reset, closing the original MAINT-08 silent-miss risk.
- Files changed: new `src/features/admin/storageKeys.ts`, new `src/shared/lib/storage/{index,createLocalStorageChannel,createJsonStore}.ts` + tests, new `src/features/admin/products/products.persistence.zod.ts` + 2 tests, new `src/features/admin/website-layout/websiteLayout.persistence.zod.ts` + test, new `src/features/admin/global-brand/globalBrand.persistence.zod.ts` + test, modified `src/features/admin/products/products.service.ts`, `src/features/admin/website-layout/websiteLayout.service.ts`, `src/features/admin/global-brand/globalBrand.service.ts`, `src/features/admin/drops/drops.service.ts`, `src/features/admin/drops/drops.persistence.zod.ts`, `src/features/admin/drops/DropActsBuilderPanel.tsx`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` — typecheck 0 errors, **165/165 tests passed across 18 files** (was 122/12 after PR #10; **+43 tests this PR**), `vite build` success. Coverage: storage factories 14 (channel round-trip / same-tab listener / cross-tab key filter / `alsoListenForKeys` widening / quota swallowing / `safeParse` rejects / `onInvalid` hook / `transform` / `clear`); products persistence 14 (9 schema + 5 integration tamper guard); website-layout persistence 8 (4 schema + 4 integration); global-brand persistence 7 (3 schema + 4 integration). The `bootstrapFromLanding` change is covered indirectly via `dropLandingContentSchema` which is already tested in the drops persistence suite.
- Notes/debt: Phase C is complete except for one nuance — the existing `*.storage.ts` modules still hand-roll the channel scaffolding (`isBrowser` + `EventTarget` + `storage` listener). The `createLocalStorageChannel` factory is in place and tested; migrating each `*.storage.ts` to use it is mechanical and best done in a focused follow-up (touches 4 files, no behavior change, reduces line count by ~40%). `landingCms.storage.ts` (legacy migration read path) is intentionally left as-is because it's slated for deletion once every renderer reads from `Drop.acts`. Next high-leverage targets: **Phase D** (move CMS-read code out of `features/admin/**` into `features/cms/**` — unlocks the admin-route lazy-loading wins in Phase G), **Phase E** (split the 600+ line editors). Admin auth gate remains unchanged.

## 2026-05-17 — Audit Phase B security minimums (B3 – B7)
- Summary: Second execution pass against `docs/audit-2026-05-17.md`, stacked on PR #9. Closes every Phase B finding except B1 (already shipped in PR #9) and B2 (already shipped in PR #9). Admin auth in `src/features/admin/auth/**` remains untouched per the locked AGENTS.md directive — these are all defense-in-depth changes at the render boundary and the in-page validation surface.
  - **B3 / SEC-04 — `sanitizeHref` + `SafeLink`:** new `src/shared/lib/url.ts` with `sanitizeHref(raw, { allowRelative, schemes })` (allowlists https/http/mailto/tel + relative URLs; rejects javascript:/data:/vbscript:/file:/ssh:/ftp:/scheme-less ambiguous + embedded control chars), `isExternalHref`, and `upgradeHttpToHttps`. New `src/shared/components/ui/SafeLink.tsx` primitive renders external URLs as `<a target=_blank rel=noreferrer noopener>`, relative URLs as TanStack `<Link>`, and rejected URLs as a non-interactive `<span>` so the label stays visible — `forceExternal` escape hatch for cases like footer socials. Forwards `data-*` / `aria-*` props on both branches so GSAP targeting attrs (e.g. `data-pieces-meta`) keep working after migration. Migrated every CMS-driven href: AnnouncementBar `ctaHref`; SiteFooter footer link groups, flat footer links, social anchors; StickyHeader announcement.href (removed brittle `href?.startsWith('http')` branching), desktop nav items, mobile drawer nav items; HeroForgeSequence primary + secondary CTAs; DropRevealSection primary + secondary CTAs; PiecesGrid `viewAllHref` and `footerLinkHref`; shop/$slug PDP 3D-model link (closes the cited `javascript:` threat from the audit). Product cards keep their typed `<Link to="/shop/$slug">` (not CMS-driven; no sanitization needed).
  - **B4 / SEC-20 — `MediaPickerField` rejects unsafe media URLs inline:** `isLikelySafeMediaSrc` allowlist (https / http / `/public` paths / `data:image/*` / `data:video/*`; rejects `javascript:`, `data:text/html`, `vbscript:`, `file:`, scheme-less ambiguous, control chars). When the operator types a rejected URL the preview short-circuits to a red "Unsafe URL blocked" placeholder and an inline error explains the allowlist; the text input keeps the typed value so the operator sees the bad paste and can correct it.
  - **B5 / SEC-19 — `stripAngleBracketTags` extended:** helper now accepts `string | null | undefined`. Applied at every storefront chrome surface that renders a CMS plain-text field: `AnnouncementBar` (message + ctaLabel), `StickyHeader` (announcement.message, desktop + drawer nav labels), `SiteFooter` (footerTagline, footerMicroCaption, group title, link labels, copyright), `ProductCard` (product.name, product.role, colorway names). Persistence-level sanitization (schema transform on save) remains a Phase C task.
  - **B6 / SEC-13 — uniform sign-up response (no email enumeration):** `/auth/sign-up` onError no longer calls `form.setError('email', 'This email is already registered.')` for `STOREFRONT_ACCOUNT_EMAIL_TAKEN`. Every failure (already-taken, validation, network) now produces the same neutral toast. SEC-13 inline comment notes that real auth (Phase J1) must also match success-response *timing* server-side to fully neutralize the oracle.
  - **B7 / SEC-15 — HTTPS-normalize SEO image URLs:** `absoluteImageUrl` in `src/shared/components/seo/structuredData.ts` upgrades `http://` to `https://` for every JSON-LD / OG / canonical surface so mixed-content image URLs from admin catalog data can't degrade those pages.
- Files changed: new `src/shared/lib/url.ts`, new `src/shared/lib/__tests__/url.test.ts`, new `src/shared/components/ui/SafeLink.tsx`, new `src/shared/components/ui/__tests__/SafeLink.test.tsx`, new `src/shared/components/ui/__tests__/MediaPickerField.test.tsx`, new `src/shared/lib/__tests__/stripAngleBracketTags.test.ts`, new `src/routes/auth/__tests__/-sign-up.test.ts`, `src/shared/components/ui/index.ts`, `src/shared/components/ui/MediaPickerField.tsx`, `src/shared/components/ui/ProductCard.tsx`, `src/shared/components/layout/AnnouncementBar.tsx`, `src/shared/components/layout/SiteFooter.tsx`, `src/shared/components/layout/StickyHeader.tsx`, `src/shared/components/seo/structuredData.ts`, `src/shared/lib/stripAngleBracketTags.ts`, `src/features/marketing/components/HeroForgeSequence.tsx`, `src/features/marketing/components/DropRevealSection.tsx`, `src/features/marketing/components/PiecesGrid.tsx`, `src/routes/shop/$slug.tsx`, `src/routes/auth/sign-up.tsx`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` — typecheck 0 errors, **122/122 tests passed across 12 files** (was 42/7 after PR #9; +80 tests this PR), `vite build` success. Coverage breakdown for the new helpers: `url.ts` 51 assertions across sanitizeHref + isExternalHref + isLikelySafeMediaSrc + upgradeHttpToHttps; SafeLink 12 (external/internal/rejected branching incl. forceExternal); MediaPickerField 5 (empty fallback, safe data URI, `javascript:` block, `data:text/html` block, scheme-less block); stripAngleBracketTags 4; sign-up regression guard 4. The sign-up onError change is hard to exercise end-to-end without a TanStack Router + Query rig, so the test is a string-level regression guard documented in the file.
- Notes/debt: Phase B is now complete. Remaining Phase B7 nuance (warn in admin on save for `http://` image URLs) is a small ergonomic follow-up — the runtime SEO path is already protected. Next high-leverage targets: Phase C (`createJsonStore` + Zod-validate non-drop persistence — closes SEC-07 across products / website-layout / global-brand / legacy landing), Phase D (move CMS reads out of `features/admin/**`), and Phase E (split the 600+ line editors). Admin auth gate remains unchanged.

## 2026-05-17 — Audit Phase A foundations + Cursor rules + testing infra
- Summary: First execution pass against `docs/audit-2026-05-17.md` (delivered on PR #8 / `cursor/full-app-audit-289d`). Lands the safety-net Phase A tasks and two Phase B quick wins, plus a `.cursor/rules/*` rule set and an AGENTS.md update so future agents abide by the audit. Admin auth in `src/features/admin/auth/**` is intentionally **unchanged** per direction — it remains the documented temporary `VITE_ANVL_ADMIN_*` static gate until a real auth provider lands (Phase J1; hosted-demo blockers `SEC-01`/`SEC-02`/`SEC-03`/`SEC-11` stay flagged in `docs/technical-debt.md`).
  - **Rules (`.cursor/rules/`):** `00-anvl-overview.mdc` (always-on working agreement + Definition of Done + out-of-scope list), `10-security.mdc` (admin-auth-locked, Zod-or-no-merge for CMS persistence, `sanitizeHref` policy, no new `VITE_*` secrets, no `"latest"` deps), `20-performance-bundle.mdc` (every admin route uses `lazyRouteComponent`, storefront/admin import boundary, GSAP matchMedia gate, image/font hygiene), `30-responsiveness-a11y.mdc` (mobile-first type scale, ≥44 px touch targets, focus-ring everywhere, dialog focus-trap, safe-area, iOS-zoom-prevention), `40-solid-maintainability.mdc` (300/500 line budget, presentational components, folder boundaries, helper extraction triggers), `50-testing.mdc` (Vitest is the safety net, coverage per area, layout conventions). `AGENTS.md` now mandates reading the audit per task, adds the "Admin auth — locked" section, and rewrites Definition of Done around `pnpm verify` + Vitest + audit task status updates.
  - **Phase A1 — testing infrastructure:** `vitest.config.ts` (separate from `vite.config.ts`, jsdom env, `css: false`, path aliases, v8 coverage), `src/test/setup.ts` (RTL cleanup, `localStorage`/`sessionStorage` reset, `matchMedia` / `IntersectionObserver` / `ResizeObserver` polyfills). Scripts: `test`, `test:watch`, `test:coverage`, `test:related`, `verify` (typecheck + test + build). **42 tests across 7 files** covering: `sanitizeCssValue` (active-drop CSS injection rejects), `persistedDropSchema` (SEC-07 tamper guard), `drops.actSequence` normalize (canonical order across partial/shuffled/null/undefined/unknown-key inputs), `shopUrlSearch` (validate + filter + aggregations), `JsonLd` (`<` escaped to `\u003c` to defeat `</script>`), `createRuntimeClients` (SEC-08 SSR vs browser contract), `ErrorBoundary` (catch + reset + resetKey).
  - **Phase A2 / MAINT-11 — error boundaries:** `src/app/components/ErrorBoundary.tsx` (generic class boundary with render-prop fallback + reset + resetKey-driven auto-reset), `AppErrorBoundary.tsx` (ANVL-branded storefront fallback — "Forge interrupted" — retry + back-to-home), `AdminErrorBoundary.tsx` (admin-only fallback that keeps the admin chrome usable when a panel throws). Wired into `__root.tsx` (around the storefront `<Outlet />`, pathname-keyed) and `routes/admin/route.tsx` (around the admin `<Outlet />`, pathname-keyed).
  - **Phase A3 / PERF-06:** `pnpm analyze` script added — runs `ANVL_ANALYZE=1 vite build` so the analyzer in `vite.config.ts` writes `dist/stats.html` per docs.
  - **Phase A4 / SEC-23:** Six `@tanstack/*` `"latest"` specifiers pinned to carets at the resolved versions (`react-devtools ^0.10.2`, `react-router ^1.169.2`, `react-router-devtools ^1.166.13`, `react-router-ssr-query ^1.166.12`, `react-start ^1.167.64`, `devtools-vite ^0.6.0`). Lockfile reconciled — no resolved-version drift.
  - **Phase B1 / SEC-06:** `.env.example` no longer ships the realistic-looking `Test123@` password. Replaced with a loud warning block (Vite inlines `VITE_*` into the public JS) + a neutral placeholder (`changeme-please-set-a-strong-local-password`) + an `openssl rand -base64 24` hint + a pointer at `docs/technical-debt.md`.
  - **Phase B2 / SEC-22:** `TanStackDevtools` in `__root.tsx` gated by `import.meta.env.DEV` — belt-and-braces alongside `@tanstack/devtools-vite`'s `removeDevtoolsOnBuild` default.
- Files changed: `.cursor/rules/00-anvl-overview.mdc`, `10-security.mdc`, `20-performance-bundle.mdc`, `30-responsiveness-a11y.mdc`, `40-solid-maintainability.mdc`, `50-testing.mdc`, `AGENTS.md`, `vitest.config.ts`, `src/test/setup.ts`, `package.json`, `pnpm-lock.yaml`, `src/app/components/ErrorBoundary.tsx`, `AppErrorBoundary.tsx`, `AdminErrorBoundary.tsx`, `src/routes/__root.tsx`, `src/routes/admin/route.tsx`, `.env.example`, `src/app/__tests__/runtime.test.ts`, `src/app/__tests__/ErrorBoundary.test.tsx`, `src/features/admin/drops/__tests__/dropPaletteStyle.test.ts`, `drops.persistence.zod.test.ts`, `drops.actSequence.test.ts`, `src/features/products/shop/__tests__/shopUrlSearch.test.ts`, `src/shared/components/seo/__tests__/JsonLd.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` (typecheck 0 errors, test 42/42 passed across 7 files, build success). Manual: tests assert `<` escaping in JSON-LD vs the literal `</script><img onerror=...>` payload and reject `expression(`, `javascript:`, `@import`, `<>`, `{}`, oversize input for the CSS sanitizer. Smoke-tested locally that `import.meta.env.DEV` is truthy under `pnpm dev` and falsey under `pnpm build`.
- Notes/debt: Admin auth gate (`src/features/admin/auth/**`) intentionally unchanged this PR — see Section "Admin auth — locked" in `AGENTS.md`. Phase tracker and follow-ups live in `docs/audit-2026-05-17.md` on `cms` (supersedes open PR #8, which was docs-only and never merged).

## 2026-05-17 — CMS code-review follow-ups
- Summary: Applied the senior-engineer review fixes against PR #7. (1) `ViewportIframe.initialize` is now idempotent and disconnects any prior `MutationObserver` before installing a new one — eliminated a one-observer-per-mount leak when `iframe.contentDocument.readyState === 'complete'` arrived synchronously. (2) Deleted now-dead `HexColorPicker.tsx` and `ImageFileOrUrlField.tsx`; pulled them out of the public UI barrel. (3) Loosened `URL_OR_PATH_PATTERN` to accept param-less `data:` URIs (`data:image/svg+xml,<svg/>` no longer flags as invalid). (4) Added `useWebsiteLayout()` (mirrors `useDropsList` shape via `useSyncExternalStore` + `subscribeWebsiteLayoutChange`) and routed the drop editor preview through it; switched the products map to read from the already-reactive `useAdminProductsList()` snapshot so cross-tab layout/product changes refresh the preview. (5) Upgraded the remaining raw text inputs in `DropActsBuilderPanel` (hero `backgroundImageUrl` + `emblemWatermarkSrc`, drop-reveal `dropVisualSrc`, final-CTA `backgroundImageUrl`, lookbook `galleryItems[].src`) to `MediaPickerField` so every act media slot is drag-and-drop with crest preview. (6) Relabelled the per-field "Leave empty (no fallback)" toggle to "Hide crest preview" with a tooltip explaining that the flag is editor-only state today; documented the persisted-`leaveEmpty` plan under a "Persisted leaveEmpty (planned follow-up)" doc section in `drops-cms.md`. (7) Gated the "or drag & drop" affordance behind `@media (hover: hover) and (pointer: fine)` so touch-first devices don't see a misleading desktop-only hint, and the drop handler short-circuits accordingly. (8) Added a maintenance note in `drops-cms.md` that `PREVIEW_RESET_CSS` is an enumeration to keep in sync when new act renderers introduce `data-*` animation attributes (with a sketch of the eventual single-token replacement). Minor: simplified an identical-branch ternary in `ColorField` initial state.
- Files changed: `src/features/admin/drops/DropEditorLivePreview.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/drops/DropActsBuilderPanel.tsx`, `src/features/admin/drops/drops.editor.validation.ts`, `src/features/admin/website-layout/useWebsiteLayout.ts` (new), `src/shared/components/ui/ColorField.tsx`, `src/shared/components/ui/MediaPickerField.tsx`, `src/shared/components/ui/index.ts`, deleted `src/shared/components/ui/HexColorPicker.tsx` + `src/shared/components/ui/ImageFileOrUrlField.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass). Manual: verified Visuals tab uses "Hide crest preview" copy; Hero act exposes `Background image` + `Emblem / watermark` as MediaPickerFields; Lookbook act exposes all 5 gallery items as MediaPickerFields.
- Notes/debt: `leaveEmpty` persistence remains an explicit follow-up — when ready, add `Drop.visualsLeaveEmpty?: Partial<Record<keyof DropVisuals, boolean>>` plus a renderer-side resolver, then flip the toggle label back to its stronger semantics.

## 2026-05-16 — Drop preview: responsive iframe simulation for Mobile / Tablet / Desktop
- Summary: Upgraded `DropEditorLivePreview` so the **Mobile / Tablet / Desktop** viewport pills render the preview inside a portal-into-iframe at the simulated width. Tailwind responsive variants (`sm:` / `md:` / `lg:`) now evaluate against the simulated device width rather than the admin window width, so every act renderer (hero, manifesto, drop reveal, pieces, materials, waitlist) reflows into its true mobile / tablet / desktop layout. **Fit** remains a no-iframe, full-pane render and is still the default. Added `PREVIEW_RESET_CSS` to neutralize GSAP intro states across all act data attributes (`[data-hero-*]`, `[data-drop-*]`, `[data-oath-*]`, `[data-pieces-*]`, `[data-mm-*]`, `[data-join-*]`) so the preview shows the final layout instead of animation-frozen `opacity:0` states. Iframe width transitions use `cubic-bezier(0.16, 1, 0.3, 1)` over 380 ms for smooth resizes, and a subtle device-frame chrome (rounded panel + dot row + `/drop/preview` caption) wraps the constrained viewports. The iframe scaffold copies parent stylesheets / fonts to its `<head>` and installs a `MutationObserver` to mirror live HMR + active-drop theme updates.
- Files changed: `src/features/admin/drops/DropEditorLivePreview.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass). Manual: switched between Fit / Mobile 390 / Tablet 820 / Desktop 1280 on `/admin/drops/drop_the-oath`; verified the hero collapses to a single-column mobile layout at 390 px (no truncated desktop layout), tablet shows comfortable mid-width spacing, desktop unlocks the multi-column hero grid; scrolled the desktop iframe to confirm manifesto / drop-reveal / pieces acts render their final layouts cleanly without frozen GSAP intro states.
- Notes/debt: Animations themselves (GSAP timelines + ScrollTrigger) don't replay inside the constrained preview iframe because the act components execute in the parent's JS context (`window.matchMedia` / `ScrollTrigger` look at the parent window). The live `/drop/$slug` route is the source of truth for cinematic animation review; the preview prioritizes accurate, jank-free responsive layout QA. If a future iteration wants live animations inside the preview, the simplest path is to inject a `gsap-context` provider keyed to the iframe `contentWindow` so matchMedia / ScrollTrigger bind to the iframe's window — non-trivial but additive.

## 2026-05-16 — CMS UX overhaul: preview-centric drop editor + full color/media pickers
- Summary: Rebuilt the Drop Editor as a **preview-centric** workspace where the live preview claims the wider column on desktop and the editor lives in a compact tabbed side panel (Basics / Theme / Visuals / Acts / Products / SEO). Introduced two new shared CMS field components: `ColorField` (native color wheel + HEX text input + RGB channel inputs + opacity slider, parses & emits hex/rgb/rgba) and `MediaPickerField` (drag-and-drop on desktop, file picker fallback, paste-URL fallback, image+SVG+video support, MIME/size validation, ANVL crest preview as the default for empty logo-like fields, optional per-field "Leave empty (no fallback)" toggle). Wired both components through the drop editor (theme, visuals, SEO OG image), Acts builder (act image + video), Website Layout (header + footer logos), Theme & Brand fallbacks, and Product Editor swatches. Replaced legacy `HexColorPicker` / `ImageFileOrUrlField` usages and removed redundancy: legacy Act I–VI cards are now collapsed under a single "Legacy section copy" disclosure inside `DropLandingActsEditor`, with the Acts builder as the canonical surface. Added field-level validations (slug uniqueness + pattern, color validity, URL-or-path checks, alt text required when emblem set, SEO title/description lengths, schedule + release date validity) surfaced inline next to each input plus red dots on errored tabs; save attempts auto-jump to the first errored section.
- Files changed: `src/shared/lib/color.ts` (new), `src/shared/components/ui/ColorField.tsx` (new), `src/shared/components/ui/MediaPickerField.tsx` (new), `src/shared/components/ui/index.ts`, `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/drops/DropLandingActsEditor.tsx`, `src/features/admin/drops/DropActsBuilderPanel.tsx`, `src/features/admin/drops/drops.editor.validation.ts`, `src/features/admin/components/AdminCard.tsx`, `src/features/admin/products/ProductEditorRoute.tsx`, `src/routes/admin/website-layout.tsx`, `src/routes/admin/theme.tsx`, `docs/design-system.md`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass). Manual smoke: open `/admin/drops/$dropId`, confirm preview pillar takes the wider column on `lg+`, theme tab opens the native color picker and shows HEX/RGB/alpha inputs round-tripping to `rgba(...)`, visuals tab accepts drag-and-drop image upload, paste-URL fallback, and toggling "Leave empty" hides the crest preview; SEO tab shows length counters and reds out over-long copy; entering an invalid slug surfaces inline + red tab dot, save auto-jumps to Basics.
- Notes/debt: `MediaPickerField` "Leave empty" is UI-only state today — the storage field stays `''` either way. If the public renderer ever needs to differentiate explicit empty from "use crest", we can add an optional `visualsLeaveEmpty?: Partial<Record<keyof DropVisuals, boolean>>` to `Drop` without breaking persistence (the merge already tolerates extra keys). The legacy Act I–VI form still exists under a disclosure because some marketing renderers still read `DropLandingContent`; once every act renderer reads from `Drop.acts`, the disclosure block can be deleted entirely.

## 2026-05-14 â€” Shop + PDP refactor (Prompt 12)
- Summary: Public `/shop` lists the full visible catalog with URL-driven filters (status, drop, source, color, in-stock size, price), debounced search, and a mobile bottom-sheet filter drawer plus desktop sidebar. PDP adds per-colorway galleries, optional YouTube embed and 3D link placeholder, disabled OOS sizes, accordions, smarter related products, and richer `productJsonLd`. `CommerceClient` gains `getShopListingCatalog`; mapper builds `ProductShopMeta` from admin inventory.
- Files changed: `src/features/products/types/product.types.ts`, `products.mapper.ts`, `products.commerce.ts`, `src/app/config/clients.ts`, `commerceClient.mock.ts`, `src/features/cms/api/cmsClient.mock.ts`, `src/features/admin/landing-cms/landingCms.types.ts`, `src/features/admin/drops/drops.types.ts`, `src/features/products/shop/shopUrlSearch.ts`, `ShopFiltersForm.tsx`, `src/routes/shop/index.tsx`, `src/routes/shop/$slug.tsx`, `src/features/products/pdp/videoEmbed.ts`, `Drawer.tsx`, `AccordionDisclosure.tsx`, `src/shared/components/ui/index.ts`, `ProductCard.tsx`, `ProductGallery.tsx`, `ColorSwatch.tsx`, `SizeSelector.tsx`, `structuredData.ts`, `seoMeta.ts`, `src/routes/admin/index.tsx`, `DropEditorRoute.tsx`, `src/features/admin/hooks/useSaveSuccessFlash.ts`, storefront links (`about`, `size-guide`, `cart`, `checkout/success`, `DropActivePageView`), `docs/features/products-commerce.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: `/shop` â€” filters update URL, mobile Filters drawer, debounced search; PDP â€” color/size availability, video when URL set, accordions; JSON-LD in view-source.
- Notes/debt: Medusa-backed `CommerceClient` must implement `getShopListingCatalog` when swapping off mock data. **Type alignment:** optional meta/Twitter/robots fields on `LandingSeoContent` and `DropSeo`, spread-based `applySeoPatch` in the mock CMS, and a single `AccordionDisclosure` export (removed duplicate `Accordion.tsx`) keep `pnpm typecheck` green with `seoMeta` and PDP accordions. **Admin glue:** dashboard cards derive from `adminNavGroups`; `DropEditorRoute` imports the `Check` icon for save confirmation and uses `useSaveSuccessFlash` for the save button state.

## 2026-05-14 â€” Admin dashboard declutter (Prompt 17)- Summary: Flattened admin navigation into `adminNavItems` with cluster grouping in the sidebar, added `/admin/media` (contextual media guide) and `/admin/settings` (session + local CMS reset danger zone), decluttered the dashboard to card CTAs only, added `useSaveSuccessFlash` for drop/product save buttons, improved drop list and catalog empty states, confirmed product archive via modal, kept drop editor preview prominent (mobile-first column order + sticky card on large screens), and wired `scripts/repatch-admin-route-tree.mjs` into `pnpm dev`, `pnpm build`, and `pnpm typecheck` so `/admin/media` and `/admin/settings` stay registered after TanStack regenerates `routeTree.gen.ts`.- Files changed: `src/features/admin/components/adminNav.ts`, `AdminSidebar.tsx`, `src/features/admin/hooks/useSaveSuccessFlash.ts`, `src/routes/admin/index.tsx`, `src/routes/admin/media.tsx`, `src/routes/admin/settings.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `DropsAdminList.tsx`, `src/features/admin/products/ProductEditorRoute.tsx`, `src/routes/admin/products/index.tsx`, `src/shared/components/ui/Modal.tsx`, `src/routeTree.gen.ts` (via repatch script), `scripts/repatch-admin-route-tree.mjs`, `package.json`, `docs/design-system.md`, `docs/features/drops-cms.md`, `docs/features/products-commerce.md`, `docs/features/seo.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck` (exit 0), `pnpm build` (exit 0); manual: `/admin` cards and sidebar clusters; `/admin/media` + `/admin/settings`; drops list empty + filtered empty; products catalog empty + filtered empty + archive modal; drop editor save flash + preview column; product editor save flash; archive dialog exposes `aria-labelledby` on the dialog surface.- Notes/debt: Router codegen should eventually emit `media`/`settings` without the repatch script; until then keep `scripts/repatch-admin-route-tree.mjs` aligned with `routeTree.gen.ts` anchors.## 2026-05-14 â€” Header/footer/navigation/socials CMS (Prompt 14)- Summary: Hardened global website layout CMS: `/drop/*` nav rows are documented as the active-campaign slot with read-only label/href in admin, save validation requires at least one desktop `/drop/` link, optional â€œAdd /drop/ campaign slotâ€ recovery control, and protection against removing the last header campaign row. Default layout omits `logoStackedSrc` so the public shell uses bundled `AnvlLogoImage`; merge/save normalizes empty logo strings. Added reserved `logoMediaAssetId` on header/footer types, `websiteLayout.nav.ts` helper, and public footer social list semantics (`ul`/`li`, external link `aria-label`) plus nav `aria-label`s on `StickyHeader`.- Files changed: `src/features/admin/website-layout/websiteLayout.nav.ts`, `websiteLayout.types.ts`, `websiteLayout.defaults.ts`, `websiteLayout.service.ts`, `src/features/admin/drops/drops.migrate.ts`, `src/routes/admin/website-layout.tsx`, `src/shared/components/layout/SiteFooter.tsx`, `StickyHeader.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass). Manual: `/admin/website-layout` â€” `/drop/` rows read-only, cannot delete last campaign slot, â€œAdd /drop/ campaign slotâ€ when invalid; save; `/` shows socials from CMS and bundled logo when logo fields empty.- Notes/debt: `saveWebsiteLayoutContent` throws if validation fails â€” admin route pre-validates with `getWebsiteLayoutSaveError`; programmatic callers must pass a layout that includes a `/drop/` header row.## 2026-05-14 â€” Customer auth, account, and orders UI (Prompt 15)- Summary: Added mock storefront `AccountClient` (`accountContracts`, `accountMock`, `accountSession` with sessionStorage-backed demo session pointer), `runtimeClients.account`, and the `storefront-account` feature (Zod + RHF forms, TanStack Query, Zustand session, Lebanon payment labels). Public routes: `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`, and `/account` layout with overview, personal info, addresses (field array), orders list, and order detail. Account/auth pages use `buildSeoMeta` with `noIndex`. Header CMS default includes an Account link. Fixed duplicate `defaultShopUrlSearch` import in `size-guide`, missing `ADMIN_PASSWORD` import in `AdminAuthProvider`, and shop mobile `Drawer` props to match the shared Drawer API.- Files changed: `src/app/config/accountContracts.ts`, `accountMock.ts`, `accountSession.ts`, `clients.ts`, `runtime.ts`, `src/app/seo/meta.ts`, `src/features/storefront-account/*`, `src/routes/account/**`, `src/routes/auth/*`, `src/features/admin/landing-cms/landingCms.defaults.ts`, `src/features/admin/auth/AdminAuthProvider.tsx`, `src/routes/shop/index.tsx`, `src/routes/size-guide.tsx`, `src/routeTree.gen.ts`, `docs/features/auth-accounts-orders.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: sign in with `demo@anvl.lb` / `demo1234`, session survives refresh, `/account` subnav, save personal + addresses, view orders and order detail, sign out; unauthenticated `/account/*` redirects to sign-in with return path; auth pages use `noindex` robots meta.- Notes/debt: Password check is demo-only; `mockAccountSignUp` does not persist passwords. Real auth must be server-side with httpOnly cookies or an IdP. `routeTree.gen.ts` is regenerated by the Vite build.## 2026-05-14 â€” Configurable Acts Builder in Drop Editor (Prompt 07)- Summary: Ship the Drop Editor acts builder (`DropActsBuilderPanel`) for add/remove/reorder, enable/disable, nature and preset selection, and shared copy fields on each act, wired to `Drop.acts` and `landingActSequence`. Added `landingActs.seed.ts` to bootstrap acts from legacy `DropLandingContent`, `landingActs.zod.ts` for per-nature `content` validation helpers, and extended `PublicLandingAct` with `slotKey` and `enabled` in the normalize pipeline. Drop preview uses `composeLandingPageFromDrop` with `PublicLandingActs`; the public homepage skips disabled acts and maps `storytelling` to the manifesto renderer.- Files changed: `src/features/admin/drops/DropActsBuilderPanel.tsx`, `DropLandingActsEditor.tsx`, `DropEditorRoute.tsx`, `acts/landingActs.types.ts`, `acts/landingActs.normalize.ts`, `acts/landingActs.seed.ts`, `acts/landingActs.zod.ts`, `src/features/marketing/public-landing/PublicLandingActs.tsx`, `src/features/cms/api/cmsClient.mock.ts`, `docs/features/drops-cms.md`, `docs/features/acts-builder.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass); manual: `/admin/drops/:id` â†’ Landing acts â€” reorder, disable an act, confirm preview; `/` still renders via `PublicLandingActs`.- Notes/debt: Act copy fields on `Drop.acts` are not yet merged into `DropLandingContent` for the existing marketing components (public copy still comes from the legacy landing object). Media pickers and deep `content` JSON editing are deferred.## 2026-05-14 â€” Shop + PDP refactor (Prompt 12)- Summary: Public `/shop` lists the full visible catalog with URL-driven filters (status, drop, source, color, in-stock size, price), debounced search, and a mobile bottom-sheet filter drawer plus desktop sidebar. PDP adds per-colorway galleries, optional YouTube embed and 3D link placeholder, disabled OOS sizes, accordions, smarter related products, and richer `productJsonLd`. `CommerceClient` gains `getShopListingCatalog`; mapper builds `ProductShopMeta` from admin inventory.- Files changed: `src/features/products/types/product.types.ts`, `products.mapper.ts`, `products.commerce.ts`, `src/app/config/clients.ts`, `commerceClient.mock.ts`, `src/features/cms/api/cmsClient.mock.ts`, `src/features/admin/landing-cms/landingCms.types.ts`, `src/features/admin/drops/drops.types.ts`, `src/features/products/shop/shopUrlSearch.ts`, `ShopFiltersForm.tsx`, `src/routes/shop/index.tsx`, `src/routes/shop/$slug.tsx`, `src/features/products/pdp/videoEmbed.ts`, `Drawer.tsx`, `AccordionDisclosure.tsx`, `src/shared/components/ui/index.ts`, `ProductCard.tsx`, `ProductGallery.tsx`, `ColorSwatch.tsx`, `SizeSelector.tsx`, `structuredData.ts`, `seoMeta.ts`, `src/routes/admin/index.tsx`, `DropEditorRoute.tsx`, `src/features/admin/hooks/useSaveSuccessFlash.ts`, storefront links (`about`, `size-guide`, `cart`, `checkout/success`, `DropActivePageView`), `docs/features/products-commerce.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: `/shop` â€” filters update URL, mobile Filters drawer, debounced search; PDP â€” color/size availability, video when URL set, accordions; JSON-LD in view-source.- Notes/debt: Medusa-backed `CommerceClient` must implement `getShopListingCatalog` when swapping off mock data. **Type alignment:** optional meta/Twitter/robots fields on `LandingSeoContent` and `DropSeo`, spread-based `applySeoPatch` in the mock CMS, and a single `AccordionDisclosure` export (removed duplicate `Accordion.tsx`) keep `pnpm typecheck` green with `seoMeta` and PDP accordions. **Admin glue:** dashboard cards derive from `adminNavGroups`; `DropEditorRoute` imports the `Check` icon for save confirmation and uses `useSaveSuccessFlash` for the save button state.## 2026-05-14 â€” Active drop page + dynamic nav (Prompt 10)- Summary: Finished wiring the public drop experience: root layout injects sanitized active-drop palette CSS on SSR for public routes, `/drop/:slug` uses `runtimeClients.cms.getActiveDrop()` with slug redirect, `DropActivePageView` (hero backdrop, release countdown, product cards to PDP), and route head passes `ogTitle` / `ogDescription` into `buildSeoMeta`. Drop editor adds optional release datetime and hero backdrop fields.- Files changed: `src/routes/__root.tsx`, `src/routes/drop/$slug.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `docs/features/drops-cms.md`, `docs/features/seo.md`, `docs/changelog.md` (plus existing Prompt 10 building blocks already on branch: `dropPaletteStyle.ts`, `DropActivePageView.tsx`, `DropReleaseSection.tsx`, `drops.compose.ts` nav labels, `meta.ts`, `ActiveDropThemeBridge.tsx`, `cms.types.ts`).- Tests/manual checks: `pnpm typecheck`, `pnpm build`; `pnpm test` (no spec files, Vitest exits 1). Manual: `/drop/the-oath` (active slug), nav label matches `drop.title`, view page source for `#anvl-active-drop-theme-ssr` outside `/admin`, product cards open PDPs.- Notes/debt: `getStorefrontProductsForDropSlug` remains synchronous; only the CMS active-drop read is awaited in the route loader.# ChangelogCursor agents must append every completed task here.## Format```md## YYYY-MM-DD ΓÇö Task title- Summary:- Files changed:- Tests/manual checks:- Notes/debt:```## 2026-05-14 — Drop Editor live preview (Prompt 08)- Summary: Added `DropEditorLivePreview` with mobile/tablet/desktop viewport toggles, scoped `DropPreviewThemeScope` for instant palette CSS variables, and `DropEditorPreviewErrorBoundary` so invalid draft renders surface CMS recovery instead of a blank panel. Preview composes with `useDraftActsPipeline` and `publicLandingActsFromDraftActs` so `Drop.acts` order and enable flags match `PublicLandingActs` immediately; unknown act natures use `cmsPreview` warnings. Moved preview memos before the missing-drop early return to satisfy React hook rules.- Files changed: `src/features/admin/drops/DropEditorLivePreview.tsx`, `DropEditorRoute.tsx`, `drops.compose.ts`, `acts/landingActs.normalize.ts`, `PublicLandingActs.tsx`, `docs/features/drops-cms.md`, `docs/features/acts-builder.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: `/admin/drops/:id` — theme + acts + viewport toggles; unsupported act shows amber CMS notice; Save still persists.- Notes/debt: Public homepage compose still uses `landingActSequence` only until the published pipeline opts into draft acts.## 2026-05-14 — Configurable Acts Builder in Drop Editor (Prompt 07)- Summary: Ship the Drop Editor acts builder (DropActsBuilderPanel) for add/remove/reorder, enable/disable, nature and preset selection, shared copy fields, **act-level media** (ActMedia on LandingAct), **animation controls**, expanded per-nature **content Zod schemas** with compact sub-forms (hero/manifesto/storytelling/drop-reveal/product/material/special-event/lookbook/newsletter/final-CTA), and **product-showcase SKU pickers** fed from the admin catalog. Wired to Drop.acts, landingActSequence, and catalogProducts from DropEditorRoute. Bootstrap rows in landingActs.seed.ts now include default nimation. Extended PublicLandingAct with slotKey and enabled in the normalize pipeline. Drop preview uses composeLandingPageFromDrop with PublicLandingActs; the public homepage skips disabled acts and maps storytelling to the manifesto renderer.- Files changed: src/features/admin/drops/DropActsBuilderPanel.tsx, DropLandingActsEditor.tsx, DropEditorRoute.tsx, cts/landingActs.types.ts, cts/landingActs.normalize.ts, cts/landingActs.seed.ts, cts/landingActs.zod.ts, src/features/marketing/public-landing/PublicLandingActs.tsx, docs/features/drops-cms.md, docs/features/acts-builder.md, docs/changelog.md- Tests/manual checks: pnpm typecheck (pass), pnpm build (pass); manual: /admin/drops/:id → Landing acts — edit hero countdown + CTAs in content panel, toggle animation, attach act media, pick SKUs on product showcase, reorder/disable acts, confirm preview; / still renders via PublicLandingActs.- Notes/debt: Top-level act copy and content fields on Drop.acts are stored but **not yet merged** into DropLandingContent for existing marketing components (public copy still comes from the legacy landing object). productIds on a showcase act are persisted only; the live homepage grid still uses the full drop product list until compose consumes act-level SKUs.## 2026-05-14 ΓÇö Drop editor shell (prompt 06)- Summary: Sectioned `/admin/drops/:id` editor with basic info, theme and branding, acts/products/SEO placeholders, save and publish with validation, optional activate-after-save, and schedule fields; `landingActSequence` normalized via `drops.actSequence.ts`.- Files changed: `DropEditorRoute.tsx`, `drops.editor.validation.ts`, `drops.actSequence.ts`, `drops.types.ts`, `drops.service.ts`, `drops.defaults.ts`, `drops.migrate.ts`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: edit drop, validate slug errors, save with confirmation, schedule datetime.- Notes/debt: Acts builder, product pickers, SEO fields, and live preview remain placeholders until later prompts.## 2026-05-14 ΓÇö Drops admin list (CMS shell, prompt 05)- Summary: Implemented the simplified Drops CMS list at `/admin/drops` with responsive table and card layouts, search and status tabs, columns for release date, scheduled activation, product count, and last edited time, and actions wired through `CmsClient` and TanStack Query. Extended `Drop` with `scheduled` status plus `releaseDate` and `scheduledActivationAt`; the drops service supports duplicate, archive, schedule, and safer active selection when deleting or archiving.- Files changed: `src/features/admin/drops/drops.types.ts`, `drops.defaults.ts`, `drops.service.ts`, `DropsAdminList.tsx`, `dropsListUi.store.ts`, `useAdminDropsListQuery.ts`, `src/features/cms/types/adminDrops.types.ts`, `src/app/config/clients.ts`, `src/features/cms/api/cmsClient.localStorage.ts`, `src/features/cms/api/cmsClient.seed.ts`, `src/routes/admin/drops/index.tsx`, `DropEditorRoute.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `pnpm run typecheck`, `pnpm run build`; manual: `/admin/drops` search and tabs, activate with confirmation, schedule, archive, delete, duplicate, mobile card layout.- Notes/debt: Automatic activation at `scheduledActivationAt` is not implemented (storage and admin UI only). Admin drops APIs live on `CmsClient` (not `SeoClient`) alongside runtime SEO split from prompt 03.## 2026-05-14 ΓÇö Public layout active drop theme (prompt 04)- Summary: Added `ActiveDropThemeProvider`, shared `dropPaletteStyle` helpers, `CmsClient.getActiveDrop()`, SSR `<style>` injection on the root route for public pages, and client-side sync when drops change; admin routes skip global theme injection. Removed global `:root` mutation from `AppProviders` / `ActiveDropThemeBridge` in favor of the provider + head pipeline.- Files changed: `src/app/config/clients.ts`, `src/features/cms/api/cmsClient.localStorage.ts`, `src/features/cms/api/cmsClient.seed.ts`, `src/features/admin/drops/dropPaletteStyle.ts`, `src/app/providers/ActiveDropThemeProvider.tsx`, `src/app/providers/ActiveDropThemeBridge.tsx`, `src/app/providers/AppProviders.tsx`, `src/routes/__root.tsx`, `docs/design-system.md`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass), `pnpm test` (no test files in repo; exits 1). Manual: load `/` and confirm themed surfaces; open `/admin` and confirm default/base chrome without campaign `:root` override; change active drop in admin and return to storefront to confirm palette updates.- Notes/debt: Future CMS adapters must implement `getActiveDrop()` with the same SSR-safe semantics as seed/localStorage clients.## 2026-05-14 ΓÇö Runtime client interfaces and seed/localStorage adapters- Summary: Introduced `SeoClient` and `SiteSettingsClient`, moved SEO off `CmsClient`, and added `createRuntimeClients({ isServer })` so SSR uses deterministic seed adapters while the browser uses localStorage-backed admin services. Shop index route demonstrates `runtimeClients.seo` in the loader. Removed legacy `cmsClient.mock` / `commerceClient.mock` modules. Updated architecture, drops CMS, SEO docs, and README.- Files changed: `src/app/config/clients.ts`, `src/app/config/runtime.ts`, `src/features/cms/api/*` (seed snapshots, `resolveSeoByPath`, CMS/SEO/site-settings seed + localStorage adapters), `src/features/products/api/commerceClient.seed.ts`, `src/features/products/api/commerceClient.localStorage.ts`, `src/features/admin/drops/DropsAdminList.tsx` (build stub), `src/routes/shop/index.tsx`, removed mock commerce/CMS clients, `docs/architecture.md`, `docs/features/drops-cms.md`, `docs/features/seo.md`, `README.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`, `pnpm vitest run --passWithNoTests` (no unit tests in repo yet); manual: `/shop` document title and meta description align with `SeoClient` output on full page load and client navigation.- Notes/debt: Analytics and payment clients remain mocks; other routes can adopt `SeoClient` incrementally; `runtimeClients.siteSettings` is ready for future header/footer loader refactors. Minimal `DropsAdminList` stub added because `origin/cms` imported the module without shipping the implementation (unblocks `pnpm build`).## 2026-05-14 ΓÇö Core CMS/catalog Zod schemas and Drop 01 seed- Summary: Added canonical Zod 4 schemas and inferred TypeScript types for drops, landing acts, catalog commerce products, SEO documents, money/media, navigation, and site settings; added validated seed for Drop 01 ΓÇö The Oath and three catalog placeholders (Oversized Tee, Stringer, Compression Tee) using ANVL brand tokens.- Files changed: `src/features/drops/**`, `src/features/landing/**`, `src/features/seo/**`, `src/features/products/schemas/commerce.schema.ts`, `src/features/products/types/commerce.types.ts`, `src/shared/schemas/**`, `src/shared/types/**`, `src/content/seed/drop-01-the-oath.seed.ts`, `docs/architecture.md`, `docs/changelog.md`, `docs/features/drops-cms.md`, `docs/features/acts-builder.md`, `docs/features/products-commerce.md`, `docs/features/seo.md`- Tests/manual checks: `pnpm exec tsc --noEmit` (pass); `pnpm build` (pass). `pnpm test` reports no test files in the repository.- Notes/debt: Storefront `Product` in `src/features/products/types/product.types.ts` remains the shop presentation model; canonical commerce document is `CatalogProduct` until adapters unify the two.## 2026-05-14 ΓÇö Prompt 01: Audit current app (architecture map)- Summary: Documented the as-built folder layout, all public and admin routes, CMS vs hard-coded surfaces, SSR/hydration risks, browser-only touchpoints, GSAP/Lenis/Framer usage, cart-to-checkout flow, a small-task refactor order, and high-risk files. Linked the inventory from `docs/architecture.md`.- Files changed: `docs/technical-debt.md`, `docs/architecture.md`, `docs/changelog.md`- Tests/manual checks: `pnpm build` (see task verification).- Notes/debt: No application code changes; audit reflects TanStack Router tree and `src/` layout at audit time.## 2026-05-14 ΓÇö Add project documentation and agent prompts- Summary: Added `AGENTS.md` at the repository root, populated `docs/` with core and feature documentation, and added the numbered Cursor prompt library under `docs/prompts/` per the documentation index.- Files changed: `AGENTS.md`, `docs/README.md`, `docs/*.md` (core docs), `docs/features/*.md`, `docs/prompts/*.md`, `README.md`, `docs/changelog.md`- Tests/manual checks: Verified file tree under `docs/` and `AGENTS.md` presence; no application code changes.- Notes/debt: Brand PDF/DOCX assets were already present under `docs/`; new markdown files sit alongside them.## 2026-05-14 ΓÇö Runtime client interfaces + seed / browser adapters (prompt 03)- Summary: Added `SeoClient` and `SiteSettingsClient`, extended `CmsClient` with `getActiveDrop()`, and introduced `createRuntimeClients({ isServer })` so SSR uses deterministic seed adapters while the browser uses localStorage-aligned services. `/shop` now loads SEO via `runtimeClients.seo`. Removed legacy `cmsClient.mock` / `commerceClient.mock` in favor of `*.seed.ts` and `*.localStorage.ts` modules.- Files changed: `src/app/config/clients.ts`, `src/app/config/runtime.ts`, `src/features/cms/api/*`, `src/features/products/api/commerceClient.*.ts`, `src/routes/shop/index.tsx`, `README.md`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`, `pnpm test`; manual: open `/shop`, view page source or devtools for meta title/description/canonical from `getSeoByPath('/shop')`.- Notes/debt: Analytics and payment remain mocks; `runtimeClients.siteSettings` is ready for future header/footer loader refactors.## 2026-05-14 ΓÇö Drop editor shell (prompt 06)- Summary: Scrollable drop editor shell with Basic info, Theme & branding, Acts/Products/SEO placeholders, Save & publish (validation, schedule, activate-after-save, modal, success flash), and preview placeholder. Added `scheduled` status and `scheduledActivationAt` on `Drop` with merge persistence. Added `drops.actSequence` and default `landingActSequence` on seeded/migrated drops so storage merges stay type-safe.- Files changed: `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/drops/drops.editor.validation.ts`, `src/features/admin/drops/drops.types.ts`, `src/features/admin/drops/drops.service.ts`, `src/features/admin/drops/drops.actSequence.ts`, `src/features/admin/drops/drops.defaults.ts`, `src/features/admin/drops/drops.migrate.ts`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `npm run typecheck` (no errors in drop editor paths); manual: `/admin/drops/$id` ΓÇö invalid save shows errors; confirm save shows toast; schedule persists ISO in localStorage.- Notes/debt: Acts builder, product assignment, and SEO forms are placeholders per prompt.