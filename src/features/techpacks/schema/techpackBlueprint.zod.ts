import { z } from 'zod'

import { techpackHotspotSchema } from './techpackShared.zod'

/**
 * The Blueprint — the techpack's BASIC SPECS page: the lettered construction
 * callouts, and the artefact this whole feature exists to surface.
 *
 * A BASIC SPECS page draws the garment as a flat illustration with lowercase
 * letter markers (`a`–`x`) dropped onto it, surrounded by a grid of labelled
 * feature cards keyed to those same letters. The CARDS are the durable value:
 * seam finishes, stitch classes, SPI, labels.
 *
 * The illustration is NOT lifted any more. It is assembled at paint time — a
 * wide image XObject clipped to two narrow windows, with vector callouts and
 * the markers painted over the top — so there is no XObject to extract, and
 * the page crop we used to render instead carried the supplier's own
 * annotation pins and paper. It read as what it was: a crop. The passport now
 * renders these callouts as cards, so nothing downstream needs the drawing.
 *
 * `positions` is retained for the packs already parsed: **a letter may appear
 * several times on the garment**, and those measurements are provenance of the
 * supplier drawing that cost a full re-parse to recreate. Nothing reads them
 * today, and the parser no longer produces them — the frame they were
 * percentages of went with the crop.
 */

export const techpackBlueprintFeatureSchema = z.object({
  /** The marker letter as printed, e.g. `a`. */
  code: z.string().catch(''),
  /** First line of the perimeter card, e.g. `HIGH NECK FRONT NECKLINE STYLE`. */
  label: z.string().catch(''),
  /** Remaining card lines — stitch class, SPI, finish. */
  detail: z.string().catch(''),
  /**
   * A cross-reference the pack makes to its own pages, e.g. `SEE TRIM A`.
   * INTERNAL ONLY — meaningless to a customer and it leaks the pack's
   * structure. Stripped by `redactTechpackDocument`.
   */
  supplierRef: z.string().catch(''),
  /**
   * Every place this detail occurred on the supplier's drawing — provenance
   * only. Empty on anything parsed since the drawing was dropped.
   */
  positions: z.array(techpackHotspotSchema).catch([]),
})
export type TechpackBlueprintFeature = z.infer<typeof techpackBlueprintFeatureSchema>

export const techpackBlueprintSchema = z.object({
  page: z.number().int().min(0).catch(0),
  /** `FRONT` / `BACK` when the pack says so; blank otherwise. */
  view: z.string().catch(''),
  features: z.array(techpackBlueprintFeatureSchema).catch([]),
})
export type TechpackBlueprint = z.infer<typeof techpackBlueprintSchema>
