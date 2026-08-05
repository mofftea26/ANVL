-- Document scheduled-drop processing. pg_cron may be enabled per project;
-- prefer Supabase Dashboard → Edge Functions → process-scheduled-drops → Schedules.

comment on function public.cms_process_scheduled_drops() is
  'Promote scheduled drops when scheduled_activation_at <= now(). Invoked by the process-scheduled-drops Edge Function (CRON_SECRET Bearer auth).';
