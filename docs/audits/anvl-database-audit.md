# ANVL Database Audit

**Audit phase:** 4 (Supabase database audit)
**Project:** `ANVL` (`cptebkgyrfmokklwtrgp`, ap-northeast-2/Seoul, Postgres 17.6.1). Two other Supabase projects exist in the same org (`FitFormulas`, `Anvil`) — both `INACTIVE` and unrelated/superseded; not in scope.
**Method:** Live inspection via Supabase MCP (`list_tables` verbose, `execute_sql` SELECT-only against `pg_policies`/`pg_indexes`/`pg_constraint`/`pg_proc`/`cron.job`, `list_migrations`, `list_extensions`). No writes beyond the two Phase 0 migrations already applied and disclosed in `docs/changelog.md`.

---

## 1. Schema summary

9 application tables in `public`, all with `rls_enabled: true` (verified — no table is missing RLS):

| Table | Rows (at audit time) | Purpose |
|---|---|---|
| `cms_profiles` | 1 | CMS role gate (`viewer\|editor\|admin`) |
| `cms_settings` | 1 (singleton, `id=1`) | Admin draft/working copy |
| `storefront_publication` | 1 (singleton, `id=1`) | Anon-safe published mirror |
| `cms_media_assets` | 19 | Media library catalog |
| `landing_pages` | 2 | Landing page picker metadata |
| `storefront_profiles` | 1 | Customer profile |
| `story_chapters` | 4 | Story saga chapters |
| `story_acts` | 13 | Story saga acts |
| `story_cast` | 0 | Story saga cast (unused so far — empty, not a bug, just unpopulated) |
| `orders` | 1 | Shopify order mirror |

Plus 2 Storage buckets (`cms-media`, `story-media`) and their `storage.objects` rows (24 objects).

**37 migrations applied**, from `20260518131059` (`anvl_cms_core`) through `20260630085242` (`storefront_profiles_personal`), plus this audit's `tighten_cms_settings_rls_and_revoke_rls_auto_enable_grant` and `revoke_public_execute_on_rls_auto_enable`. No schema drift found between the migration history and the live `list_tables` output.

---

## 2. Constraints (verified via `pg_constraint`)

- Every FK correctly scoped: `cms_media_assets.created_by → auth.users(id) ON DELETE SET NULL` (media survives if the uploading user is deleted — correct, don't want to cascade-delete media library assets), `cms_profiles.user_id → auth.users(id) ON DELETE CASCADE`, `orders.customer_id → auth.users(id) ON DELETE SET NULL`, `storefront_profiles.id → auth.users(id) ON DELETE CASCADE`.
- **Story relational integrity is real, not just UI-enforced**: `story_acts.chapter_id → story_chapters(id) ON DELETE CASCADE` and `story_cast.act_id/chapter_id → ... ON DELETE CASCADE` — confirmed at the database level. This directly answers a question raised in the Phase 3 CMS audit about orphan risk on chapter/act deletion: **no orphan risk exists regardless of what the admin UI does before calling delete** — the DB guarantees cascade cleanup.
- Singleton tables (`cms_settings`, `storefront_publication`) are enforced via `CHECK (id = 1)`, not just convention — a stray `INSERT` with a different id is rejected at the DB level. Correct pattern.
- `story_chapters.product_slug` has a **partial unique index** (`UNIQUE ... WHERE product_slug IS NOT NULL`) — correctly allows multiple chapters with no product link while preventing two chapters claiming the same product.
- `orders.shopify_order_id` is `UNIQUE` — the webhook's `upsert(..., {onConflict: 'shopify_order_id'})` is backed by a real constraint, not just application-level assumption.

**No missing constraints found.** No nullable-but-should-be-required columns spotted beyond what's already nullable by design (e.g. `story_chapters.product_slug` nullable is intentional).

---

## 3. Indexes

All PKs and unique constraints are indexed automatically (standard Postgres behavior). Additional purpose-built indexes exist and look correctly targeted: `orders_email_idx` (functional index on `lower(email)`, matching the RLS policy's `lower(email) = lower(jwt.email)` and the webhook's `.ilike('email', email)` lookup — good, that query will actually use the index), `story_acts_chapter_idx`/`story_cast_chapter_idx` (composite, matching the `chapter_id, sort_order` read pattern), `story_chapters_sort_order_idx`, `story_chapters_published_idx`.

**Gaps (PERF-21, open, low priority given current row counts):**
- `cms_media_assets.created_by` (FK) has no covering index — irrelevant today (19 rows, no query filters by `created_by` in the codebase), but cheap to add if the media library grows and gains a "filter by uploader" feature.
- `story_cast.act_id` (FK) has no covering index — same reasoning, low priority at 0 rows.

**Unused indexes (informational, not a bug):** `cms_profiles_role_idx`, `orders_created_at_idx`, `cms_media_assets_filename_idx` — flagged by the advisor as never-used, but this is expected at current scale (1 profile row, 1 order, 19 media assets — there simply hasn't been enough query volume to register usage stats). Not a removal candidate; these indexes support features that clearly exist in the code (role-based RLS checks, chronological order lists, filename search) and will show usage once there's real traffic.

---

## 4. RLS policy audit (full list, verified via `pg_policies`)

All 9 tables have RLS enabled with policies that match their intended access model:

| Table | Public/anon read | Authenticated read | Write |
|---|---|---|---|
| `cms_settings` | **None** (fixed 2026-07-05, was previously public — see security audit SEC-21) | CMS roles only (`cms_settings_select_cms`) | editor/admin |
| `storefront_publication` | **Yes**, `qual: true` (intentional — this is the anon-safe SSR read) | (covered by public policy) | admin only |
| `cms_media_assets` | None | CMS roles only | editor/admin |
| `landing_pages` | Yes, but only `is_available = true` rows | CMS roles get broader read (all rows incl. unavailable) | admin only |
| `cms_profiles` | None | self-row only | none (bootstrap via service role only — correct, prevents self-promotion to admin) |
| `storefront_profiles` | None | self-row only (select/insert/update) | — |
| `story_chapters`/`story_acts`/`story_cast` | Yes, but only where the parent chapter `is_published = true` | CMS roles get broader read | editor/admin |
| `orders` | None | own rows only (`customer_id = auth.uid() OR email match`) | **none** — correct, only the `shopify-webhook` Edge Function (service role) writes |

**No table grants unintended public write access.** No table is missing a policy for an action that should be restricted (verified: `orders` genuinely has zero INSERT/UPDATE/DELETE policies for any client role, which is correct — writes only happen via the service-role webhook, bypassing RLS by design).

Full severity-rated writeup of the two RLS issues found (`cms_settings` public read, `rls_auto_enable` stray grant) — both already fixed — is in `anvl-security-audit.md`.

---

## 5. Functions & triggers

Three functions in `public`, all reviewed via `pg_get_functiondef`:

- **`handle_new_storefront_user()`** — `SECURITY DEFINER`, `search_path` pinned to `public` (correct — avoids the classic search-path-hijack risk for `SECURITY DEFINER` functions). Fires on `auth.users` insert (trigger not shown in this query but referenced by CLAUDE.md) to seed `storefront_profiles`. Sound.
- **`rls_auto_enable()`** — event-trigger helper (`RETURNS event_trigger`), `SECURITY DEFINER`, `search_path` pinned to `pg_catalog`. Auto-enables RLS on any new `CREATE TABLE` in `public` — a defensive guard against ever shipping a table without RLS. Sound design; had an unnecessary public EXECUTE grant, now revoked (SEC-22, fixed).
- **`touch_row_updated_at()`** — plain trigger function, not `SECURITY DEFINER`, updates `updated_at = now()`. Standard, no issues. **Minor, open, informational:** advisor flags its `search_path` as not explicitly set — low risk since it's not `SECURITY DEFINER` (no privilege-escalation angle), but pinning it (`SET search_path = public`) would silence the linter and is a one-line, zero-risk fix if picked up in a future pass.

**pg_cron**: extension installed (`pg_cron` 1.6.4) but `SELECT * FROM cron.job` returned **zero rows** — confirmed no scheduled jobs are actually configured, despite migration names referencing `cron_scheduled_drops_note` and `cron_process_scheduled_drops_direct` from the old drop-builder era. This matches `MIG-01` in `docs/technical-debt.md` (orphaned migrations from the removed drop-builder system) — the extension is installed but inert, not a risk, just a documented cleanup candidate (removing the extension isn't necessary; it's free to leave installed and unused).

---

## 6. Query pattern review (code-level, cross-referenced against schema)

- `listMediaAssets()` (`mediaAssets.service.ts`) does `SELECT * FROM cms_media_assets ORDER BY created_at DESC` with **no pagination** — fine at 19 rows, will need a `.range()`/cursor once the library grows into the hundreds (flagged as a watch-item for Phase 6, not urgent).
- `shopify-webhook`'s customer lookup (`storefront_profiles.select('id').ilike('email', email).maybeSingle()`) is a single indexed lookup per webhook call — no N+1 pattern.
- Story reads (`getPublishedChapters`) join chapters→acts→cast — need to confirm in Phase 6 whether this is one query with an embedded resource selection (Supabase's `select('*, story_acts(*), story_cast(*)')` pattern) or N+1 (one query per chapter). Deferred to the Phase 6 API/query audit doc.

---

## 7. Backup / retention

Supabase-managed project — point-in-time recovery and daily backups are a plan-tier feature, not something configured in migrations. Not verified in this audit (would require checking the Supabase dashboard's Database → Backups settings, outside MCP tool scope). **Recommendation for the remediation roadmap:** confirm PITR/backup retention is enabled at the plan level before public launch — this is a dashboard setting, not a code or migration change.

---

## 8. Rollback notes for this audit's own migrations

- `tighten_cms_settings_rls_and_revoke_rls_auto_enable_grant`: rollback = re-create `cms_settings_select_all` as `FOR SELECT TO public USING (true)` and re-grant `EXECUTE ON FUNCTION rls_auto_enable() TO anon, authenticated`. Not recommended (re-opens SEC-21/22) — only do this if something is found to depend on the old public read, which the Phase 0 grep found no evidence of.
- `revoke_public_execute_on_rls_auto_enable`: rollback = `GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO PUBLIC`.
