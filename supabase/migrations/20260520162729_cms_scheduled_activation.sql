-- Scheduled drop activation: promote rows when scheduled_activation_at <= now().
--
-- pg_cron is not enabled in this project. Wire a Supabase Edge Function (or external
-- cron) to POST /rest/v1/rpc/cms_process_scheduled_drops with the service_role key
-- on a 1–5 minute interval once deployed.

CREATE OR REPLACE FUNCTION public._cms_publish_drop_core(p_drop_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft jsonb;
  v_pub jsonb;
  v_slug text;
  v_rev bigint;
  v_now timestamptz := now();
  v_products jsonb;
  v_catalog_drops jsonb;
BEGIN
  SELECT d.body, d.slug
  INTO v_draft, v_slug
  FROM public.anvl_drops AS d
  WHERE d.id = p_drop_id
  FOR UPDATE;

  IF v_draft IS NULL THEN
    RAISE EXCEPTION 'cms_publish_drop: drop not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(jsonb_agg(c.body ORDER BY c.slug), '[]'::jsonb)
  INTO v_products
  FROM public.cms_admin_products AS c;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', COALESCE(NULLIF(trim(d.client_drop_id), ''), d.id::text),
        'slug', d.slug,
        'name', COALESCE(d.body ->> 'name', d.slug),
        'dropNumber', COALESCE(d.body ->> 'dropNumber', '')
      )
      ORDER BY d.slug
    ),
    '[]'::jsonb
  )
  INTO v_catalog_drops
  FROM public.anvl_drops AS d
  WHERE d.client_drop_id IN (
    SELECT DISTINCT e.elem #>> '{}'
    FROM public.cms_admin_products AS c,
    LATERAL jsonb_array_elements(c.body -> 'dropIds') AS e(elem)
    WHERE c.body ? 'dropIds'
      AND jsonb_typeof(c.body -> 'dropIds') = 'array'
      AND jsonb_array_length(c.body -> 'dropIds') > 0
      AND NULLIF(trim(e.elem #>> '{}'), '') IS NOT NULL
  )
  OR d.id::text IN (
    SELECT DISTINCT e.elem #>> '{}'
    FROM public.cms_admin_products AS c,
    LATERAL jsonb_array_elements(c.body -> 'dropIds') AS e(elem)
    WHERE c.body ? 'dropIds'
      AND jsonb_typeof(c.body -> 'dropIds') = 'array'
      AND jsonb_array_length(c.body -> 'dropIds') > 0
      AND (e.elem #>> '{}') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  );

  v_pub :=
    v_draft
    || jsonb_build_object(
      'status', 'active',
      'isActive', true,
      'updatedAt', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );

  UPDATE public.anvl_drops AS d
  SET
    status = 'inactive',
    published_body = CASE
      WHEN d.published_body IS NOT NULL THEN
        d.published_body
          || jsonb_build_object(
            'status', 'inactive',
            'isActive', false,
            'updatedAt', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          )
      ELSE NULL
    END,
    body = d.body
      || jsonb_build_object(
        'status', 'inactive',
        'isActive', false,
        'updatedAt', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ),
    updated_at = v_now
  WHERE d.status = 'active'
    AND d.id <> p_drop_id;

  UPDATE public.anvl_drops AS d
  SET
    published_body = v_pub,
    status = 'active',
    scheduled_activation_at = NULL,
    body = v_draft
      || jsonb_build_object(
        'status', 'active',
        'isActive', true,
        'scheduledActivationAt', null,
        'updatedAt', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ),
    updated_at = v_now
  WHERE d.id = p_drop_id;

  UPDATE public.storefront_publication AS sp
  SET
    published_at = v_now,
    revision = sp.revision + 1,
    active_drop_id = p_drop_id,
    published_drop_snapshot = v_pub,
    products_snapshot = v_products,
    catalog_drop_index = v_catalog_drops,
    published_manifest = jsonb_build_object(
      'slug', v_slug,
      'dropId', p_drop_id,
      'revision', sp.revision + 1
    )
  WHERE sp.id = 1
  RETURNING sp.revision INTO v_rev;

  RETURN jsonb_build_object(
    'revision', v_rev,
    'publishedAt', to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'dropId', p_drop_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cms_publish_drop(p_drop_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT p.role INTO v_role
  FROM public.cms_profiles AS p
  WHERE p.user_id = auth.uid();

  IF v_role IS NULL OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'cms_publish_drop: forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN public._cms_publish_drop_core(p_drop_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.cms_process_scheduled_drops()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_drop record;
  v_pub jsonb;
  v_processed jsonb := '[]'::jsonb;
BEGIN
  FOR v_drop IN
    SELECT d.id, d.slug
    FROM public.anvl_drops AS d
    WHERE d.status = 'scheduled'
      AND d.scheduled_activation_at IS NOT NULL
      AND d.scheduled_activation_at <= now()
    ORDER BY d.scheduled_activation_at ASC, d.updated_at ASC
    FOR UPDATE SKIP LOCKED
  LOOP
    v_pub := public._cms_publish_drop_core(v_drop.id);
    v_processed :=
      v_processed
      || jsonb_build_array(
        jsonb_build_object(
          'dropId', v_drop.id,
          'slug', v_drop.slug,
          'published', v_pub
        )
      );
  END LOOP;

  RETURN jsonb_build_object(
    'processedCount', jsonb_array_length(v_processed),
    'processed', v_processed
  );
END;
$$;

REVOKE ALL ON FUNCTION public._cms_publish_drop_core(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cms_publish_drop(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cms_process_scheduled_drops() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.cms_publish_drop(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cms_process_scheduled_drops() TO service_role;

COMMENT ON FUNCTION public._cms_publish_drop_core IS
  'Internal publish helper: demote actives, snapshot drop + catalog into storefront_publication.';

COMMENT ON FUNCTION public.cms_process_scheduled_drops IS
  'Promote scheduled drops whose scheduled_activation_at <= now(). Invoke via Edge/cron with service_role — pg_cron not configured.';

COMMENT ON FUNCTION public.cms_publish_drop IS
  'Atomically publish a drop (admin only). Delegates to _cms_publish_drop_core after role check.';
