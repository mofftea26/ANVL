-- SEC-24: pg_net was installed in the `public` schema (advisor: extension_in_public).
-- pg_net is not relocatable (extrelocatable=false), so it can't use a simple
-- ALTER EXTENSION ... SET SCHEMA -- Supabase's own documented approach is
-- drop + recreate in the target schema. Verified safe first: zero functions
-- anywhere call net.http_* (grepped pg_proc.prosrc), zero rows in
-- net.http_request_queue (no queued/in-flight async requests), and cron.job
-- is empty (no scheduled jobs depend on it either). extensions schema already
-- exists (hosts pgcrypto, pg_stat_statements, uuid-ossp per this project's
-- existing setup).
drop extension if exists pg_net;
create extension pg_net schema extensions;
