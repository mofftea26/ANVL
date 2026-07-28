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
-- ============================================================================
-- SAFETY MODEL — READ THIS BEFORE RUNNING. FILL-ONLY-IF-ABSENT, NEVER
-- OVERWRITE. This is a rewrite of an earlier draft that unconditionally
-- REASSERTED `careGuide.legend` and `sizeGuide.measure` to these defaults on
-- every run — which would have silently reverted any admin customization of
-- those two blocks back to today's code defaults. That is exactly the
-- destructive case this version is designed to rule out. This script is
-- meant to be run by hand, quite possibly more than once, quite possibly
-- long after an admin has customized these exact fields — so every single
-- write below is individually gated on "is this specific piece of data
-- currently absent/blank", never on "does the whole column look untouched".
-- Concretely, this version will NEVER touch:
--   - `faq`, `contact`, `shipping`, `returns` (untouched at any level).
--   - `careGuide.legend.heading` / `.intro` — written ONLY when currently
--     blank or absent; a NON-blank value (however it got there) is left
--     byte-for-byte as-is.
--   - `careGuide.legend.entries` — the 26-key override map is written AS A
--     WHOLE default set ONLY when it is currently `{}` (or absent). The
--     instant it has even ONE key in it, this script does not touch
--     `entries` at all, in either direction — see "the ambiguity we cannot
--     resolve" below.
--   - `sizeGuide.measure.heading` / `.intro` / `.footnote` — same per-field
--     blank-only rule as the legend's heading/intro.
--   - `sizeGuide.measure.garmentTypes` — the 5-type default array is written
--     ONLY when it is currently `[]` (or absent); once it has even one
--     element, this script does not touch `garmentTypes` at all.
--   - `sizeGuide.perProduct[<slug>].garmentType` for the three product slugs
--     below — set ONLY when that slug's entry currently has NO `garmentType`
--     key at all; a slug that already has one (any value) is left alone,
--     and any `note`/`rows`/`table` already authored for that slug survives
--     regardless (the merge is per-field within the slug's own object, never
--     a wholesale replacement of the slug's entry).
--   - Any `sizeGuide.perProduct`/`careGuide.perProduct` entry for a slug
--     OTHER than the three named below.
--
-- THE AMBIGUITY WE CANNOT RESOLVE, AND WHY WE UNDER-WRITE INSTEAD OF
-- OVER-WRITE. Both `careGuide.legend.entries` (`CareLegendField.tsx`,
-- "Reset to default" deletes the key) and `sizeGuide.measure.garmentTypes`
-- (`MeasurementsField.tsx`, "Reset to defaults" deletes the whole type
-- block) are OVERRIDES-ONLY by design in the app itself: an admin who never
-- touched a symbol/garment-type, and an admin who explicitly customized one
-- and then clicked "Reset to default", both end up with that key/type
-- ABSENT from the stored JSON — there is no third state ("deliberately
-- reset") for raw SQL to detect. Per-key backfilling into an
-- already-non-empty collection could therefore silently undo a real,
-- deliberate "Reset to default" click. This script resolves that by only
-- ever writing the FULL default set into `entries`/`garmentTypes` while the
-- collection is genuinely empty (nothing to ambiguously resurrect yet); the
-- moment it has any content, both are left alone, in full, even if that
-- means some symbols/types stay un-pre-populated. Under-writing over
-- over-writing, as instructed. The same theoretical ambiguity exists for
-- `sizeGuide.perProduct[<slug>].garmentType` (its admin field has an
-- explicit "Default (Tee)" option that also stores `undefined`, i.e. no
-- key) — accepted here because this per-product data is net-new (this
-- script is what is expected to create it in the first place), so on every
-- realistic first run there is nothing to resurrect; the residual risk is
-- narrow (an admin would have to explicitly reset one of these exact three
-- products back to "Default" and then someone re-runs this exact script) but
-- is called out here for completeness.
--
-- IDEMPOTENT. A first run fills in whatever is absent; a second run against
-- the row the first run produced changes nothing (every gate above is now
-- false), and a run against a row an admin has since customized changes
-- nothing to what they customized either.
-- ============================================================================
--
-- NO SCHEMA CHANGE. Both columns already exist as
-- `jsonb not null default '{}'::jsonb`
-- (see supabase/migrations/20260719140000_legal_support_content.sql).
-- Verified against a scratch local Postgres (not the project's Supabase —
-- no credentials were used or available) with three reachable states of
-- `support_content`: `NULL`, `'{}'::jsonb`, and a fully-populated row with
-- pre-existing `careGuide.legend`/`sizeGuide.measure` content and other
-- `support_content` keys. Every `coalesce(support_content, '{}'::jsonb)`
-- guards the `NULL` case (unreachable in production under the column's
-- `NOT NULL` constraint, but the script does not assume that constraint
-- holds); the fully-populated case is the one this rewrite exists for, and
-- is the one actually exercised in that local test — see the task report.
--
-- TIMESTAMP / REVISION CONVENTION
-- Mirrors `runAdminCmsRemoteFlush` in
-- src/features/admin/cmsRemote/adminCmsRemoteSync.ts: `cms_settings.
-- updated_at = now()`, `storefront_publication.published_at = now()`,
-- `storefront_publication.revision = <epoch milliseconds>`. Both UPDATEs
-- run inside one transaction/DO block so the two tables timestamp
-- identically (`now()` is stable for the duration of a Postgres
-- transaction, matching the single `Date.now()` call the TS code makes).
-- These timestamps DO get bumped even on a run that writes nothing else
-- (e.g. a fully-customized row) — that mirrors `runAdminCmsRemoteFlush`,
-- which always stamps on every publish regardless of which fields changed.
-- ============================================================================

DO $$
DECLARE
  care_legend_default jsonb := $legend$
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

  size_measure_default jsonb := $measure$
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
  --
  -- Every field below is written via `existing || patch`, where `patch` is
  -- built with jsonb_strip_nulls() so a CASE that evaluates to "leave it
  -- alone" contributes NO key to the patch at all — `||` then reproduces
  -- the existing value for that key completely untouched. Nothing here can
  -- ever replace a non-empty value.
  -- --------------------------------------------------------------------
  UPDATE cms_settings
  SET support_content = coalesce(support_content, '{}'::jsonb) || jsonb_build_object(
        'careGuide',
        coalesce(support_content->'careGuide', '{}'::jsonb) || jsonb_build_object(
          'legend',
          coalesce(support_content #> '{careGuide,legend}', '{}'::jsonb)
            || jsonb_strip_nulls(jsonb_build_object(
                 'heading',
                 CASE WHEN coalesce(support_content #>> '{careGuide,legend,heading}', '') = ''
                      THEN care_legend_default ->> 'heading' END,
                 'intro',
                 CASE WHEN coalesce(support_content #>> '{careGuide,legend,intro}', '') = ''
                      THEN care_legend_default ->> 'intro' END,
                 'entries',
                 CASE WHEN coalesce(support_content #> '{careGuide,legend,entries}', '{}'::jsonb) = '{}'::jsonb
                      THEN care_legend_default -> 'entries' END
               ))
        ),
        'sizeGuide',
        coalesce(support_content->'sizeGuide', '{}'::jsonb) || jsonb_build_object(
          'measure',
          coalesce(support_content #> '{sizeGuide,measure}', '{}'::jsonb)
            || jsonb_strip_nulls(jsonb_build_object(
                 'heading',
                 CASE WHEN coalesce(support_content #>> '{sizeGuide,measure,heading}', '') = ''
                      THEN size_measure_default ->> 'heading' END,
                 'intro',
                 CASE WHEN coalesce(support_content #>> '{sizeGuide,measure,intro}', '') = ''
                      THEN size_measure_default ->> 'intro' END,
                 'footnote',
                 CASE WHEN coalesce(support_content #>> '{sizeGuide,measure,footnote}', '') = ''
                      THEN size_measure_default ->> 'footnote' END,
                 'garmentTypes',
                 CASE WHEN coalesce(support_content #> '{sizeGuide,measure,garmentTypes}', '[]'::jsonb) = '[]'::jsonb
                      THEN size_measure_default -> 'garmentTypes' END
               )),
          'perProduct',
          coalesce(support_content #> '{sizeGuide,perProduct}', '{}'::jsonb) || jsonb_build_object(
            'oversized-tee',
            coalesce(support_content #> '{sizeGuide,perProduct,oversized-tee}', '{}'::jsonb)
              || CASE WHEN NOT coalesce(support_content #> '{sizeGuide,perProduct,oversized-tee}', '{}'::jsonb) ? 'garmentType'
                      THEN jsonb_build_object('garmentType', 'tee') ELSE '{}'::jsonb END,
            'stringer',
            coalesce(support_content #> '{sizeGuide,perProduct,stringer}', '{}'::jsonb)
              || CASE WHEN NOT coalesce(support_content #> '{sizeGuide,perProduct,stringer}', '{}'::jsonb) ? 'garmentType'
                      THEN jsonb_build_object('garmentType', 'stringer') ELSE '{}'::jsonb END,
            'compression-tee',
            coalesce(support_content #> '{sizeGuide,perProduct,compression-tee}', '{}'::jsonb)
              || CASE WHEN NOT coalesce(support_content #> '{sizeGuide,perProduct,compression-tee}', '{}'::jsonb) ? 'garmentType'
                      THEN jsonb_build_object('garmentType', 'tee') ELSE '{}'::jsonb END
          )
        )
      ),
      updated_at = seed_ts
  WHERE id = 1;

  -- --------------------------------------------------------------------
  -- storefront_publication.support_content (anon-readable SSR mirror)
  -- Identical logic to the cms_settings UPDATE above, applied to this
  -- table's OWN current support_content (not copied from cms_settings —
  -- the two are read independently in case they have ever diverged).
  -- --------------------------------------------------------------------
  UPDATE storefront_publication
  SET support_content = coalesce(support_content, '{}'::jsonb) || jsonb_build_object(
        'careGuide',
        coalesce(support_content->'careGuide', '{}'::jsonb) || jsonb_build_object(
          'legend',
          coalesce(support_content #> '{careGuide,legend}', '{}'::jsonb)
            || jsonb_strip_nulls(jsonb_build_object(
                 'heading',
                 CASE WHEN coalesce(support_content #>> '{careGuide,legend,heading}', '') = ''
                      THEN care_legend_default ->> 'heading' END,
                 'intro',
                 CASE WHEN coalesce(support_content #>> '{careGuide,legend,intro}', '') = ''
                      THEN care_legend_default ->> 'intro' END,
                 'entries',
                 CASE WHEN coalesce(support_content #> '{careGuide,legend,entries}', '{}'::jsonb) = '{}'::jsonb
                      THEN care_legend_default -> 'entries' END
               ))
        ),
        'sizeGuide',
        coalesce(support_content->'sizeGuide', '{}'::jsonb) || jsonb_build_object(
          'measure',
          coalesce(support_content #> '{sizeGuide,measure}', '{}'::jsonb)
            || jsonb_strip_nulls(jsonb_build_object(
                 'heading',
                 CASE WHEN coalesce(support_content #>> '{sizeGuide,measure,heading}', '') = ''
                      THEN size_measure_default ->> 'heading' END,
                 'intro',
                 CASE WHEN coalesce(support_content #>> '{sizeGuide,measure,intro}', '') = ''
                      THEN size_measure_default ->> 'intro' END,
                 'footnote',
                 CASE WHEN coalesce(support_content #>> '{sizeGuide,measure,footnote}', '') = ''
                      THEN size_measure_default ->> 'footnote' END,
                 'garmentTypes',
                 CASE WHEN coalesce(support_content #> '{sizeGuide,measure,garmentTypes}', '[]'::jsonb) = '[]'::jsonb
                      THEN size_measure_default -> 'garmentTypes' END
               )),
          'perProduct',
          coalesce(support_content #> '{sizeGuide,perProduct}', '{}'::jsonb) || jsonb_build_object(
            'oversized-tee',
            coalesce(support_content #> '{sizeGuide,perProduct,oversized-tee}', '{}'::jsonb)
              || CASE WHEN NOT coalesce(support_content #> '{sizeGuide,perProduct,oversized-tee}', '{}'::jsonb) ? 'garmentType'
                      THEN jsonb_build_object('garmentType', 'tee') ELSE '{}'::jsonb END,
            'stringer',
            coalesce(support_content #> '{sizeGuide,perProduct,stringer}', '{}'::jsonb)
              || CASE WHEN NOT coalesce(support_content #> '{sizeGuide,perProduct,stringer}', '{}'::jsonb) ? 'garmentType'
                      THEN jsonb_build_object('garmentType', 'stringer') ELSE '{}'::jsonb END,
            'compression-tee',
            coalesce(support_content #> '{sizeGuide,perProduct,compression-tee}', '{}'::jsonb)
              || CASE WHEN NOT coalesce(support_content #> '{sizeGuide,perProduct,compression-tee}', '{}'::jsonb) ? 'garmentType'
                      THEN jsonb_build_object('garmentType', 'tee') ELSE '{}'::jsonb END
          )
        )
      ),
      published_at = seed_ts,
      revision = seed_rev
  WHERE id = 1;
END $$;
