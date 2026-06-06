-- Drop orphaned drop-builder act reference tables (applied 2026-06-06 via MCP).
--
-- `cms_act_natures` + `cms_act_layouts` backed the removed act-preset system.
-- After the drop-builder teardown no code references them. CASCADE clears their
-- RLS policies / triggers / grants. Idempotent: safe to re-run.
DROP TABLE IF EXISTS public.cms_act_layouts CASCADE;
DROP TABLE IF EXISTS public.cms_act_natures CASCADE;
