-- Repair _cms_publish_drop_core after draft_body was renamed to body in 20260524120000.
-- 20260620130000_cms_scheduled_activation.sql accidentally reintroduced draft_body references.

CREATE OR REPLACE FUNCTION public._cms_publish_drop_core(p_drop_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_body jsonb;
  v_pub jsonb;
  v_slug text;
  v_rev bigint;
  v_now timestamptz := now();
  v_products jsonb;
  v_catalog_drops jsonb;
BEGIN
  SELECT d.body, d.slug
  INTO v_body, v_slug
  FROM public.anvl_drops AS d
  WHERE d.id = p_drop_id
  FOR UPDATE;

  IF v_body IS NULL THEN
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
    v_body
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
    body = v_body
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

COMMENT ON FUNCTION public._cms_publish_drop_core IS
  'Internal publish helper: demote actives, snapshot drop + catalog into storefront_publication. Uses body column (not draft_body).';
