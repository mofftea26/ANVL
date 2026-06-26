---
name: the-oath-modern
description: Maintain or extend ANVL's "The Oath Modern" landing experience (key `theoath-modern`) — the continuous-3D ceremonial Drop 01 flagship. Invoke when adding/editing a chapter, the WebGL scene/3D model, the scroll choreography, the ceremonial theme/cards/chrome, its CMS content, or its Higgsfield assets. Covers the architectural boundaries and gotchas so changes stay safe for the other landing pages.
---

# The Oath Modern

A single evolving 3D world for ANVL Drop 01, told in six chapters over a persistent
WebGL canvas with one master scroll timeline. Ceremonial/mythological tone (the oath
as a rite). Registry key `theoath-modern`, display name **"The Oath Modern"**.

## When to invoke
Adding/editing a chapter or its copy; touching the 3D scene/camera/monument/GLB; the
scroll choreography; the `forged-ceremonial` theme; the ceremonial product card or
global chrome; the CMS content editor for this page; or generating/wiring Higgsfield
assets. Always run `pnpm verify` before declaring done.

## Repository map
- `src/features/landingPages/pages/OathModern/` — the page.
  - `index.tsx` — composition only (motion context + canvas gate + chapters).
  - `components/Om*` — chapter sections + `OmPrimitives` (eyebrow/heading/CTA/shell).
  - `content/{oathModernContent.schema,oathModernContent.defaults,resolveOathModernContent}.ts`
    — strict Zod schema, designed defaults, blank→default resolver (+ test).
  - `oathModernAssetSlots.ts` — CMS asset slots → `DROP_ASSET_SLOTS['theoath-modern']`.
  - `motion/` — `oathModernMotionState` (the bridge), `buildOathModernProgress`
    (the single master ScrollTrigger), `buildOathModernReveals`, `buildOathModernStatic`.
  - `hooks/` — `useOathModernTimeline` (matchMedia gate), `useOathModernPointerMotion`.
  - `webgl/` — `OathModernCanvasGate` → lazy `OathModernCanvas` → `HeroAltarScene`
    (lights/dust/camera) → `OathMonument` (procedural stele + GLB swap);
    `oathModernColors` (theme reader), `oathModernCamera` (pure, tested camera path).
- `src/features/cms/config/themePresets.ts` — `forged-ceremonial` preset.
- `src/styles.css` — `[data-experience='theoath-modern']` ceremonial CSS layer.
- `src/features/products/components/ProductCardCeremonial.tsx` — the card (via
  `ExperienceProductCard`, variant token `techForge`).
- `src/features/admin/landing-content/{omLandingContentForm.ts,sections/OmContentFields.tsx}`
  — the CMS editor; wired in `AdminLandingContentEditor.tsx` under the `theoath-modern` key.
- `public/models/oath-titan-sweep.glb` — the bundled hero garment (296 KB, meshopt+WebP).
- Plan: `~/.claude/plans/anvl-athletics-sharded-lightning.md`. Spec: `docs/features/the-oath-modern.md`.

## Architectural boundaries
- The experience is selected ONLY through `src/features/experience` (`useExperienceVariant`)
  + the `[data-experience]` CSS layer. Never scatter `if (key === 'theoath-modern')`.
- Theme is INDEPENDENT of the page — `forged-ceremonial` is *recommended*, picked in
  `/admin/theme`. Never hardwire the page to one palette.
- Cosmetic chrome differences = CSS layer; structural swaps = variant components. Do
  NOT duplicate components just to change colors.
- Content is code-owned; CMS only overrides per-chapter copy + asset slots. Every
  content field is optional and falls back to a designed default.

## Design principles
- One continuous world, not stacked sections. The camera moves
  descent→lateral→diagonal→orbital→converge from the single `progress` value.
- Ceremonial voice: carved, sworn, heraldic. Reference image = quality bar, not emotion.
- Wax-metal (`--color-accent`) is the one warm accent (CTAs, focus, emphasis, price).

## Theme color gotcha (critical)
`themeConfigToCssVars` maps palette `primary`→`--color-accent` (wax-metal) and palette
`accent`→`--color-highlight` (oxidized iron). There is **no `--color-primary`**. For any
visible highlight/focus/emphasis use `--color-accent` (or `--color-focus-ring`), NOT
`--color-highlight` (which is dark oxidized iron under this theme).

## GSAP rules
- ONE source of scroll truth: `buildOathModernProgress` (an UNPINNED ScrollTrigger)
  writes `motion.progress`. Never add a second timeline animating the same property.
- No scroll-jacking — native scroll stays; the 3D evolves as you scroll.
- Gate via `gsap.matchMedia` with `LANDING_DESKTOP_CINEMATIC_MQ` (≥1280, no-reduced) vs
  `LANDING_STATIC_MQ`; always `mm.revert()` in cleanup. Reuse `landingMotion.ts` helpers
  (`splitUnits`, `attachLandingMagnetics`, `scopedSelector`). Build only after the entry
  overlay (`useLandingEntry().homeEntryComplete`).
- DOM hooks: `[data-om-chapter]`, `[data-om-reveal]`, `[data-om-bleed]`, `[data-om-magnetic]`.

## Three.js rules
- The scene has **NO environment map** → keep materials low-metalness and light them
  explicitly (key + rim + ambient + cursor-tracked warm point light). High metalness = black.
- Canvas is gated + lazy (`isWebglAvailable` + ≥1280 + no-reduced). Sets
  `data-om-webgl="on"` → CSS fades `[data-om-static-stage]`. DPR capped, visibility pause,
  context-loss `preventDefault`. The scene reads the motion bridge in `useFrame`, never React state.
- Camera = `cameraForProgress(progress)` (pure, NaN-safe, unit-tested). Tune the journey there.
- Hero model: drop a GLB into the CMS `heroProductModel` slot (or change the
  `OATH_MODERN_HERO_MODEL` default). `OathMonument` clones + normalizes it; procedural
  stele is the Suspense/no-WebGL fallback. drei `useGLTF` decodes draco/meshopt natively.

## Higgsfield asset workflow
1. Crop clean single-subject views (System.Drawing / any tool). 2. `media_upload` (files[]),
`curl.exe -X PUT` the bytes, `media_confirm`. 3. `models_explore get` the model;
`generate_3d`/`generate_image` with `get_cost:true` first. 4. Poll `job_status sync:true`.
5. Download; for GLB compress with `npx @gltf-transform/cli optimize --compress meshopt
--texture-compress webp --texture-size 1024`. 6. Bundle in `public/` or upload to Supabase
`cms-media` + register in `cms_media_assets`/`media_index` and assign to a slot. Reject
off-brand/defective outputs before committing.

## Product-card rules
Add treatments via `PRODUCT_CARD_VARIANTS` + `ProductCardCeremonial` (reuses
`useProductCardTilt`, `ProductCardQuickAdd`). Always render through `ExperienceProductCard`.
Missing media → the intentional forged fallback plate, never a broken box. Mobile: no hover.

## CMS schema map
Content → `cms_settings.landing_content['theoath-modern']` (chapters: threshold, pressure,
formation, oath, collection, conversion). Slots → `asset_config.drops['theoath-modern']`.
Edit via `OmContentFields` + `omLandingContentForm` (blank=default; `oathModernContentSchema`
validates). Do NOT expose CMS controls the page doesn't consume.

## Performance budget
Hero GLB < ~300 KB (meshopt+WebP). `vendor-three` stays lazy (gate it). Capped DPR (≤2),
reduced dust on coarse devices. Animate transform/opacity only. Images: lazy/async/sized.

## Accessibility checklist
Real headings (threshold h1, chapters h2 — no skips), real `<button>`/`<a>`, canvas
`aria-hidden`, skip link present (`__root`), focus-ring visible (wax-metal). Reduced-motion
and no-WebGL must keep the full content + purchase path (the static tier). No purchase
action behind 3D. No autoplay audio.

## Testing
Vitest only (NO Playwright). GSAP/R3F are mocked in jsdom — unit-test pure logic
(`oathModernCamera`, resolver, form mapper). Visual/feel needs a real browser:
`pnpm dev` at ≥1280. `pnpm verify` = typecheck + test + build gate.

## Common failure modes / anti-patterns
- Using `--color-highlight` for highlights (it's oxidized iron → invisible). Use `--color-accent`.
- High-metalness PBR with no env map → black. Invalid SVG → `SVGLoader` returns 0 paths silently.
- A second ScrollTrigger fighting `progress`. Pinning the whole journey (= scroll-jack).
- Editing repo files with PowerShell `Set-Content` (UTF-8 BOM corruption) — use the Edit tool.
- Windows case-insensitive FS: don't create a folder differing only by case from an existing one.

## Definition of done
`pnpm verify` green; works on desktop cinematic, static/tablet, mobile, and reduced-motion;
other landing pages (`the-oath`) + `/admin` unaffected; content + assets CMS-editable with
defaults; no disconnected CMS fields; docs (`docs/features/the-oath-modern.md`, changelog)
updated; browser-eyeballed at ≥1280.
