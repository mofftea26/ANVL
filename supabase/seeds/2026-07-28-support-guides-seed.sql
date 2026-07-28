-- ============================================================================
-- 2026-07-28-support-guides-seed.sql
--
-- DO NOT EXECUTE WITHOUT REVIEW. This is a proposed content seed for the
-- user to run manually (Supabase SQL editor or `supabase db execute`) after
-- reading it. It is intentionally NOT wired into `supabase/migrations/` and
-- was not run by the agent that authored it.
--
-- WHAT THIS DOES
-- Seeds two brand-new `support_content` sub-blocks into BOTH
-- `cms_settings.support_content` (editor source of truth) and
-- `storefront_publication.support_content` (anon-readable SSR mirror):
--
--   1. `careGuide.legend` — the 26 care-symbol `{label, meaning}` overrides,
--      copied verbatim from the code defaults in
--      `src/features/cms/support/supportContent.defaults.ts`
--      (`SUPPORT_CONTENT_DEFAULTS.careGuide.legend`).
--   2. `sizeGuide.measure` — the "Where we measure" heading/intro/footnote
--      plus the five garment-type point sets (tee, stringer, hoodie,
--      joggers, shorts), copied verbatim from the same file
--      (`SUPPORT_CONTENT_DEFAULTS.sizeGuide.measure`).
--   3. `sizeGuide.perProduct[<slug>].garmentType` for the three real
--      products in the seed commerce catalogue
--      (`src/features/products/data/products.mock.ts`):
--        - `oversized-tee`    -> 'tee'       (boxy drop-shoulder tee)
--        - `stringer`         -> 'stringer'  (racerback stringer cut)
--        - `compression-tee`  -> 'tee'       (compression-fit, still a tee
--                                              silhouette: chest/collar/
--                                              sleeve/cuff all apply)
--      The current seed catalogue has exactly these three products and none
--      of them are hoodie/joggers/shorts silhouettes, so those three
--      garment types are NOT assigned to anything here — inventing a
--      hoodie/joggers/shorts product slug that doesn't exist in the
--      catalogue would be fabricated data. `tee` + `stringer` is the
--      honest mapping and is already enough to exercise the multi-type
--      path: before this seed, every product left `garmentType` unset, so
--      `resolveGarmentTypeKeys()` (src/features/support/lib/garmentTypes.ts)
--      always returned just `['tee']` and the size-guide garment-type tab
--      strip (`GarmentTypeTabs`) / PDP compact care legend never had more
--      than one tab to render. After this seed it returns `['tee',
--      'stringer']`, so the tab strip actually renders >1 tab for the
--      first time.
--
-- WHY THIS IS SAFE WITHOUT IT
-- `resolveSupportContent` / `resolveCareLegend` / `resolveMeasurePoints`
-- (src/features/cms/support/resolveSupportContent.ts) already fall back to
-- the code defaults above when these blocks are blank, so the storefront
-- renders correctly with an entirely empty `support_content` column (CMS
-- rule: "CMS blank means default"). This script exists purely so:
--   - the `/admin/support` editor's Measurements + Care symbols tabs open
--     PRE-POPULATED with the designed copy instead of blank fields, and
--   - the garment-type tab strip / PDP compact legend get a real,
--     non-trivial (>1 type) case to render against.
--
-- IDEMPOTENT / NON-DESTRUCTIVE
-- Every write is a targeted JSONB merge (`||` shallow merge at each
-- nesting level it touches), never a wholesale column replacement:
--   - Every existing top-level key of `support_content` (`faq`, `contact`,
--     `shipping`, `returns`, and any already-authored `careGuide`/
--     `sizeGuide` scalar fields, `sections`, or `perProduct` entries for
--     OTHER slugs) survives untouched.
--   - `careGuide.legend` and `sizeGuide.measure` are REASSERTED to the
--     values below on every run — re-running this script is a no-op once
--     applied, but note it will overwrite any admin customization already
--     made to those two specific sub-objects back to the code defaults. It
--     is meant to be run once, before an admin has touched those tabs.
--   - The three `sizeGuide.perProduct[<slug>]` merges only ever touch/add
--     the `garmentType` field on those specific slugs — any `note`/`rows`/
--     `table` an admin may already have authored for `oversized-tee`,
--     `stringer`, or `compression-tee` is preserved.
--
-- NO SCHEMA CHANGE. Both columns already exist as
-- `jsonb not null default '{}'::jsonb`
-- (see supabase/migrations/20260719140000_legal_support_content.sql).
--
-- TIMESTAMP / REVISION CONVENTION
-- Mirrors `runAdminCmsRemoteFlush` in
-- src/features/admin/cmsRemote/adminCmsRemoteSync.ts: `cms_settings.
-- updated_at = now()`, `storefront_publication.published_at = now()`,
-- `storefront_publication.revision = <epoch milliseconds>`. Both UPDATEs
-- run inside one transaction/DO block so the two tables timestamp
-- identically (`now()` is stable for the duration of a Postgres
-- transaction, matching the single `Date.now()` call the TS code makes).
-- ============================================================================

DO $$
DECLARE
  care_legend jsonb := $legend$
{
  "heading": "What the symbols mean",
  "intro": "The standard care marks on every ANVL tag, explained in plain language.",
  "entries": {
    "wash": { "label": "Machine wash", "meaning": "Machine wash on a normal cycle — no special handling needed." },
    "wash-30": { "label": "Wash at 30°C", "meaning": "Machine wash at 30°C or below." },
    "wash-40": { "label": "Wash at 40°C", "meaning": "Machine wash at 40°C or below." },
    "wash-50": { "label": "Wash at 50°C", "meaning": "Machine wash at 50°C or below." },
    "wash-60": { "label": "Wash at 60°C", "meaning": "Machine wash at 60°C or below." },
    "wash-cold": { "label": "Cold wash", "meaning": "Machine wash cold — heat kills compression and print." },
    "wash-gentle": { "label": "Gentle cycle", "meaning": "Use the delicate cycle — reduced agitation and spin protect seams and print." },
    "wash-hand": { "label": "Hand wash", "meaning": "Hand wash only — no machine agitation." },
    "wash-inside-out": { "label": "Wash inside out", "meaning": "Turn inside out before washing to protect the print and face yarn." },
    "do-not-wash": { "label": "Do not wash", "meaning": "Do not machine or hand wash — clean by another method only." },
    "bleach": { "label": "Bleach allowed", "meaning": "Bleach may be used when needed — check colorfastness first." },
    "do-not-bleach": { "label": "Do not bleach", "meaning": "No bleach of any kind — it destroys elastane." },
    "tumble-dry": { "label": "Tumble dry", "meaning": "Tumble drying is safe on this piece." },
    "tumble-dry-low": { "label": "Tumble dry low", "meaning": "Tumble dry on low heat only — high heat shrinks technical fabric." },
    "tumble-dry-high": { "label": "Tumble dry high", "meaning": "Tumble dry on high heat is fine for this piece." },
    "do-not-tumble-dry": { "label": "Do not tumble dry", "meaning": "No dryer — tumble heat relaxes the knit and breaks down elastane." },
    "line-dry": { "label": "Line dry", "meaning": "Hang to dry on a line or hanger, out of direct sun." },
    "dry-flat": { "label": "Dry flat", "meaning": "Dry flat on a rack so the piece holds its shape and does not stretch." },
    "drip-dry": { "label": "Drip dry", "meaning": "Hang dripping wet straight from the wash and let gravity do the rest." },
    "iron": { "label": "Iron", "meaning": "Ironing is safe on this piece." },
    "iron-low": { "label": "Iron low", "meaning": "Iron on the lowest setting, inside out, away from prints." },
    "iron-medium": { "label": "Iron medium", "meaning": "Iron on a medium setting, inside out." },
    "iron-high": { "label": "Iron high", "meaning": "Iron on a high setting when needed." },
    "do-not-iron": { "label": "Do not iron", "meaning": "Never iron — direct heat melts performance fibre." },
    "dry-clean": { "label": "Dry clean", "meaning": "Professional dry cleaning is safe for this piece." },
    "do-not-dry-clean": { "label": "Do not dry clean", "meaning": "No dry cleaning — the solvents attack the fibre." }
  }
}
$legend$::jsonb;

  size_measure jsonb := $measure$
{
  "heading": "Where we measure",
  "intro": "Every ANVL piece is measured flat, seam to seam, before it ships. Match the points below to your own tape before you pick a size.",
  "footnote": "Widths are half measurements, taken with the garment laid flat — double them for the full circumference. A dash means that size is not offered.",
  "garmentTypes": [
    {
      "key": "tee",
      "label": "Tee",
      "points": [
        { "key": "length", "letter": "A", "label": "Body length", "description": "Top of the shoulder seam at the base of the neck, straight down to the hem." },
        { "key": "chest", "letter": "B", "label": "Chest", "description": "Tape flat across the chest, one inch below the armpit, seam to seam." },
        { "key": "waist", "letter": "C", "label": "Waist", "description": "Tape flat across the narrowest point of the torso, seam to seam." },
        { "key": "bottom", "letter": "D", "label": "Hem", "description": "Tape flat across the bottom hem, seam to seam." },
        { "key": "collar", "letter": "E", "label": "Neck opening", "description": "Tape across the neckline opening, seam to seam." },
        { "key": "sleeve", "letter": "F", "label": "Sleeve length", "description": "Shoulder seam to the end of the sleeve cuff." },
        { "key": "cuff", "letter": "G", "label": "Cuff opening", "description": "Tape flat across the sleeve opening, seam to seam." }
      ]
    },
    {
      "key": "stringer",
      "label": "Stringer",
      "points": [
        { "key": "length", "letter": "A", "label": "Body length", "description": "Top of the shoulder strap seam, straight down to the hem." },
        { "key": "chest", "letter": "B", "label": "Chest", "description": "Tape flat across the chest at the widest point, seam to seam." },
        { "key": "waist", "letter": "C", "label": "Waist", "description": "Tape flat across the narrowest point of the torso, seam to seam." },
        { "key": "bottom", "letter": "D", "label": "Hem", "description": "Tape flat across the bottom hem, seam to seam." },
        { "key": "collar", "letter": "E", "label": "Neck opening", "description": "Tape across the front neckline drop, seam to seam." }
      ]
    },
    {
      "key": "hoodie",
      "label": "Hoodie",
      "points": [
        { "key": "length", "letter": "A", "label": "Body length", "description": "Top of the shoulder seam at the base of the neck, straight down to the hem — hood excluded." },
        { "key": "chest", "letter": "B", "label": "Chest", "description": "Tape flat across the chest, one inch below the armpit, seam to seam." },
        { "key": "waist", "letter": "C", "label": "Waist", "description": "Tape flat across the narrowest point at the ribbed waistband, seam to seam." },
        { "key": "bottom", "letter": "D", "label": "Hem", "description": "Tape flat across the ribbed hem, seam to seam." },
        { "key": "collar", "letter": "E", "label": "Neck opening", "description": "Tape across the neck opening beneath the hood, seam to seam." },
        { "key": "sleeve", "letter": "F", "label": "Sleeve length", "description": "Shoulder seam to the end of the ribbed cuff." },
        { "key": "cuff", "letter": "G", "label": "Cuff opening", "description": "Tape flat across the ribbed sleeve cuff, seam to seam." }
      ]
    },
    {
      "key": "joggers",
      "label": "Joggers",
      "points": [
        { "key": "length", "letter": "A", "label": "Inseam length", "description": "Inside leg seam, crotch to hem." },
        { "key": "waist", "letter": "B", "label": "Waist", "description": "Tape around the elastic waistband, relaxed, not stretched." },
        { "key": "bottom", "letter": "C", "label": "Leg opening", "description": "Tape flat across the leg opening, seam to seam." },
        { "key": "cuff", "letter": "D", "label": "Cuff opening", "description": "Tape flat across the ribbed ankle cuff, seam to seam." }
      ]
    },
    {
      "key": "shorts",
      "label": "Shorts",
      "points": [
        { "key": "length", "letter": "A", "label": "Inseam length", "description": "Inside leg seam, crotch to hem." },
        { "key": "waist", "letter": "B", "label": "Waist", "description": "Tape around the elastic waistband, relaxed, not stretched." },
        { "key": "bottom", "letter": "C", "label": "Leg opening", "description": "Tape flat across the leg opening, seam to seam." }
      ]
    }
  ]
}
$measure$::jsonb;

  seed_ts  timestamptz := now();
  seed_rev bigint      := (extract(epoch from now()) * 1000)::bigint;
BEGIN
  -- --------------------------------------------------------------------
  -- cms_settings.support_content (editor source of truth)
  -- --------------------------------------------------------------------
  UPDATE cms_settings
  SET support_content = coalesce(support_content, '{}'::jsonb) || jsonb_build_object(
        'careGuide',
        coalesce(support_content->'careGuide', '{}'::jsonb) || jsonb_build_object(
          'legend', care_legend
        ),
        'sizeGuide',
        coalesce(support_content->'sizeGuide', '{}'::jsonb) || jsonb_build_object(
          'measure', size_measure,
          'perProduct',
          coalesce(support_content #> '{sizeGuide,perProduct}', '{}'::jsonb) || jsonb_build_object(
            'oversized-tee',
            coalesce(support_content #> '{sizeGuide,perProduct,oversized-tee}', '{}'::jsonb)
              || jsonb_build_object('garmentType', 'tee'),
            'stringer',
            coalesce(support_content #> '{sizeGuide,perProduct,stringer}', '{}'::jsonb)
              || jsonb_build_object('garmentType', 'stringer'),
            'compression-tee',
            coalesce(support_content #> '{sizeGuide,perProduct,compression-tee}', '{}'::jsonb)
              || jsonb_build_object('garmentType', 'tee')
          )
        )
      ),
      updated_at = seed_ts
  WHERE id = 1;

  -- --------------------------------------------------------------------
  -- storefront_publication.support_content (anon-readable SSR mirror)
  -- --------------------------------------------------------------------
  UPDATE storefront_publication
  SET support_content = coalesce(support_content, '{}'::jsonb) || jsonb_build_object(
        'careGuide',
        coalesce(support_content->'careGuide', '{}'::jsonb) || jsonb_build_object(
          'legend', care_legend
        ),
        'sizeGuide',
        coalesce(support_content->'sizeGuide', '{}'::jsonb) || jsonb_build_object(
          'measure', size_measure,
          'perProduct',
          coalesce(support_content #> '{sizeGuide,perProduct}', '{}'::jsonb) || jsonb_build_object(
            'oversized-tee',
            coalesce(support_content #> '{sizeGuide,perProduct,oversized-tee}', '{}'::jsonb)
              || jsonb_build_object('garmentType', 'tee'),
            'stringer',
            coalesce(support_content #> '{sizeGuide,perProduct,stringer}', '{}'::jsonb)
              || jsonb_build_object('garmentType', 'stringer'),
            'compression-tee',
            coalesce(support_content #> '{sizeGuide,perProduct,compression-tee}', '{}'::jsonb)
              || jsonb_build_object('garmentType', 'tee')
          )
        )
      ),
      published_at = seed_ts,
      revision = seed_rev
  WHERE id = 1;
END $$;
