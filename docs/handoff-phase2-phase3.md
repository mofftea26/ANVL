# Handoff — Phase 2 (drop-builder deletion) + Phase 3 (Supabase apply)

> Paste the prompt below into a **separate session on a separate git branch/worktree**.
> Coordination: another session owns the landing, `storefront-account/**`, `routes/auth/**`,
> and the redesigned storefront pages. **Both** sessions edit `src/app/config/runtime.ts`
> and `src/app/config/clients.ts` — **land this deletion first**, then the other session rebases.
> Phase 3 needs the Supabase MCP connected, or apply SQL via the dashboard SQL editor / `supabase db push`.

---

You're continuing a large ANVL Athletics redesign on a **separate branch**. Your job: (1) finish the drop-builder/acts removal (Phase 2) and (2) apply the Supabase migrations (Phase 3). Another session is concurrently doing auth + landing — do **NOT** touch `src/routes/index.tsx`, `src/features/landingPages/**`, `src/features/storefront-account/**`, the `routes/auth/**` pages, or the redesigned storefront pages. You and the other session both edit `src/app/config/runtime.ts` and `src/app/config/clients.ts` — land your deletion first and say when it's merged.

Before coding, read `CLAUDE.md`, then `docs/cms-teardown-plan.md` (the full runbook + its "Deletion tendrils" section). Keep the build green at every step (`pnpm typecheck` / `pnpm build` / `pnpm test`) — note ONE pre-existing unrelated failing test (`actResponsiveTokens`); don't chase it.

**Phase 2 — already done & green:** the publication projection is drop-optional (`normalizeStorefrontPublicationRow` returns a projection without `published_drop_snapshot`), and nav types were relocated to `src/features/cms/navigation/navigation.types.ts`. **Remaining, in order:**
1. Re-source the seed nav off the delete set — `admin/website-layout/websiteLayout.defaults.ts` imports `admin/landing-cms/landingCms.defaults` (header link `/drop/the-oath`). Move the nav defaults to a drop-free module; repoint `/drop/the-oath` → `/shop`.
2. Repoint any remaining **typed** `Link to="/drop/*"` or `/admin/drops` (about.tsx is already done).
3. Rework `supabaseStorefrontReaders`, `storefrontCmsSync`, `storefrontReadFallback`, `seedSnapshots` off `composeLandingPageFromDrop` / `SEED_DROP`.
4. Gut `CmsClient` (`app/config/clients.ts`): remove `getActiveDrop`/`getLandingCmsContent`/`getHomepageContent` + the admin-drop methods; re-source `getNavigation`/`getAnnouncementBar` from the website layout; update `cmsClient.seed`, `cmsClient.localStorage`, `supabaseStorefrontReaders`, `runtime.ts`.
5. Delete the dead code (~40 files): `marketing/act-presets`, `marketing/public-landing`, `marketing/cinematic-hero`, `marketing/default-landing`, `cms/landing`, `drops`, `landing`, `admin/drops`, `admin/landing-cms`, `routes/admin/drops`, `routes/drop`, `cms/hooks/useLandingCms` + their tests + the `/admin/drops` nav item. Run `pnpm build` to regenerate `routeTree.gen.ts`; confirm `scripts/repatch-admin-route-tree.mjs` still matches.
6. Neutralize/delete drop refs in `shared/components/seo/structuredData.ts`, `cms/seoMeta.ts`, `cms/api/resolveSeoByPath.ts`, `app/providers/ActiveDropThemeProvider`/`Bridge`, `admin/site-theme`, `admin/site-layout`.
7. Undeploy + delete edge functions `supabase/functions/publish-storefront` and `process-scheduled-drops`.

**Phase 3 — Supabase apply** (MCP connected, or SQL editor / `supabase db push`):
- Apply `supabase/migrations/20260626120000_cms_settings_landing_pages.sql` and `20260627120000_storefront_profiles.sql`; verify tables + RLS.
- **After all Phase 2 code is merged + green**, apply `supabase/teardown/2026_drop_builder_teardown.sql` (drops `anvl_drops`, `cms_publish_drop`, the scheduled-drops cron, and the drop columns).

Update `docs/cms-teardown-plan.md` + `docs/changelog.md` as you go. Don't skip `pnpm verify`.
