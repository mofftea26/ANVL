import type { AssetSlotDefinition } from '@/features/landingPages/assetSlots'

/**
 * Admin asset slots for Drop 01 — The Oath (key `the-oath`), the single merged
 * landing page.
 *
 * Every slot is optional: missing media falls back to a procedural duotone
 * plane (DOM) / generated texture (WebGL) carrying the drop mark, so the page
 * never breaks on an unassigned slot. The `dropLogo` SVG is extruded into the
 * 3D monolith; `heroRevealMedia` is the layer revealed under the cursor
 * spotlight (falls back to a themed ember gradient). Tenet media keep the
 * `chapterMedia*` keys for backward-compatible CMS data.
 */
export const OATH_ASSET_SLOTS: AssetSlotDefinition[] = [
  {
    key: 'dropLogo',
    label: 'Drop logo (SVG)',
    kind: 'svg',
    section: 'Brand',
    hint: 'SVG only — extruded into the 3D monolith. Bold filled paths, valid XML, square viewBox. < 30 KB.',
  },
  {
    key: 'crestSvg',
    label: 'Crest / emblem (SVG)',
    kind: 'svg',
    section: 'Brand',
    hint: 'SVG, bold filled paths. < 40 KB. Used in the finale + product placeholders.',
  },

  {
    key: 'heroMediaMode',
    label: 'Hero media type',
    kind: 'select',
    section: 'Hero',
    passthrough: true,
    options: [
      { value: 'video', label: 'Video' },
      { value: 'image', label: 'Image' },
    ],
    hint: 'Choose Video or Image — then fill the matching slot(s) below.',
  },
  {
    key: 'heroImage',
    label: 'Hero image',
    kind: 'image',
    section: 'Hero',
    visibleWhen: { key: 'heroMediaMode', equals: 'image' },
    hint: '16:9 landscape, 1920×1080. WebP/JPG ~80q, 250–500 KB. Keep the subject out of the left third (headline sits there).',
  },
  {
    key: 'heroDesktopVideo',
    label: 'Hero video (desktop / tablet)',
    kind: 'video',
    section: 'Hero',
    visibleWhen: { key: 'heroMediaMode', equals: 'video' },
    hint: '16:9 1080p MP4 (H.264), muted, 6–10s loop. 3–6 MB (≤8 MB). Scroll-scrubbed.',
  },
  {
    key: 'heroMobileVideo',
    label: 'Hero video (mobile)',
    kind: 'video',
    section: 'Hero',
    visibleWhen: { key: 'heroMediaMode', equals: 'video' },
    hint: '9:16 vertical, 1080×1920 MP4, muted, 6–10s loop. < 5 MB.',
  },
  {
    key: 'heroPoster',
    label: 'Hero poster frame',
    kind: 'image',
    section: 'Hero',
    hint: '16:9 still (the video’s first frame), ~1600×900. WebP/JPG, < 150 KB.',
  },
  {
    key: 'heroRevealMedia',
    label: 'Hero spotlight reveal',
    kind: 'image',
    section: 'Hero',
    hint: 'The "forged" layer revealed under the cursor spotlight — same framing as the hero film, graded warmer/brighter. 16:9, ~1920×1080. Leave blank for a themed ember glow.',
  },

  {
    key: 'manifestoMedia',
    label: 'Creed backdrop',
    kind: 'image',
    section: 'Creed',
    hint: '16:9 landscape, ~1600×900. WebP ~70q, 120–250 KB. Edges feather — keep the subject centered.',
  },

  {
    key: 'chapterMedia1',
    label: 'Tenet 01 media',
    kind: 'image',
    section: 'Tenets',
    hint: '4:3 landscape, ~1600×1200. WebP ~75q, 150–300 KB. Subject centered (mobile crops to portrait 4:5).',
  },
  {
    key: 'chapterMedia2',
    label: 'Tenet 02 media',
    kind: 'image',
    section: 'Tenets',
    hint: '4:3 landscape, ~1600×1200. WebP ~75q, 150–300 KB. Subject centered.',
  },
  {
    key: 'chapterMedia3',
    label: 'Tenet 03 media',
    kind: 'image',
    section: 'Tenets',
    hint: '4:3 landscape, ~1600×1200. WebP ~75q, 150–300 KB. Subject centered.',
  },
  {
    key: 'chapterMedia4',
    label: 'Tenet 04 media',
    kind: 'image',
    section: 'Tenets',
    hint: '4:3 landscape, ~1600×1200. WebP ~75q, 150–300 KB. Subject centered.',
  },

  {
    key: 'productImage1',
    label: 'Piece 01 render',
    kind: 'image',
    section: 'Arsenal',
    hint: 'Portrait 3:4, ~1200×1600. WebP ~80q, 200–350 KB. Garment centered, dark bg.',
  },
  {
    key: 'productImage2',
    label: 'Piece 02 render',
    kind: 'image',
    section: 'Arsenal',
    hint: 'Portrait 3:4, ~1200×1600. WebP ~80q, 200–350 KB. Garment centered, dark bg.',
  },
  {
    key: 'productImage3',
    label: 'Piece 03 render',
    kind: 'image',
    section: 'Arsenal',
    hint: 'Portrait 3:4, ~1200×1600. WebP ~80q, 200–350 KB. Garment centered, dark bg.',
  },
]
