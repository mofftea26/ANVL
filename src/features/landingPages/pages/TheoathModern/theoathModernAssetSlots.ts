import type { AssetSlotDefinition } from '@/features/landingPages/assetSlots'

/**
 * Admin asset slots for the Theoath Modern experience (key `theoath-modern`).
 *
 * Every slot is optional — missing media falls back to a procedural Three.js /
 * CSS plane so the page never breaks on an unassigned slot. The product
 * transparent PNG drives the 2.5D depth scene; an optional GLB upgrades it to a
 * true 3D model. Macro-knit and fog plates feed the Tech Knit Laboratory and
 * the section-bleed transitions.
 */
export const THEOATH_MODERN_ASSET_SLOTS: AssetSlotDefinition[] = [
  {
    key: 'dropLogo',
    label: 'Drop logo (SVG)',
    kind: 'svg',
    section: 'Brand',
    hint: 'SVG, bold filled paths, square viewBox. < 30 KB. Used in the hero mark + finale.',
  },

  {
    key: 'heroMediaMode',
    label: 'Hero media type',
    kind: 'select',
    section: 'Hero',
    passthrough: true,
    options: [
      { value: 'product', label: 'Product (2.5D / 3D)' },
      { value: 'video', label: 'Video' },
      { value: 'image', label: 'Image' },
    ],
    hint: 'Product = transparent PNG / GLB on the procedural platform. Video / Image = full-bleed plate.',
  },
  {
    key: 'heroProductPng',
    label: 'Hero product (transparent PNG)',
    kind: 'image',
    section: 'Hero',
    hint: 'Compression shirt on transparent bg, centered, ~1400×1800. PNG, < 600 KB. Drives the 2.5D depth scene.',
  },
  {
    key: 'heroProductModel',
    label: 'Hero product model (GLB)',
    kind: 'image',
    section: 'Hero',
    hint: 'Optional .glb/.gltf — upgrades the 2.5D plane to a real 3D model. Keep < 4 MB, draco-compressed.',
  },
  {
    key: 'heroImage',
    label: 'Hero image',
    kind: 'image',
    section: 'Hero',
    visibleWhen: { key: 'heroMediaMode', equals: 'image' },
    hint: '16:9, 1920×1080. WebP/AVIF ~80q, 250–500 KB. Keep negative space at the left for the headline.',
  },
  {
    key: 'heroDesktopVideo',
    label: 'Hero video (desktop)',
    kind: 'video',
    section: 'Hero',
    visibleWhen: { key: 'heroMediaMode', equals: 'video' },
    hint: '16:9 1080p MP4 (H.264), muted, seamless loop. 3–6 MB.',
  },
  {
    key: 'heroMobileMedia',
    label: 'Hero media (mobile)',
    kind: 'image',
    section: 'Hero',
    hint: 'Optional 4:5 / 9:16 mobile crop, ~1080×1350. WebP, < 250 KB.',
  },
  {
    key: 'heroPoster',
    label: 'Hero poster frame',
    kind: 'image',
    section: 'Hero',
    hint: '16:9 still fallback for reduced-motion / low-power / WebGL-off. WebP, < 150 KB.',
  },
  {
    key: 'heroBackground',
    label: 'Hero lab backdrop',
    kind: 'image',
    section: 'Hero',
    hint: 'Dark technical-laboratory environment plate, 16:9, ~1920×1080. WebP, 200–400 KB. Heavy negative space. Also the poster/fallback for the backdrop video.',
  },
  {
    key: 'heroBackgroundVideo',
    label: 'Hero lab backdrop (motion loop)',
    kind: 'video',
    section: 'Hero',
    hint: 'Optional seamless 16:9 720p MP4 loop of the lab backdrop (subtle drift). Desktop + no-reduced-motion only, paused offscreen; poster = Hero lab backdrop. < 3 MB.',
  },

  {
    key: 'knitMacro',
    label: 'Macro knit texture',
    kind: 'image',
    section: 'Tech Knit',
    hint: 'Extreme close-up of the seamless knit, ~1600×1600. WebP ~80q, 200–350 KB.',
  },
  {
    key: 'knitExploded',
    label: 'Exploded construction',
    kind: 'image',
    section: 'Tech Knit',
    hint: 'Layered material / construction visual, 4:3, ~1600×1200. WebP, 200–350 KB.',
  },
  {
    key: 'fogPlate',
    label: 'Fog / dust plate',
    kind: 'image',
    section: 'Tech Knit',
    hint: 'Soft fog/dust over black for section bleeds, 16:9, ~1920×1080. WebP, < 200 KB.',
  },

  {
    key: 'materialsMacro',
    label: 'Materials macro',
    kind: 'image',
    section: 'Materials',
    hint: 'Fiber-level macro of the yarn, ~1600×1200. WebP ~80q, 200–350 KB.',
  },

  {
    key: 'productImage1',
    label: 'Compression render',
    kind: 'image',
    section: 'Collection',
    hint: 'Portrait 3:4, ~1200×1600. WebP ~80q, 200–350 KB. Dark bg, centered.',
  },
  {
    key: 'productImage2',
    label: 'Oversized tee render',
    kind: 'image',
    section: 'Collection',
    hint: 'Portrait 3:4, ~1200×1600. WebP ~80q, 200–350 KB. Dark bg, centered.',
  },
  {
    key: 'productImage3',
    label: 'Stringer render',
    kind: 'image',
    section: 'Collection',
    hint: 'Portrait 3:4, ~1200×1600. WebP ~80q, 200–350 KB. Dark bg, centered.',
  },
]
