-- Audit fixes (docs/COMPREHENSIVE_PLATFORM_REVIEW_PLAN.md). All additive or
-- behaviour-correcting; nothing is dropped and no row is touched.
--
-- Filename version matches the version recorded in
-- `supabase_migrations.schema_migrations` exactly. That is deliberate: MIG-01
-- exists because on-disk filenames drifted from applied versions, and every new
-- migration must not widen that gap.

-- 1) get_product_reviews applied LIMIT 50 BEFORE any ORDER BY, so past 50
--    reviews a product showed an arbitrary subset that the outer jsonb_agg
--    then sorted. Invisible until a product crosses 50 reviews, wrong after.
--    Ordering moves inside the subquery so the LIMIT selects the NEWEST 50;
--    the outer ordering stays so the emitted array is ordered too.
CREATE OR REPLACE FUNCTION public.get_product_reviews(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_slug is null or char_length(p_slug) < 1 or char_length(p_slug) > 200 then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select jsonb_agg(review order by review->>'created_at' desc)
      from (
        select jsonb_build_object(
                 'display_name', display_name,
                 'rating', rating,
                 'title', title,
                 'body', body,
                 'created_at', created_at,
                 'is_mine', coalesce(user_id = auth.uid(), false)
               ) as review
          from public.product_reviews
         where product_slug = p_slug
         order by created_at desc
         limit 50
      ) r
  ), '[]'::jsonb);
end;
$function$;

-- 2) touch_row_updated_at was the one function in `public` without a pinned
--    search_path (flagged by the security advisor). It is SECURITY INVOKER and
--    its body only assigns now(), so there is no realistic escalation here --
--    but an empty search_path is free and closes the advisor.
ALTER FUNCTION public.touch_row_updated_at() SET search_path = '';

-- 3) Covering indexes for foreign keys and an anon-facing lookup that had none.
--    product_reviews carried only its PK and a (user_id, product_slug) unique
--    composite, whose LEADING column is user_id -- so it cannot serve
--    get_product_reviews' `where product_slug = ...`, and every PDP view
--    sequential-scanned the table.
CREATE INDEX IF NOT EXISTS product_reviews_product_slug_idx
  ON public.product_reviews (product_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS armory_feats_user_id_idx
  ON public.armory_feats (user_id);
CREATE INDEX IF NOT EXISTS passport_transfers_from_user_idx
  ON public.passport_transfers (from_user);
CREATE INDEX IF NOT EXISTS passport_transfers_to_user_idx
  ON public.passport_transfers (to_user);
CREATE INDEX IF NOT EXISTS techpacks_created_by_idx
  ON public.techpacks (created_by);
