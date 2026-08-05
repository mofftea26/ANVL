-- ANVL CMS core: drops, storefront publication, admin profiles, products placeholder.
-- Anonymous SSR reads only storefront_publication (published snapshot + layout + site SEO).
-- Draft/in-progress drops live in anvl_drops — RLS blocks anon entirely.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- cms_profiles: links auth.users to CMS role (viewer | editor | admin)
-- ---------------------------------------------------------------------------
CREATE TABLE public.cms_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cms_profiles_role_idx ON public.cms_profiles (role);

COMMENT ON TABLE public.cms_profiles IS 'CMS operators; row must exist for RLS-gated drop edits. Bootstrap via service role.';

-- ---------------------------------------------------------------------------
-- anvl_drops: canonical campaign row; draft_body is editor source of truth.
-- published_body is last published snapshot (nullable until first publish).
-- ---------------------------------------------------------------------------
CREATE TABLE public.anvl_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  status text NOT NULL CHECK (
    status IN ('draft', 'active', 'inactive', 'scheduled', 'archived')
  ),
  draft_body jsonb NOT NULL,
  published_body jsonb,
  release_date timestamptz,
  scheduled_activation_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT anvl_drops_slug_unique UNIQUE (slug)
);

-- At most one row may be 'active' at the column level (enforced pub-side + RPC).
CREATE UNIQUE INDEX anvl_drops_single_active
  ON public.anvl_drops ((1))
  WHERE (status = 'active');

CREATE INDEX anvl_drops_status_idx ON public.anvl_drops (status);
CREATE INDEX anvl_drops_slug_idx ON public.anvl_drops (slug);

COMMENT ON TABLE public.anvl_drops IS 'Campaign drops; anon has no direct access. JSON validated in application (Zod).';

-- ---------------------------------------------------------------------------
-- storefront_publication: singleton projection row for anon/storefront SSR.
-- ---------------------------------------------------------------------------
CREATE TABLE public.storefront_publication (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  published_at timestamptz,
  revision bigint NOT NULL DEFAULT 0,
  active_drop_id uuid REFERENCES public.anvl_drops (id) ON DELETE SET NULL,
  website_layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_drop_snapshot jsonb,
  site_seo jsonb,
  published_manifest jsonb
);

INSERT INTO public.storefront_publication (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.storefront_publication IS 'Published storefront state readable by anon; no draft columns.';

-- ---------------------------------------------------------------------------
-- cms_admin_products: editorial catalog until Medusa — no commerce truth here.
-- ---------------------------------------------------------------------------
CREATE TABLE public.cms_admin_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  body jsonb NOT NULL,
  medusa_product_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cms_admin_products_slug_unique UNIQUE (slug)
);

CREATE INDEX cms_admin_products_medusa_id_idx ON public.cms_admin_products (medusa_product_id)
  WHERE medusa_product_id IS NOT NULL;

COMMENT ON TABLE public.cms_admin_products IS 'Opaque storefront tiles; medusa_product_id nullable until sync.';

-- ---------------------------------------------------------------------------
-- updated_at touch
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_row_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER anvl_drops_touch_updated_at
  BEFORE UPDATE ON public.anvl_drops
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

CREATE TRIGGER cms_admin_products_touch_updated_at
  BEFORE UPDATE ON public.cms_admin_products
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- ---------------------------------------------------------------------------
-- Publish RPC: editor/admin only; transactional; single active drop.
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
BEGIN
  SELECT p.role INTO v_role
  FROM public.cms_profiles AS p
  WHERE p.user_id = auth.uid();

  IF v_role IS NULL OR v_role NOT IN ('editor', 'admin') THEN
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

  -- Published JSON mirrors app Drop shape (status + isActive coherent for storefront).
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

COMMENT ON FUNCTION public.cms_publish_drop IS 'Atomically publish a drop, demote prior actives, bump storefront revision.';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.cms_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anvl_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_publication ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_admin_products ENABLE ROW LEVEL SECURITY;

-- cms_profiles: read own row
CREATE POLICY cms_profiles_select_self
  ON public.cms_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- anvl_drops: CMS roles
CREATE POLICY anvl_drops_select_cms
  ON public.anvl_drops
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('viewer', 'editor', 'admin')
    )
  );

CREATE POLICY anvl_drops_insert_editor
  ON public.anvl_drops
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY anvl_drops_update_editor
  ON public.anvl_drops
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY anvl_drops_delete_editor
  ON public.anvl_drops
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );

-- storefront_publication: public read; editors update layout/site SEO between publishes
CREATE POLICY storefront_publication_select_all
  ON public.storefront_publication
  FOR SELECT
  USING (true);

CREATE POLICY storefront_publication_update_editor
  ON public.storefront_publication
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );

-- cms_admin_products: authenticated CMS only (storefront still uses local/mock commerce until wired)
CREATE POLICY cms_admin_products_select_cms
  ON public.cms_admin_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('viewer', 'editor', 'admin')
    )
  );

CREATE POLICY cms_admin_products_insert_editor
  ON public.cms_admin_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY cms_admin_products_update_editor
  ON public.cms_admin_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY cms_admin_products_delete_editor
  ON public.cms_admin_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Grants (API roles)
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.storefront_publication TO anon, authenticated;
GRANT UPDATE ON public.storefront_publication TO authenticated;
GRANT SELECT ON public.cms_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anvl_drops TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_admin_products TO authenticated;
