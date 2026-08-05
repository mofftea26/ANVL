-- Client-visible drop id (matches app Drop.id) alongside UUID PK for storefront_publication FK.
-- Tighten CMS mutations + publish RPC to **admin** role only (editors no longer write via PostgREST).

-- ---------------------------------------------------------------------------
-- anvl_drops.client_drop_id
-- ---------------------------------------------------------------------------
ALTER TABLE public.anvl_drops
  ADD COLUMN IF NOT EXISTS client_drop_id text;

UPDATE public.anvl_drops
SET
  client_drop_id = NULLIF(trim(draft_body ->> 'id'), '')
WHERE
  client_drop_id IS NULL;

UPDATE public.anvl_drops
SET
  client_drop_id = 'legacy-' || replace(slug, '/', '-')
WHERE
  client_drop_id IS NULL;

ALTER TABLE public.anvl_drops
  ALTER COLUMN client_drop_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS anvl_drops_client_drop_id_key ON public.anvl_drops (client_drop_id);

COMMENT ON COLUMN public.anvl_drops.client_drop_id IS
  'Stable id aligned with app Drop.id (not necessarily a UUID); UUID PK remains for publication FKs.';

-- ---------------------------------------------------------------------------
-- Catalog columns (idempotent — may already exist from 20260518140000)
-- ---------------------------------------------------------------------------
ALTER TABLE public.storefront_publication
  ADD COLUMN IF NOT EXISTS products_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS catalog_drop_index jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS global_brand jsonb,
  ADD COLUMN IF NOT EXISTS campaigns jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lookbook jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS legacy_landing_cms jsonb;

-- ---------------------------------------------------------------------------
-- RLS: admin-only writes (viewer/editor may still SELECT drops/products)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS anvl_drops_insert_editor ON public.anvl_drops;
DROP POLICY IF EXISTS anvl_drops_update_editor ON public.anvl_drops;
DROP POLICY IF EXISTS anvl_drops_delete_editor ON public.anvl_drops;

CREATE POLICY anvl_drops_insert_admin
  ON public.anvl_drops
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE POLICY anvl_drops_update_admin
  ON public.anvl_drops
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE POLICY anvl_drops_delete_admin
  ON public.anvl_drops
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS storefront_publication_update_editor ON public.storefront_publication;

CREATE POLICY storefront_publication_update_admin
  ON public.storefront_publication
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS cms_admin_products_insert_editor ON public.cms_admin_products;
DROP POLICY IF EXISTS cms_admin_products_update_editor ON public.cms_admin_products;
DROP POLICY IF EXISTS cms_admin_products_delete_editor ON public.cms_admin_products;

CREATE POLICY cms_admin_products_insert_admin
  ON public.cms_admin_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE POLICY cms_admin_products_update_admin
  ON public.cms_admin_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE POLICY cms_admin_products_delete_admin
  ON public.cms_admin_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- cms_publish_drop: catalog refresh + **admin** only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cms_publish_drop(p_drop_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_draft jsonb;
  v_pub jsonb;
  v_slug text;
  v_rev bigint;
  v_now timestamptz := now();
  v_products jsonb;
  v_catalog_drops jsonb;
BEGIN
  SELECT p.role INTO v_role
  FROM public.cms_profiles AS p
  WHERE p.user_id = auth.uid();

  IF v_role IS NULL OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'cms_publish_drop: forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT d.draft_body, d.slug
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
        'id', d.id::text,
        'slug', d.slug,
        'name', COALESCE(d.draft_body ->> 'name', d.slug),
        'dropNumber', COALESCE(d.draft_body ->> 'dropNumber', '')
      )
      ORDER BY d.slug
    ),
    '[]'::jsonb
  )
  INTO v_catalog_drops
  FROM public.anvl_drops AS d
  WHERE d.id IN (
    SELECT DISTINCT (e.elem #>> '{}')::uuid
    FROM public.cms_admin_products AS c,
    LATERAL jsonb_array_elements(c.body -> 'dropIds') AS e(elem)
    WHERE c.body ? 'dropIds'
      AND jsonb_typeof(c.body -> 'dropIds') = 'array'
      AND jsonb_array_length(c.body -> 'dropIds') > 0
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
    draft_body = d.draft_body
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
    draft_body = v_draft
      || jsonb_build_object(
        'status', 'active',
        'isActive', true,
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

REVOKE ALL ON FUNCTION public.cms_publish_drop(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cms_publish_drop(uuid) TO authenticated;
