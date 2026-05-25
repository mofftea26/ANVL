-- Replace broken pg_net Edge Function cron (placeholder Bearer token) with a direct RPC call.
-- The previous job used: Authorization Bearer paste-your-actual-cron-secret-here → 401.

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'anvl-process-scheduled-drops'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'anvl-process-scheduled-drops',
  '*/2 * * * *',
  $$SELECT public.cms_process_scheduled_drops()$$
);

COMMENT ON FUNCTION public.cms_process_scheduled_drops IS
  'Promote scheduled drops when scheduled_activation_at <= now(). Invoked every 2 min by pg_cron job anvl-process-scheduled-drops.';
