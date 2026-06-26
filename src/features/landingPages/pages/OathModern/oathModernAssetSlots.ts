import type { AssetSlotDefinition } from '@/features/landingPages/assetSlots'

/**
 * Admin asset slots for The Oath Modern experience (key `theoath-modern`).
 *
 * Every slot is optional — missing media falls back to the procedural WebGL scene
 * or a themed CSS plane, so the page never breaks on an unassigned slot. The
 * transparent product PNG drives the staged hero; an optional GLB
 * (`heroProductModel`) upgrades it to a true 3D model the camera orbits — dropping
 * the real garment model in needs zero code change. Atmosphere plates feed the
 * chapter "bleed" transitions; the product-card fallback keeps the Armory grid
 * intentional when a render is missing.
 */
export const OATH_MODERN_ASSET_SLOTS: AssetSlotDefinition[] = [
  {
    key: 'dropLogo',
    label: 'Drop mark (SVG)',
    kind: 'svg',
    section: 'Brand',
    hint: 'SVG, bold filled paths, square viewBox. < 30 KB. Carved into the threshold + the oath moment.',
  },

  {
    key: 'heroMediaMode',
    label: 'Hero media type',
    kind: 'select',
    section: 'Threshold',
    passthrough: true,
    options: [
      { value: 'product', label: 'Product (3D / staged)' },
      { value: 'video', label: 'Video' },
      { value: 'image', label: 'Image' },
    ],
    hint: 'Product = transparent PNG / GLB on the procedural altar. Video / Image = full-bleed plate.',
  },
  {
    key: 'heroProductPng',
    label: 'Hero product (transparent PNG)',
    kind: 'image',
    section: 'Threshold',
    hint: 'Compression shirt on transparent bg, centered, ~1400×1800. PNG, < 600 KB. Staged on the altar.',
  },
  {
    key: 'heroProductModel',
    label: 'Hero product model (GLB)',
    kind: 'image',
    section: 'Threshold',
    hint: 'Optional .glb/.gltf — the garment the camera orbits. Keep < 4 MB, draco-compressed, low-metalness materials (scene has no env map).',
  },
  {
    key: 'heroImage',
    label: 'Hero image',
    kind: 'image',
    section: 'Threshold',
    visibleWhen: { key: 'heroMediaMode', equals: 'image' },
    hint: '16:9, 1920×1080. WebP/AVIF ~80q, 250–500 KB. Keep negative space at the left for the headline.',
  },
  {
    key: 'heroDesktopVideo',
    label: 'Hero video (desktop)',
    kind: 'video',
    section: 'Threshold',
    visibleWhen: { key: 'heroMediaMode', equals: 'video' },
    hint: '16:9 1080p MP4 (H.264), muted, seamless loop. 3–6 MB.',
  },
  {
    key: 'heroMobileMedia',
    label: 'Hero media (mobile)',
    kind: 'image',
    section: 'Threshold',
    hint: 'Optional 4:5 / 9:16 mobile crop, ~1080×1350. WebP, < 250 KB.',
  },
  {
    key: 'heroPoster',
    label: 'Hero poster frame',
    kind: 'image',
    section: 'Threshold',
    hint: '16:9 still fallback for reduced-motion / low-power / WebGL-off. WebP, < 150 KB.',
  },
  {
    key: 'heroBackground',
    label: 'Forge / altar backdrop',
    kind: 'image',
    section: 'Threshold',
    hint: 'Dark forged-environment plate, 16:9, ~1920×1080. WebP, 200–400 KB. Heavy negative space + oxidized warm key light.',
  },

  {
    key: 'atmospherePlate',
    label: 'Atmosphere / smoke plate',
    kind: 'image',
    section: 'Atmosphere',
    hint: 'Soft smoke/ember haze over black for chapter bleeds, 16:9, ~1920×1080. WebP, < 200 KB.',
  },
  {
    key: 'oathBackdrop',
    label: 'Oath moment backdrop',
    kind: 'image',
    section: 'Atmosphere',
    hint: 'Ceremonial backdrop behind the sworn creed (carved stone / forged metal), 16:9. WebP, 200–400 KB.',
  },
  {
    key: 'materialsMacro',
    label: 'Material macro',
    kind: 'image',
    section: 'Formation',
    hint: 'Fiber/knit-level macro of the garment, ~1600×1200. WebP ~80q, 200–350 KB.',
  },

  {
    key: 'productImage1',
    label: 'Compression render',
    kind: 'image',
    section: 'Armory',
    hint: 'Portrait 3:4, ~1200×1600. WebP ~80q, 200–350 KB. Dark bg, centered.',
  },
  {
    key: 'productImage2',
    label: 'Oversized tee render',
    kind: 'image',
    section: 'Armory',
    hint: 'Portrait 3:4, ~1200×1600. WebP ~80q, 200–350 KB. Dark bg, centered.',
  },
  {
    key: 'productImage3',
    label: 'Stringer render',
    kind: 'image',
    section: 'Armory',
    hint: 'Portrait 3:4, ~1200×1600. WebP ~80q, 200–350 KB. Dark bg, centered.',
  },
  {
    key: 'productCardFallback',
    label: 'Product-card fallback',
    kind: 'image',
    section: 'Armory',
    hint: 'Intentional placeholder when a product render is missing, portrait 3:4. WebP, < 250 KB.',
  },
]
