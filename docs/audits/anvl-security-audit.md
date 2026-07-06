# ANVL Security Audit

**Audit phase:** 4 (Supabase security audit), cross-referencing Phase 0 findings already fixed and live-verified.
**Method:** Supabase security advisor (`get_advisors(type: security)`), direct `pg_policies`/`pg_proc`/`information_schema.routine_privileges` queries, Edge Function source review, and repo-side grep for secret handling / CSP / rate limiting / CSRF (via the Phase 0 Explore agent pass).

---

## Severity findings table

| ID | Severity | Title | Status |
|---|---|---|---|
| SEC-21 | **Medium** | `cms_settings` draft table publicly readable | **Fixed 2026-07-05** |
| SEC-22 | **Low** | Stray public EXECUTE grant on `rls_auto_enable()` | **Fixed 2026-07-05** |
| SEC-23 | **Low** | Leaked-password protection disabled | Open |
| SEC-24 | **Informational** | `pg_net` extension installed in `public` schema | **Fixed 2026-07-05** |
| SEC-25 | **Low/Informational** | Public buckets allow object listing | **Fixed 2026-07-05** |
| Phase J | **High** (pre-launch blocker) | No rate limiting, CSRF, or CSP/HSTS | Open, already tracked |
| — | — | Admin auth (SEC-11) | **Verified compliant**, no action |
| — | — | Shopify webhook HMAC verification | **Verified compliant**, no action |
| — | — | Secrets never in `VITE_*`/client bundle | **Verified compliant**, no action |

---

## SEC-21 — `cms_settings` draft-content exposure (Medium) — Fixed

**Evidence:** `pg_policies` showed `cms_settings_select_all` with `roles: {public}`, `qual: true` prior to this audit.

**Exploit scenario:** Any unauthenticated party with the project's public anon key (which is, by design, embedded in the client bundle — `VITE_SUPABASE_PUBLISHABLE_KEY`) could `GET {SUPABASE_URL}/rest/v1/cms_settings?select=*` and read the admin's **unpublished** working copy — draft landing page copy, draft shop config, draft PDP content — before the admin clicked "publish." This isn't a write vulnerability and doesn't expose customer PII, but it breaks the documented draft/publish separation (`storefront_publication` is supposed to be the only anon-readable surface) and could leak unreleased marketing copy or upcoming drop details early.

**Affected area:** Supabase `public.cms_settings` table, RLS policy layer only (no application code change needed).

**Business impact:** Low-to-moderate reputational/competitive risk (early leak of unreleased drop copy/pricing experiments an admin is actively drafting), not a data-breach-class issue (no customer data in this table).

**Fix:** Migration `tighten_cms_settings_rls_and_revoke_rls_auto_enable_grant` replaced the policy with `cms_settings_select_cms`, scoped to `EXISTS (SELECT 1 FROM cms_profiles WHERE user_id = (select auth.uid()) AND role IN ('viewer','editor','admin'))` — matching the pattern already used by every other CMS table.

**Validation:** Confirmed via grep that no storefront-safe code (`features/cms/**`, `features/landingPages/**`, etc.) ever queries `cms_settings` directly — only `adminCmsHydration.ts` (authenticated admin client) does. `pg_policies` re-queried post-fix confirms the new policy is in place and scoped correctly.

---

## SEC-22 — Stray public EXECUTE grant on `rls_auto_enable()` (Low) — Fixed

**Evidence:** Security advisor flagged `anon_security_definer_function_executable` and `authenticated_security_definer_function_executable` for `public.rls_auto_enable()`. Confirmed via `information_schema.routine_privileges` that `PUBLIC` (not just named roles) held `EXECUTE`.

**Exploit scenario:** `rls_auto_enable()` is declared `RETURNS event_trigger` — Postgres refuses to execute event-trigger functions outside of an actual event-trigger dispatch context (calling it via `/rest/v1/rpc/rls_auto_enable` errors immediately: `"trigger functions can only be called as triggers"`). So the realistic exploitability is **effectively zero** — this is purely a least-privilege/attack-surface hygiene issue, not a working exploit path.

**Fix:** Two migrations — the first attempted `REVOKE ... FROM anon, authenticated` (a no-op, since the grant was to the `PUBLIC` pseudo-role, which both inherit independently of any named-role revoke); the follow-up `revoke_public_execute_on_rls_auto_enable` correctly revoked from `PUBLIC`. `postgres`/`service_role` retain direct grants — the event trigger itself is unaffected and still fires normally on `CREATE TABLE`.

**Validation:** Security advisor re-run post-fix shows both `*_security_definer_function_executable` warnings cleared.

---

## SEC-23 — Leaked-password protection disabled (Low) — Open

**Evidence:** `auth_leaked_password_protection` advisor warning — Supabase Auth's HaveIBeenPwned integration is off.

**Exploit scenario:** Users (customers or, more importantly, CMS admins) can set a password that's known to be in a public breach corpus, increasing credential-stuffing risk against `/admin` and customer accounts.

**Fix:** Dashboard-only toggle (Authentication → Policies → "Leaked password protection"). No code or migration change. Not applied in this session (out of scope for a code-focused Phase 0 batch, and toggling third-party dashboard auth settings wasn't explicitly approved) — recommend as a five-minute pre-launch task.

---

## SEC-24 — `pg_net` in `public` schema (Informational) — Fixed 2026-07-05

**Evidence:** `extension_in_public` advisor warning.

**Impact:** Namespace hygiene only — functions from `pg_net` are callable without schema-qualification from `public`, which is a mild footgun (accidental shadowing) but not itself an access-control issue, since `pg_net`'s own functions are `SECURITY DEFINER`-gated appropriately by the extension itself.

**Fix:** `pg_net` is not relocatable (`extrelocatable: false`), so a simple `ALTER EXTENSION ... SET SCHEMA` isn't available — used Supabase's documented approach of `DROP EXTENSION` + `CREATE EXTENSION pg_net SCHEMA extensions` instead (migration `sec24_move_pg_net_out_of_public_schema`). Verified safe before applying: zero functions anywhere call `net.http_*` (grepped `pg_proc.prosrc`), zero queued rows in `net.http_request_queue`, and `cron.job` is empty — nothing could have been interrupted by the drop. Advisor re-run confirms `extension_in_public` cleared.

---

## SEC-25 — Public buckets allow object listing (Low/Informational) — Fixed 2026-07-05

**Evidence:** `public_bucket_allows_listing` advisor warning for both `cms-media` (`cms_media_public_read` policy) and `story-media` (`story_media_public_read` policy) — both granted `SELECT` on `storage.objects` scoped only by `bucket_id`, which Supabase Storage's API uses for both "fetch by known path" and "list all objects in bucket."

**Exploit scenario (now closed):** Anyone could call the Storage list API to enumerate every filename ever uploaded to either bucket, not just ones linked from the live site — including replaced/superseded assets that are no longer referenced anywhere (see MAINT-31 in the cleanup register).

**Fix:** Dropped both `cms_media_public_read` and `story_media_public_read` policies entirely (migration `sec25_remove_public_storage_listing_policies`) rather than rewriting them narrower — Supabase serves public-bucket object-URL fetches (`/storage/v1/object/public/{bucket}/{path}`) via the bucket's own `public: true` flag, independent of any RLS policy on `storage.objects`, so the SELECT policy was providing zero benefit for the legitimate use case and only enabling enumeration. Verified safe first: grepped every `.storage.from(...)` call in the app — only `.upload()`/`.remove()` exist, no `.list()` anywhere (the admin UI's own media listing goes through the `cms_media_assets` database table, not the Storage API).

**Validation (live, read-only):** direct object fetch via a known public URL still returns `200 OK` post-fix; an anon `POST /storage/v1/object/list/cms-media` call now returns `200` with an empty array instead of real filenames (RLS makes the underlying rows invisible to the list query rather than erroring) — enumeration closed, direct access unaffected.

---

## Verified compliant — no action needed

- **SEC-11 (admin auth):** sealed HttpOnly session cookie, refresh-token rotation on every validation call, `cms_profiles.role = admin` enforced server-side via `createServerFn`, Remember Me correctly varies cookie `Max-Age`. Browser Supabase client has `autoRefreshToken: false` to avoid a dual-rotation race with the server. No service-role key in client-reachable code.
- **Shopify webhook (`shopify-webhook` Edge Function):** verifies `X-Shopify-Hmac-Sha256` via `crypto.subtle` HMAC-SHA256 against `SHOPIFY_API_SECRET_KEY` before processing; rejects with 401 on mismatch; only mirrors `orders/*` topics; swallows mirror errors so Shopify doesn't retry-storm the webhook; uses service-role client only inside the function (never client-exposed). No replay-protection/nonce is implemented, but HMAC verification alone is Shopify's documented standard for this — no gap relative to Shopify's own security model.
- **Secrets hygiene:** `SUPABASE_SERVICE_ROLE_KEY`, `ANVL_ADMIN_SESSION_SECRET`, `SHOPIFY_ADMIN_API_ACCESS_TOKEN` never appear as `VITE_*` vars or in any client-reachable import (verified via grep in Phase 0's Explore pass). `src/app/config/publicEnv.ts` Zod-validates the public env surface and only exposes the documented public-safe `VITE_*` allowlist.
- **File-upload validation:** bucket-level `allowed_mime_types` allowlist (not a blocklist) on both buckets, `file_size_limit` set on both (50MB `cms-media`, 500MB `story-media`). Extension/mime spoofing (renaming a malicious file to `.glb`) is a pre-existing, industry-standard-accepted risk for this class of upload system — Supabase Storage doesn't do magic-byte sniffing, only client-reported/explicitly-set `contentType` validation against the allowlist. Not treated as a new gap; see `anvl-storage-and-glb-audit.md` for the full discussion of whether magic-byte validation is worth adding.

## Not yet independently verified (out of scope for this MCP-only pass)

- Supabase project-level PITR/backup configuration (dashboard setting, not queryable via the tools used).
- Supabase Auth rate limiting configuration (dashboard setting — distinct from the *application-level* rate limiting gap tracked under Phase J, which concerns the `/admin` login server function itself, not Supabase's own built-in auth rate limits).
