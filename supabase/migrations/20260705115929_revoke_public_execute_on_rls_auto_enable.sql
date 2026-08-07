-- Follow-up to tighten_cms_settings_rls_and_revoke_rls_auto_enable_grant: the
-- prior REVOKE targeted anon/authenticated directly, but Postgres had granted
-- EXECUTE to the PUBLIC pseudo-role by default at function creation time, and
-- anon/authenticated inherit PUBLIC grants regardless of a named-role revoke.
-- Revoke from PUBLIC to actually close this off. postgres/service_role keep
-- EXECUTE (unaffected -- they're granted directly, not via PUBLIC), so the
-- event trigger itself keeps firing normally.
revoke execute on function public.rls_auto_enable() from public;
