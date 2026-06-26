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
  SSR-first static page scaffold (six chapters) registered under `theoath-modern`;
  asset slots; content pipeline + resolver test; `landing_pages` rename migration.
- **M2–M10:** chrome, 3D canvas, scroll choreography, Higgsfield assets, ceremonial
  product cards, route reskin, CMS editor, optimization, review + retire old. See plan.

## Known transitional state (until later milestones)

- The retired `pages/TheoathModern/` + `ProductCardTechForge` stay on disk (orphaned
  from the registry) until **M10**, when the `techForge → ceremonial` token rename
  and deletion happen.
- The `/admin/content` editor still edits the old TM content shape under the
  `theoath-modern` key; that data is now inert (the new resolver ignores it). The
  editor is migrated to the new chapter shape in **M8**.
