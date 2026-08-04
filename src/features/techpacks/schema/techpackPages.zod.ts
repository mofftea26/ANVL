import { z } from 'zod'

import { SIZE_TABLE_ROW_KEYS } from '@/features/cms/support/supportContent.size.zod'

import { techpackHotspotSchema } from './techpackShared.zod'

/**
 * Per-page-kind payloads.
 *
 * Structural variance between products is expressed as nullable blocks and
 * empty lists, NOT as a discriminated union of product types. The two packs
 * supplied already disagree a lot — the compression tee has four knit-texture
 * pages and no trims; the oversized tee has trims and print artwork and three
 * colorways — and a union would have to be reopened for every new garment.
 * A pack that simply lacks a section gets `trims: []`, which every consumer
 * already handles.
 */

/* --------------------------------------------------------------------------- *
 * Colorway schedule
 * --------------------------------------------------------------------------- */

/**
 * One colour slot within a colorway.
 *
 * `role` is a FREE STRING on purpose. An enum here is the single most likely
 * way this schema breaks: the two supplied packs already print different role
 * vocabularies (`MAIN` vs `MAIN 1`/`MAIN 2`, `GRAPHIC` vs `GRAPHIC PRINT`,
 * plus `SEAM` and `TRIM`). `roleKey` is the slugified form for grouping.
 */
export const techpackColorRoleSchema = z.object({
  role: z.string().catch(''),
  /** Slugified `role`, e.g. `main-1`. */
  roleKey: z.string().catch(''),
  /** e.g. `LAVA SMOKE`. */
  colorName: z.string().catch(''),
  /** e.g. `18-0202 TCX`; blank when the pack printed "TCX NOT AVAILABLE". */
  pantone: z.string().catch(''),
  /** Coloro code — the compression pack uses these alongside Pantone. */
  coloro: z.string().catch(''),
  /** `#rrggbb` derived from the printed sRGB triplet; blank when N/A. */
  hex: z.string().catch(''),
  /** `techpackImageRefSchema.id` of the printed swatch chip, when extracted. */
  swatchImageId: z.string().catch(''),
})
export type TechpackColorRole = z.infer<typeof techpackColorRoleSchema>

export const techpackColorwaySchema = z.object({
  /** The `n` in `COLORWAYS: n OF m`. */
  index: z.number().int().min(0).catch(0),
  name: z.string().catch(''),
  roles: z.array(techpackColorRoleSchema).catch([]),
})
export type TechpackColorway = z.infer<typeof techpackColorwaySchema>

/* --------------------------------------------------------------------------- *
 * Sizing guide
 * --------------------------------------------------------------------------- */

export const techpackSizingRowSchema = z.object({
  /** Diagram marker letter, `A`–`G`. */
  letter: z.string().catch(''),
  /** As printed, e.g. `CHEST 1/2 WIDTH`. */
  label: z.string().catch(''),
  /**
   * Mapped onto the site's own size-table rows. Null when the pack printed a
   * measurement the storefront grid has no slot for — the import surfaces
   * those rather than guessing, because a wrong mapping silently corrupts the
   * public size chart.
   */
  rowKey: z.enum(SIZE_TABLE_ROW_KEYS).nullable().catch(null),
  /** The row is a half-width (garment laid flat, measured seam to seam). */
  isHalf: z.boolean().catch(false),
  /** One entry per `sizes` column; null = not printed for that size. */
  values: z.array(z.number().nullable()).catch([]),
})
export type TechpackSizingRow = z.infer<typeof techpackSizingRowSchema>

export const techpackSizingSchema = z.object({
  /**
   * Unit AS PRINTED. Packs are in inches; the storefront renders centimetres.
   * The conversion happens at import, and this field is what makes that
   * conversion auditable instead of assumed.
   */
  unit: z.enum(['in', 'cm']).catch('in'),
  /** Column headers as printed, e.g. `['SMALL','MEDIUM','LARGE','X-LARGE']`. */
  sizes: z.array(z.string()).catch([]),
  rows: z.array(techpackSizingRowSchema).catch([]),
  /** The measurement-point diagram beside the table. */
  diagramImageId: z.string().catch(''),
  /** Where each `A`–`G` marker sits on that diagram. */
  markers: z
    .array(
      z.object({
        letter: z.string().catch(''),
        positions: z.array(techpackHotspotSchema).catch([]),
      }),
    )
    .catch([]),
})
export type TechpackSizing = z.infer<typeof techpackSizingSchema>

/* --------------------------------------------------------------------------- *
 * Technical sheet
 * --------------------------------------------------------------------------- */

/** A leader-line construction callout, e.g. a seam + stitch class + finish. */
export const techpackSeamSchema = z.object({
  text: z.string().catch(''),
  /** ISO stitch/seam class when the pack prints one, e.g. `SSa [1.01.01]`. */
  code: z.string().catch(''),
  /** Stitches per inch, when stated. */
  spi: z.number().positive().nullable().catch(null),
  /** `SEE DETAIL K` cross-reference — internal. */
  supplierRef: z.string().catch(''),
})
export type TechpackSeam = z.infer<typeof techpackSeamSchema>

export const techpackTechnicalSchema = z.object({
  /** Disclosable: seam types, stitch classes, SPI, finishes. */
  seams: z.array(techpackSeamSchema).catch([]),
  /**
   * INTERNAL ONLY. The dimensioned flat — panel widths, hem depths, placement
   * offsets. Extracted for the operator's reference, never disclosed: together
   * these approach a reproducible pattern.
   */
  patternPieces: z
    .array(
      z.object({
        label: z.string().catch(''),
        value: z.number().nullable().catch(null),
        unit: z.string().catch(''),
      }),
    )
    .catch([]),
  /** INTERNAL ONLY — loose notes lifted off the sheet. */
  notes: z.array(z.string()).catch([]),
  scale: z.string().catch(''),
  /** The size the dimensions describe, e.g. `MEDIUM`. */
  baseSize: z.string().catch(''),
})
export type TechpackTechnical = z.infer<typeof techpackTechnicalSchema>

/* --------------------------------------------------------------------------- *
 * Branding, trims, artwork, swatches
 * --------------------------------------------------------------------------- */

export const techpackBrandingSchema = z.object({
  /** e.g. `INDEX A`. */
  code: z.string().catch(''),
  /** The placement prose, e.g. 3.00" wide logo, centred, 2.50" below neckline. */
  description: z.string().catch(''),
  /** INTERNAL ONLY — exact placement offsets. */
  dimensions: z.array(z.string()).catch([]),
  imageId: z.string().catch(''),
})
export type TechpackBranding = z.infer<typeof techpackBrandingSchema>

export const techpackTrimSchema = z.object({
  /** e.g. `TRIM A`. */
  code: z.string().catch(''),
  name: z.string().catch(''),
  description: z.string().catch(''),
  /** Visible size as printed, e.g. `1.00"X1.00"`. */
  visibleSize: z.string().catch(''),
  /** INTERNAL ONLY — supplier's own part reference. */
  supplierCode: z.string().catch(''),
  /** INTERNAL ONLY. */
  vendor: z.string().catch(''),
  imageId: z.string().catch(''),
})
export type TechpackTrim = z.infer<typeof techpackTrimSchema>

/**
 * Print artwork and knit textures share a shape (`GRAPHIC A`, tile area,
 * artwork boundary, screen colours), so one parser serves both page kinds.
 */
export const techpackArtworkSchema = z.object({
  /** e.g. `GRAPHIC A`. */
  code: z.string().catch(''),
  kind: z.enum(['print', 'knit']).catch('print'),
  description: z.string().catch(''),
  /** Printed artwork/tile dimensions, e.g. `18.50" x 9.75"`. */
  size: z.string().catch(''),
  /** Screen/yarn colour names referenced by this artwork. */
  colors: z.array(z.string()).catch([]),
  imageId: z.string().catch(''),
})
export type TechpackArtwork = z.infer<typeof techpackArtworkSchema>

/** One cell of the colorway x colour-role matrix on the COLOR SWATCHES page. */
export const techpackSwatchSchema = z.object({
  colorwayIndex: z.number().int().min(0).catch(0),
  roleKey: z.string().catch(''),
  colorName: z.string().catch(''),
  pantone: z.string().catch(''),
  hex: z.string().catch(''),
})
export type TechpackSwatch = z.infer<typeof techpackSwatchSchema>

/* --------------------------------------------------------------------------- *
 * Packaging and labels
 * --------------------------------------------------------------------------- */

export const techpackPackagingSchema = z.object({
  careLabel: z
    .object({
      /**
       * False when the label is artwork with no text layer — true of the
       * compression pack. The lines then have to come from the AI vision pass
       * or from a human, and the import blocks rather than shipping blanks.
       */
      textAvailable: z.boolean().catch(false),
      /** e.g. `['100% COTTON', 'COOL WASH INSIDE OUT', ...]`. */
      lines: z.array(z.string()).catch([]),
      /** e.g. `Designed in Lebanon`. */
      origin: z.string().catch(''),
      visibleSize: z.string().catch(''),
      imageId: z.string().catch(''),
    })
    .catch({ textAvailable: false, lines: [], origin: '', visibleSize: '', imageId: '' }),
  sizeLabel: z
    .object({
      visibleSize: z.string().catch(''),
      placement: z.string().catch(''),
      sizes: z.array(z.string()).catch([]),
      imageId: z.string().catch(''),
    })
    .catch({ visibleSize: '', placement: '', sizes: [], imageId: '' }),
})
export type TechpackPackaging = z.infer<typeof techpackPackagingSchema>
