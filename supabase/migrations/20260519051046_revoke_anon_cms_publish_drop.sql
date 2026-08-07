-- cms_publish_drop is SECURITY DEFINER; only authenticated CMS admins should invoke it.
REVOKE EXECUTE ON FUNCTION public.cms_publish_drop(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cms_publish_drop(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cms_publish_drop(uuid) TO authenticated;
