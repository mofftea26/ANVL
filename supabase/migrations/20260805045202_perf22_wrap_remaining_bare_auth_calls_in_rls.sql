-- PERF-22: finish what perf20 started.
--
-- Postgres re-evaluates a bare `auth.uid()` once per row scanned under RLS;
-- `(select auth.uid())` lets the planner treat it as a stable InitPlan evaluated
-- once per query. `perf20_wrap_auth_uid_in_rls_policies` (2026-07-05) swept the
-- tables that existed then, but it was a one-time pass rather than a standing
-- rule, so every table created afterwards drifted back: gamification_* (4),
-- product_passports, passport_transfers, coming_soon_subscribers, techpacks,
-- techpack_images -- 31 policies in total.
--
-- PURE PERFORMANCE. Each policy is dropped and recreated with byte-identical
-- predicate logic, role, command and permissive flag; the ONLY change is the
-- wrapping of the auth call. Doing it as a transform rather than 31 hand-written
-- statements is deliberate: the rewrite is mechanical, and hand-transcribing 31
-- security predicates is exactly where a typo silently widens access. The
-- generated DDL was rendered and reviewed in full before this was applied.
--
-- The whole block is one transaction, so there is never a window in which a
-- table sits without its policy. Re-running is a no-op: once wrapped, the
-- detection below matches nothing.
--
-- DETECTION: pg_policies renders an already-wrapped call as
-- `( SELECT auth.uid() AS uid)`. Masking that form first and then looking for a
-- remaining `auth.uid()` is what distinguishes bare from wrapped -- a naive
-- regex matches both, and Postgres's POSIX engine has no lookbehind to express
-- "not preceded by select". An earlier attempt using a lookbehind silently
-- matched already-fixed policies, which is why the masking approach is used.
--
-- VERIFIED after applying: 74 policies before and after (none lost), 0 still
-- carrying a bare call, 0 left with an empty predicate, and every
-- `auth_rls_initplan` warning cleared from the Supabase performance advisor.
DO $mig$
DECLARE
  r record;
  n int := 0;
BEGIN
  PERFORM set_config('search_path', 'public', true);

  FOR r IN
    WITH p AS (
      SELECT
        tablename, policyname, cmd, permissive, roles,
        replace(replace(coalesce(qual, ''),
          '( SELECT auth.uid() AS uid)', '<<U>>'),
          '( SELECT auth.jwt() AS jwt)', '<<J>>') AS q_prot,
        replace(replace(coalesce(with_check, ''),
          '( SELECT auth.uid() AS uid)', '<<U>>'),
          '( SELECT auth.jwt() AS jwt)', '<<J>>') AS c_prot
      FROM pg_policies
      WHERE schemaname = 'public'
    )
    SELECT
      tablename, policyname, cmd, permissive,
      array_to_string(roles, ', ') AS role_list,
      replace(replace(replace(replace(q_prot,
        'auth.uid()', '(select auth.uid())'),
        'auth.jwt()', '(select auth.jwt())'),
        '<<U>>', '(select auth.uid())'),
        '<<J>>', '(select auth.jwt())') AS q_fixed,
      replace(replace(replace(replace(c_prot,
        'auth.uid()', '(select auth.uid())'),
        'auth.jwt()', '(select auth.jwt())'),
        '<<U>>', '(select auth.uid())'),
        '<<J>>', '(select auth.jwt())') AS c_fixed
    FROM p
    WHERE q_prot ~ 'auth\.(uid|jwt)\(\)'
       OR c_prot ~ 'auth\.(uid|jwt)\(\)'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s',
      r.policyname, r.tablename, r.permissive, r.cmd, r.role_list,
      CASE WHEN r.q_fixed <> '' THEN ' USING (' || r.q_fixed || ')' ELSE '' END,
      CASE WHEN r.c_fixed <> '' THEN ' WITH CHECK (' || r.c_fixed || ')' ELSE '' END
    );
    n := n + 1;
  END LOOP;

  RAISE NOTICE 'PERF-22: rewrote % policies', n;
END
$mig$;
