# Techpacks — supplier PDF → passport transparency

Upload a manufacturer techpack in the CMS, parse it, review what came out, then
**explicitly** import the facts into the passport, the size guide and the PDP.
The shop is deliberately untouched.

The headline artefact is the **Blueprint**: the pack's lettered construction
callouts, rebuilt as a card grid in the passport.

> **The garment drawing is not extracted at all** (changed 2026-07-30). A BASIC
> SPECS page has no image that *is* the garment — it is a wide bitmap strip
> clipped to two narrow windows with vector callouts painted over it. The
> parser used to measure the rectangle the drawing occupied and the ingest
> rasterised it, lifting the supplier's annotation pins back off the raster.
> That crop was still a supplier render with residual artefacts, and hotspots
> measured against it could only ever be as good as the crop — the operator's
> verdict was "not accurate at all". So the image, the region, the pin cleanup
> and the passport-side coordinates are gone. **The TEXT stays**: label, detail,
> and the supplier cross-reference held back from customers. The passport turns
> its own product render into a holographic schematic instead.
>
> `techpackBlueprintFeature.positions` is retained on the stored document as
> provenance for packs parsed before the change; nothing reads it and the
> parser no longer writes it.

---

## Why the parse is coordinate-driven

A techpack page is a drawing, not a document. The same information appears as a
table, as a callout beside a leader line, or as a letter dropped onto an
illustration. Reading it in text order produces confident nonsense:

- **The sizing table misaligns.** Row labels wrap onto two lines and the values
  sit beside whichever line the layout happened to use. Read as lines, whole
  rows shift by one — and a size chart that is wrong by one row still looks
  entirely plausible.
- **The letters on the BASIC SPECS page are ambiguous.** A card key and a marker
  on the garment are both a single lowercase letter and identical in the text
  layer. Only their surroundings distinguish them.

So every parser works from `transform`-derived boxes in top-left space, and the
one place that conversion happens is `geometry.itemBox`.

## Pipeline

```
admin browser                                   Supabase
─────────────                                   ────────
upload PDF ───────────────────────────────────► techpacks bucket (PRIVATE, 100 MB)
   │  uploaded BEFORE parsing, so an OOM tab costs a re-parse, not a re-upload
   ▼
pdf.js, one page at a time ──┬─ text + image placements
                             └─ image bytes ──► techpack_images rows (private)
   ▼
pure parsers → TechpackDocument ──────────────► techpacks.document (jsonb)
   ▼
review + fix at /admin/techpacks
   ▼
Import from techpack ─────────────────────────► passport_content · support_content · pdp_content
   ▼
optional AI rewrite (edge fn) ────────────────► techpacks.ai_document (never `document`)
```

Parsing runs in the **browser**, not an Edge Function: the packs are 45–74 MB
against a 256 MB function ceiling, so server-side parsing would be permanently
one slightly larger pack away from failing.

## Layout

```
src/features/techpacks/           PURE domain — no React, no Supabase
  schema/
    techpack.zod.ts               root document, parse, issue count (re-exports the family)
    techpackShared.zod.ts         page kinds, issues, hotspots, header, meta
    techpackPages.zod.ts          colorway/sizing/technical/trims/artwork/swatches/packaging
    techpackBlueprint.zod.ts      the lettered construction callouts
    techpackImages.zod.ts         image references
    techpackDisclosure.ts         INTERNAL_ONLY_PATHS, isInternalPath, redactTechpackDocument
  parse/
    pdfTypes.ts                   zero-dependency input contract (the testability seam)
    pdfExtract.ts                 ONLY pdfjs-dist consumer; page-by-page session
    pdfImages.ts                  ONLY page.objs consumer; decode + re-encode + flat ranking
    geometry.ts                   itemBox, bodyText, clusterRows, columns, page→image %
    normalize.ts                  numbers, units, colours, stitch codes, composition
    strip.ts                      the three-gate supplier/disclaimer policy
    classifyPage.ts               page kind from the printed title
    header.ts                     the repeated header block, voted across pages
    registry.ts / buildDocument.ts  kind → parser, with per-page fault isolation
    pages/*.ts                    one parser per page kind
src/features/admin/techpacks/     services, UI, and the import mappers
supabase/functions/techpack-ai/   the optional AI rewrite
```

## The disclosure boundary

Parsers extract **everything** — an operator reviewing a pack needs to see all
of it. What may reach a customer is a separate, narrower question answered in
one auditable list, `INTERNAL_ONLY_PATHS`.

The split is **field-level, not page-level**. The technical sheet is the clear
case: its seam types, stitch classes and SPI are the transparency story; its
dimensioned pattern pieces are close enough to a reproducible pattern to hold
back. Both live on the same page.

Two consumers share the predicate: the import UI blocks internal fields, and the
AI function is only ever sent `redactTechpackDocument(doc)` (branded, so
forgetting to redact is a compile error).

**Images are private by default.** Everything extracted lands in the private
bucket; promoting one copies it into `cms-media` as a normal media asset. That
promotion is the disclosure gate, and it is per-image and deliberate because the
artwork pages contain reproducible print files.

## Stripping runs at three gates

The supplier name and its disclaimers must never reach stored content, and one
leak is a brand incident rather than a bug. Each pass costs microseconds:

1. `pdfExtract` drops matching text items at capture, so a disclaimer can never
   become a table cell or a hotspot label.
2. `buildDocument` deep-walks the assembled document — a phrase split across
   three text runs matches none of them individually.
3. The import mapper refuses to write a matching string, which also covers
   anything an operator pasted in.

Patterns consume to the end of the sentence, not just the matched words:
removing only the phrase leaves residue like "FOR FLAWED SIZING".

## Issues, not confidence scores

`document.issues[]` is the parser's honesty channel and the admin's review
queue: `{ page, path, severity, code, message }`, surfaced as
`techpacks.issue_count`.

The one that matters most is the **drift canary**: a graded size run always
increases from S to XL, so a row that does not has almost certainly picked up a
neighbour's numbers. And when more than 30% of pages classify as `unknown`,
`buildDocument` raises an error — a pack from a different supplier parses into
something that merely *looks* sparse, which is far more dangerous than an
obvious failure.

## Import is a plan, never a bulk overwrite

`buildImportPlan` returns individually selectable proposals. The rule that makes
it safe: **only fields that are currently EMPTY are pre-selected.** Anything
that would overwrite authored copy is offered, shown beside what it would
replace, and left unticked. Arrays replace rather than append, so re-importing
an unchanged pack is a no-op.

Blocked proposals stay **visible** — "this care label is artwork only" is
exactly what an operator needs to be told, and hiding it just leaves a mystery
gap in the passport.

### Inches → centimetres is mandatory

The packs print **inches**. The storefront size table header literally reads
`Measurement (cm)` and the admin editor says "Values in centimetres". Importing
the printed numbers unconverted would size every customer wrong with nothing
appearing broken, so `techpackToSizeTable` converts and then bounds-checks every
converted value; anything implausible blocks the proposal rather than shipping.

The row vocabularies line up exactly — the packs' seven measurements are the
site's seven `SIZE_TABLE_ROW_KEYS`, and the A–G lettering matches the badges in
`GarmentSchematicSvg` — which is what makes this import trustworthy at all.

### Care symbols refuse to guess

`careIconMap.ts` matches prohibitions **before** permissions ("DO NOT TUMBLE
DRY" contains "TUMBLE DRY"), and returns null for anything it does not
recognise. An unmatched line still reaches the customer as words; what it does
not get is a symbol nobody can justify.

## The AI step is optional by construction

The edge function returns **path-keyed suggestions** (`{ path, original,
suggestion }`) into `ai_document`, beside — never merged into — `document`. An
operator accepts them field by field against a diff.

Numbers are excluded from the prompt entirely, which makes "the model changed a
measurement" structurally impossible rather than merely unlikely. A path the
function did not send is a path it will not accept back.

Everything degrades to a human: if the function is unreachable, misconfigured or
slow, the import still works from the deterministic document.

## Gotchas

- `pdfjs-dist` is pinned **exact**. `page.objs`, `ImageKind` and the decoded
  image shape are effectively internals, outside its semver promise; all of it
  is confined to `pdfImages.ts`.
- Image placements can carry a **negative** vertical scale. Reading `e`/`f` as
  the corner puts the box a full image-height out.
- `assignToColumn` defaults to a 0.35 drift factor, not 0.5: in an evenly spaced
  grid the worst case distance to the nearest centre *is* half a column, so 0.5
  can never reject anything.
- Every parser works from `bodyText()`, not the whole page. The repeated header
  is a long text run like any other — its FABRIC line reads as a construction
  callout, and it is wide enough to form a column down the middle of the page.
- ISO 4916 seam classes are case-significant (`SSa`, `LSr`), so the stitch code
  is read from the original line, not the uppercased one.
