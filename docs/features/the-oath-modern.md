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
- **M8 (done):** CMS editor swapped to the six-chapter shape (`OmContentFields` +
  `omLandingContentForm`, schema-validated, blank→default; round-trip test).
- **M9 (done):** optimization is built-in — lazy/gated WebGL (`vendor-three` off the
  page chunk), capped DPR, coarse-device dust tier, visibility pause, the 296 KB GLB,
  reduced-motion/no-WebGL static tier, skip link, semantic headings. Real Web Vitals
  still need a browser run.
- **M10 (done):** retired the old `pages/TheoathModern/` + `ProductCardTechForge` +
  the TM admin form/fields + their tests (all were orphaned); created
  `.claude/skills/the-oath-modern/SKILL.md`; docs updated.
- **M5 (deferred, optional):** ceremonial campaign plates via Higgsfield → Supabase.
  The page ships with intentional procedural/CSS fallbacks, so this is additive
  polish, not a blocker. The hero **3D garment is already generated** (Titan Sweep GLB).

> **Open visual-QA item:** GSAP/R3F are mocked in jsdom — the cinematic feel, the
> GLB fidelity/orientation/scale, lighting, and the orbital landing on the Oath
> chapter are not browser-verified. Eyeball via `pnpm dev` at ≥1280; the tuning
> surface is the constants in `webgl/oathModernCamera.ts`, `HeroAltarScene.tsx`,
> and `OathMonument.tsx`.

## Notes

- The old `pages/TheoathModern/` + `ProductCardTechForge` + TM admin form/fields were
  deleted at M10. The experience variant **token** is still named `techForge`
  internally (it now resolves to the ceremonial components); renaming it to
  `ceremonial` is a purely cosmetic-internal follow-up and was intentionally left to
  avoid churn — it touches the `experience.types` unions, registry, `useExperienceVariant`,
  and the card map.
