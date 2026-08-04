import { z } from 'zod'

/**
 * References to images extracted from the techpack PDF.
 *
 * The document only ever holds a REFERENCE (`id` + intrinsic size + role). The
 * bytes live in the private `techpacks` storage bucket, catalogued in
 * `public.techpack_images` and joined by `ref_id`. Nothing here can reach the
 * storefront until an editor promotes that row into `cms_media_assets` — the
 * promotion is the disclosure gate, and it is deliberately per-image because
 * some pages (print artwork especially) are reproducible IP.
 */

export const TECHPACK_IMAGE_ROLES = [
  /** The technical flat a blueprint's hotspots are pinned to. */
  'garment-flat',
  /** Print/graphic artwork — reproducible, hold back by default. */
  'graphic',
  'swatch',
  'knit',
  'label',
  'trim',
  'unknown',
] as const
export type TechpackImageRole = (typeof TECHPACK_IMAGE_ROLES)[number]

export const techpackImageRefSchema = z.object({
  /** Stable within one document; matches `techpack_images.ref_id`. */
  id: z.string().catch(''),
  page: z.number().int().min(0).catch(0),
  role: z.enum(TECHPACK_IMAGE_ROLES).catch('unknown'),
  /** Intrinsic pixel size of the extracted bitmap. */
  width: z.number().int().positive().nullable().catch(null),
  height: z.number().int().positive().nullable().catch(null),
  /**
   * Where the image sat on the page, as a fraction of the page box (0–1).
   * Kept so the flat can be re-picked by hand if the scoring heuristic in
   * `parse/pdfImages.ts` chooses the wrong XObject.
   */
  pageBox: z
    .object({
      x: z.number().catch(0),
      y: z.number().catch(0),
      w: z.number().catch(0),
      h: z.number().catch(0),
    })
    .catch({ x: 0, y: 0, w: 0, h: 0 }),
})
export type TechpackImageRef = z.infer<typeof techpackImageRefSchema>
