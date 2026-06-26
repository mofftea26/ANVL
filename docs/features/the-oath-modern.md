# The Oath Modern — feature spec

> Status: **in build** (started 2026-06-26). Continuous-3D ceremonial rebuild of
> the Drop 01 flagship landing, replacing the retired stacked `theoath-modern`
> page. Plan: `~/.claude/plans/anvl-athletics-sharded-lightning.md`.

## What it is

The Oath Modern (registry key `theoath-modern`, display name **"The Oath Modern"**)
is a single evolving 3D world that sells Drop 01. It rejects the conventional
hero → sections → grid → footer stack in favour of one continuous scroll journey
whose camera moves vertically, laterally, diagonally, and orbitally around a hero
garment, with "bleeding" transitions between chapters.

**Emotional tone:** ceremonial / mythological — the oath as a rite (carved, sworn,
heraldic). The original reference image (the tech-lab editorial) is the *quality
bar* for depth, lighting, and material richness, not the emotion.

## Art direction

- **Theme:** the `forged-ceremonial` preset (`themePresets.ts`) — forged near-black
  void `#07070A`, oxidized-iron hairlines `#6E5A48`, bone text `#E7E4DF`, one warm
  wax-metal accent `#B98A4E` reserved for the commerce vow. Theme is independent of
  the page; the preset is *recommended*, selected separately in `/admin/theme`.
- **Type:** Anton (carved display headings, uppercase), Sora (body), Cinzel reserved
  for heraldic accents.
- **Material law (WebGL):** the scene has **no environment map**, so high-metalness
  PBR renders near-black. Keep hero/scene materials low-metalness and light them
  explicitly (key + rim + cursor-tracked warm point light).

## Chapters (the six-act world)

| # | Chapter | Role | Camera (desktop) |
|---|---------|------|------------------|
| I | Threshold | Entrance, hero object emerges, primary CTA | descent |
| II | Pressure | The forging forces sworn as four vows | lateral |
| III | Formation | Forged-not-sewn construction marks + macro | diagonal |
| IV | The Oath | The sworn creed (`#oath` anchor) | orbital |
| V | The Armory | Three-piece product system enters the world | converge |
| VI | The Vow | Conversion + reassurance → footer handoff | settle |

Chapters are real DOM sections (`[data-om-chapter]`) for SEO + a11y, visually
blended into one world. Mobile / tablet / reduced-motion / no-WebGL get the
composed static layout — content and the purchase path are never gated behind 3D.

## Architecture

- **Page:** `src/features/landingPages/pages/OathModern/` — `index.tsx` (composition
  only), `components/Om*` (chapter sections + primitives), `content/` (schema /
  defaults / resolver), `oathModernAssetSlots.ts`.
- **Content:** every field optional; `oathModernContent.schema.ts` (strict Zod) +
  `oathModernContent.defaults.ts` (designed copy) + `resolveOathModernContent.ts`
  (blank/whitespace → default; foreign/legacy blobs degrade to defaults, no crash).
  Stored in `cms_settings.landing_content['theoath-modern']`.
- **Assets:** `OATH_MODERN_ASSET_SLOTS` → `DROP_ASSET_SLOTS['theoath-modern']`.
  Includes `heroProductModel` (GLB) — the real garment model drops in via this slot
  with **zero code change**; until then a procedural stand-in renders.
- **Experience skin:** the `theoath-modern` experience re-skins the storefront via
  the `useExperienceVariant` seam (variant token `techForge`, renamed `ceremonial`
  at M10) + the `[data-experience="theoath-modern"]` CSS layer.

## Build status

- **M1 (done):** `forged-ceremonial` theme preset; experience config repointed;
  SSR-first static page scaffold (six chapters); asset slots; content pipeline +
  resolver test; `landing_pages` rename migration.
- **M2 (done):** ceremonial `[data-experience]` CSS layer (wax-metal focus/selection,
  carved geometry, forged nav glass/footer/scrollbar).
- **M3 (done):** persistent gated lazy WebGL canvas — explicit low-metalness lighting
  + cursor light + dust, motion-state bridge, pure/tested camera path.
- **M4 (done):** one unpinned master ScrollTrigger → `progress` (no scroll-jacking)
  driving the camera; per-chapter reveals + bleed parallax; static/reduced-motion path.
- **Hero GLB (done):** real Titan Sweep compression shirt — Higgsfield
  `multi_image_to_3d` from the concept render's front/back/side, compressed
  10.6 MB → 296 KB (meshopt + WebP), bundled at `public/models/oath-titan-sweep.glb`,
  default for `heroProductModel`.
- **M6 (done):** ceremonial `ProductCardCeremonial` (forged frame, wax-metal edge
  light, intentional forged fallback) via `ExperienceProductCard`; Armory staging.
- **M7 (done — no per-route code):** `ExperienceProvider` wraps the whole storefront
  in `__root.tsx`, so shop/PDP/cart/account/content/empty/error states inherit the
  ceremonial skin via the `[data-experience]` CSS layer + theme tokens + the
  ceremonial card. `/admin` is correctly excluded. The few hardcoded colors in
  routes/chrome are theme-neutral scrims/tints.
- **M5 / M8–M10 (pending):** ceremonial campaign plates (Higgsfield → Supabase;
  optional, fallbacks exist), CMS editor for the new chapter shape, optimization,
  review + retire old + skill + report. See plan.

> **Open visual-QA item:** GSAP/R3F are mocked in jsdom — the cinematic feel, the
> GLB fidelity/orientation/scale, lighting, and the orbital landing on the Oath
> chapter are not browser-verified. Eyeball via `pnpm dev` at ≥1280; the tuning
> surface is the constants in `webgl/oathModernCamera.ts`, `HeroAltarScene.tsx`,
> and `OathMonument.tsx`.

## Known transitional state (until later milestones)

- The retired `pages/TheoathModern/` + `ProductCardTechForge` stay on disk (orphaned
  from the registry) until **M10**, when the `techForge → ceremonial` token rename
  and deletion happen.
- The `/admin/content` editor still edits the old TM content shape under the
  `theoath-modern` key; that data is now inert (the new resolver ignores it). The
  editor is migrated to the new chapter shape in **M8**.
