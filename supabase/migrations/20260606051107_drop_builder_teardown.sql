-- ============================================================================
-- Drop-builder teardown (APPLIED 2026-06-06 via Supabase MCP apply_migration).
-- ============================================================================
-- Promoted from the manual, prerequisite-gated supabase/teardown/ script once
-- all gates were met (see docs/cms-teardown-plan.md):
--   * storefront reads are drop-free (code-owned landing registry),
--   * products_snapshot + catalog_drop_index write moved to adminCmsRemoteSync,
--   * drop-builder code deleted and `pnpm verify` green.
-- Every statement is idempotent (IF EXISTS / guarded DO block), so re-running
-- via `supabase db push` is safe.
-- ============================================================================

-- 1. Unschedule the scheduled-drops pg_cron job (no-op if pg_cron absent).
DO $$
DECLARE
  v_job_id bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    SELECT jobid INTO v_job_id
    FROM cron.job
    WHERE jobname = 'anvl-process-scheduled-drops'
    LIMIT 1;
    IF v_job_id IS NOT NULL THEN
      PERFORM cron.unschedule(v_job_id);
    END IF;
  END IF;
END $$;

-- 2. Drop drop-builder RPCs.
DROP FUNCTION IF EXISTS public.cms_process_scheduled_drops();
DROP FUNCTION IF EXISTS public.cms_publish_drop(uuid);
DROP FUNCTION IF EXISTS public._cms_publish_drop_core(uuid);

-- 3. Drop the canonical drops table. CASCADE also removes its trigger, indexes,
--    RLS policies, and the storefront_publication.active_drop_id FK constraint.
DROP TABLE IF EXISTS public.anvl_drops CASCADE;

-- 4. Remove drop-specific projection columns from the (retained) publication row.
ALTER TABLE public.storefront_publication
  DROP COLUMN IF EXISTS active_drop_id,
  DROP COLUMN IF EXISTS published_drop_snapshot,
  DROP COLUMN IF EXISTS published_manifest;
