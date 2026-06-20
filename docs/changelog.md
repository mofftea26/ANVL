## 2026-06-20 — Consolidated theme to one normal design-system palette (CMS ⇄ storefront ⇄ WebGL single source of truth)

- **Problem**: the CMS theme editor and the landing page were following different values, and the palette had sprawled (foreground tokens `colorOnAccent/OnHighlight*/OnSurface`, status `colorSuccess/Warning/Danger/Info/FocusRing/Disabled/Overlay`, particle/scrollbar/hero/chip tokens, plus `anvl*` brand tokens). Narrowed it to **one conventional palette** that both the editor and the storefront + WebGL landing read from, so they cannot diverge.
- **Normalized 15-token palette** (`cmsSiteConfig.zod.ts` → `THEME_PALETTE_KEYS`): `background`, `foreground`, `card`, `cardForeground`, `muted`, `mutedForeground`, `border`, `primary`, `primaryForeground`, `accent`, `accentForeground`, `ring`, `destructive`, `success`, `warning`. This is the **only** editable/serialized source of truth.
- **Everything else is derived** in `themeConfigToCssVars`: brand aliases (`--anvl-*`, `--color-graphite`), surface elevation, chip, hero glows, `--color-highlight*`, status foregrounds, particles, scrollbars, `--nav-scrim`, and `--color-fg`. The emitted `--color-*`/`--hero-*`/`--particle-*`/`--scrollbar-*` CSS-variable contract is unchanged, so no storefront/admin/landing consumer broke — only the editable model shrank. WebGL (`oathBrandColors.ts`) now reads the same normalized vars.
- **Back-compat / migration**: `themePaletteSchema` preprocess maps legacy keys (`colorBg→background`, `colorAccent→primary`, `colorHighlight→accent`, pre-rename `colorEmber*` too) and fills gaps from the dark identity, so historical `theme_config` (Supabase + local drafts) keeps parsing and keeps custom colors. `finalizeThemePalette` collapsed to derive muted/foregrounds/ring only.
- **10 presets collapsed** (`themePresets.ts`) to the normalized colors; CMS editor (`SiteThemeEditor` + `themeTokens.ts` sections/contrast pairs) now shows only the small palette — no "Advanced (derived)" section.
- **Supabase** (migration `20260620140000_normalize_theme_palette`, applied live): non-destructively merged normalized keys into every theme's palette in `cms_settings` + `storefront_publication` (legacy keys left intact; user-customized themes preserved).
- **Tests**: ported color/preset/editor/publication suites to the normalized keys; added migration, derivation, and parse reject cases. `pnpm verify` green.

## 2026-06-20 — Merged The Oath I + II into one cinematic landing page (`the-oath`)

- **Single Drop 01 page**: collapsed the two landing pages (`the-oath` + `the-oath-2`) into one redesigned, CMS-driven cinematic film under key `the-oath`. The merged `pages/TheOathLanding` keeps Oath I's scroll-scrubbed video hero + horizontal product assembly and adopts Oath II's true-3D drop emblem (`Monolith`/`AnvlOath3D`), dust particle field (`DustMotes`), page-scoped custom cursor (`OathCursor`), magnetic CTAs (`OathCtaLink`), word-reveal manifesto, horizontal tenets panorama, and forge-in finale. One unified scroll timeline (`useTheOathScrollTimeline` + `buildOath*`) and one DOM⇄WebGL motion bridge (`oathMotionState`); a fixed transparent WebGL canvas renders above the hero video and below all content.
- **Signature hero spotlight reveal (Lithos-adapted)**: a cursor-following soft mask (`buildOathSpotlight`, `--spotlight-x/-y` via `gsap.quickSetter` in one `gsap.ticker` lerp — no `toDataURL`) exposes a second `heroRevealMedia` layer over the base video. Plus a blur-rise headline, a Ken Burns intro, a shared premium-ease token `cubic-bezier(0.16,1,0.3,1)`, and a `100dvh` hero. All gated to desktop fine-pointer / no-reduced-motion; mobile + reduced-motion get a no-pin, no-WebGL static branch (`buildOathStatic`).
- **Unified CMS content + assets**: new `content/oathContent.{schema,defaults}.ts` + `resolveOathContent` (hero, manifesto, tenets×4, products heading + per-slug taglines, finale; blank = code default). Asset slots merged in `theOathAssetSlots.ts` (hero video/image, SVG `dropLogo` as 3D source, `crestSvg`, `manifestoMedia`, `chapterMedia1–4`, `productImage1–3`, optional `heroRevealMedia`). Admin Landing Content editor re-keyed to `the-oath` with `Oath*Fields` (incl. a new products section); registry now has a single `the-oath` entry.
- **Supabase consolidation** (migration `20260628120000_consolidate_oath_landing_pages`, applied live): folded the extra `the-oath-2` asset slots into the `the-oath` drop (existing values win; dead `interludeVideo` dropped), deleted the `the-oath-2` `landing_pages` row, and forced `active_landing_page_key = 'the-oath'` on both `cms_settings` and `storefront_publication`.
- **Cleanup**: deleted the entire `TheForgeLanding/` tree and the superseded Oath I scene files (`CinematicHero`, `ManifestoScene`, `ChapterGallery`, `MediaPlane`, `FinalDropCTA`, `SceneSeamBlend`, `ScrollCue`, `data.ts`); purged all `the-oath-2`/`Forge*` landing identifiers, dead WebGL files, and unused imports. Tests updated/added (`resolveOathContent`, registry collapse, landing-content envelope, publication normalize). `pnpm verify` green.
- **Hero video restored to a right-anchored, drifting panel** (follow-up): the hero film is no longer a full-bleed background. It is now a contained, right-anchored panel (`[data-hero-media]`, full-bleed on mobile, width-capped on tablet/desktop) that **drifts from the right toward centre** across the pin (`buildOathHero` scrubs `xPercent`, transform-only), tracking the 3D monolith's right→centre move into one composite. The cursor spotlight reveal stays a full-bleed, stationary layer so its mask coordinates remain correct. Mobile/reduced-motion keep the fitted full-bleed video with no scroll-jacking. Added `OathHero` render test for the panel/spotlight contract.
- **Hero polish pass** (follow-up): (1) the monolith now stays the **same small size** through the hero + middle of the page — it only drifts to centre on scroll and **enlarges solely at the finale** (`Monolith.tsx` constant hero scale; finale `rise` is the only growth). (2) It rests **small, above the eyebrow**, lowered to clear the fixed header. (3) The hero is **exactly one screen** (`min-h-[var(--anvl-section-h)]`) so the "Approach" cue is visible without scrolling. (4) The copy scrim **extends up under the header** so there's no nav↔hero seam at rest. (5) The contained video's edges (esp. the right) **feather into shadow** via an inline `MEDIA_FEATHER_MASK` (intersected X/Y fade) instead of a hard cut-off. (6) The base **video is fully opaque** — the full-frame radial dimmer was removed; legibility now comes only from the left copy scrim. Added a static DOM drop-emblem above the eyebrow as the mobile/reduced-motion/no-WebGL fallback (hands off to the 3D monolith via `data-webgl`).
- **Scroll-feel + finale legibility pass** (follow-up): (1) the monolith no longer **shrinks mid-scroll** — the `recede` scale-down was removed from `Monolith.tsx`, so the emblem holds its constant small size through the hero **and the whole middle** of the page (only the entrance scale-in, the drift to centre, and the finale enlarge remain). (2) Section boundaries now **dissolve into shadow** instead of meeting at hard edges: a new decorative `OathSceneSeam` overlay feathers each scene's top/bottom into `--color-bg` (theme-driven, `pointer-events-none`, below copy `z-10`), wired into manifesto/tenets (both edges) and products (top). The **products↔finale boundary is intentionally seamless** — no seam there — so the two flow continuously. The tenet vow cards were also made **a touch more compact** (smaller copy block padding/typography on the desktop panorama and tighter mobile cards). (3) The **custom cursor's hover scale-up is subtler** — the ring grows to `1.35×` (was `1.8×`) in `OathCursor.tsx`. (4) **Finale text legibility**: as the user scrolls into the finale, the monolith **lerps from its bone tone to a primary→accent theme gradient** (`--color-primary`/`--color-accent` via `readOathBrandColors`; per-tone targets tagged on the `AnvlOath3D` materials, blended over `finaleProgress`) so it visually separates from and sits behind the heading-coloured finale copy. Added an `OathSceneSeam` test.

## 2026-06-19 — Production theming system: 10 presets, token split, theme-aware effects, CMS contrast UI

- **Token model expanded** (`cmsSiteConfig.zod.ts`): `themePaletteSchema` gains foreground (`colorOnAccent/OnEmber/OnEmberBright/OnSurface`), status (`colorSuccess/Warning/Danger/Info/FocusRing/Disabled/Overlay`), particle (`particlePrimary/Secondary/Highlight/Glow`) and scrollbar (`scrollbarTrack/Thumb/ThumbHover/ThumbActive`) tokens — all `.optional()` and finalizer-backfilled for backward compatibility. `themeConfigToCssVars` now emits `--color-on-*`, `--color-success/warning/danger/info/focus-ring/disabled/overlay`, `--hero-*`, `--particle-*`, `--scrollbar-*`, `--nav-scrim`, and constant `--motion-*` tokens.
- **Brand vs semantic decoupled (§5)**: `finalizeThemePalette` no longer overwrites `anvl*` brand tokens from semantic values; brand foundation (`+ anvlSignature`) stays stable. Derived surfaces/glows/chips and `on-*` foregrounds are computed deterministically (contrast-chosen, concrete colors via new `mix`/`withAlpha`/`bestForeground`/`contrastRatio`/`suggestAccessibleColor` in `shared/lib/color.ts`).
- **Ten brand presets** added (`themePresets.ts` → `ANVL_PRESETS`): Oath Obsidian (recommended), Blackened Champagne, Oxblood Covenant, Burnished Bronze, Cold Forged Steel, Ashen Olive, Midnight Cobalt, Blackened Teal, Iron Violet, Bone Relic. Always injected into the library via `parseThemeLibrary` (`withBuiltInPresets`). **Live default unchanged** — switch in `/admin/theme`.
- **Theme-aware effects**: scrollbars (`--scrollbar-*` incl. `:active`), oath2 particles (dust shader mixes `--particle-*` per-mote; uniforms updated in place + tab-visibility pause), hero glows (`--hero-*`).
- **The Oath / The Oath II now read the CMS theme**: removed the forced bone palette override on `the-oath-2`; the WebGL monolith emblem/lights follow the theme (`--color-heading`), and the forge backdrop uses theme surfaces. Both landing pages are now CMS-controlled.
- **CMS editor rebuilt**: sectioned fields (Foundation/Typography/Brand/Status/Effects + Advanced disclosure), duplicate/reset/unsaved indicator, desktop/mobile preview toggle, real-component preview (`ThemeComponentPreview`), and live WCAG contrast report with non-silent suggested fixes (`ThemeContrastReport`).
- **Tests**: +92 (color utils, every preset's schema/CSS-vars/contrast/particle/scrollbar generation, migration, fallback). `SiteThemeProvider` now applies tokens in one stylesheet write.
- **Full-app theme compliance**: verified Supabase `storefront_publication.theme_config` is correct (active `oath-obsidian`, finalized palette incl. new tokens) — no DB change needed. Story 3D scene now complements the theme: ember field, studio rim light, and candle glow read `--color-ember` via a new `shared/lib/themeColor.ts` reader (parchment pages stay legible). Every remaining hardcoded status color across the app (storefront account banner, shared/admin form errors, `AdminStatusBadge` live/scheduled/success/danger, sync indicator, danger-zone buttons) now uses `--color-danger/-warning/-success` — no Tailwind palette literals remain in non-test components. `pnpm verify` green (typecheck + 449 tests + build).

## 2026-06-15 — Oath II tenets → side-by-side panorama (feathered seams), no big numbers

- Removed the giant ghosted index numerals (user request).
- **Tenets are now a horizontal panorama** (replacing the cross-dissolve / brief grid): the four vows sit side by side as full-bleed background panels, each feathered on its left/right (`TENET_EDGE_FEATHER`) so it fades into the next at the seam. The section pins and the strip **pans** so each image + caption arrives on its turn; the image stays clean with the **dark wash only behind the bottom caption**. `buildForgeChapters` now pins + scrubs `track.xPercent` (keeps `chaptersActive` for the emblem recede). The fullscreen WebGL dissolve plane (`ChapterMediaPlanes`) + its handoff CSS were dropped — the tenet imagery is plain DOM now. Mobile keeps the 2-up portrait cards.
- CMS tenet hints set to **4:3 (~1600×1200)**.

## 2026-06-15 — Oath II tenets enhanced + visible; CMS asset size hints

- **Tenets visibility regression fixed**: the feather rework had split the duotone into its own div that wasn't covered by the WebGL handoff, so an opaque dark backdrop sat **in front of** the GL dissolve. Moved the motion/handoff hook (`mediaAttrs`) to the media plane's **root**, so the whole DOM plane hides under WebGL and the canvas shows through again.
- **Tenets section enhanced** (reads strongly even with no assigned photos): richer procedural texture (`forgeTextures.ts` — brushed-steel sheen + a bone light-band instead of near-black), a gentler dissolve grade/vignette (`mediaDissolve.ts`) so it isn't crushed to black, plus a redesigned DOM layer — a **monumental ghosted index numeral**, a left **legibility wash**, a persistent **"Four Vows"** label, a bone rule under each title, and labeled progress ticks.
- **CMS asset size hints**: `AssetSlotDefinition` gained a `hint`; every slot (general + The Oath + The Oath II) now shows its recommended **ratio / dimensions / format / file-size** under the picker in `/admin/assets`. Tenets recommend **16:9, 1920×1080** (subject centered — edges feather, mobile crops to 4:5).
- Gates: `pnpm verify` green (360 tests).

## 2026-06-15 — Oath II media: edges feather into shadow (manifesto, tenets, interlude)

- **Feather technique**: edges are masked with **two crossed linear gradients composited `intersect`** (a uniformly feathered rectangle — a radial only softens corners). Verified it renders (CDP).
- **Fit, not fill (final)**: the media is **fit** (object-contain, natural aspect — never zoomed/cropped past its section) and the element is sized to the image itself, so the mask fades the **real** image edges (not a letterbox). The duotone **section backdrop is feathered separately**, so the whole band blends into the page instead of ending on a hard rectangle. Applied to manifesto, tenet DOM planes, and the interlude video.
- **WebGL tenet plane** (desktop tenets) fades its four edges to transparent in the dissolve shader (`mediaDissolve.ts` `edgeFade`) to match.
- Gates: `pnpm verify` green (360 tests).

## 2026-06-15 — Oath II emblem: no cursor interaction, front-facing + frozen at back, hero watermark removed

- **No cursor interaction on the emblem**: removed the cursor-tracked glint light (now a fixed key light), the pointer parallax on pitch/roll, and the cursor-flick spin. The emblem ignores the pointer entirely.
- **Front-facing + frozen when receded**: in the hero it still turns slowly; once it recedes through the creed/tenets (or rises in the finale) it eases to the nearest head-on orientation and stops rotating, so it faces the viewer squarely at the back (still darkening as it sinks).
- **Hero watermark removed**: dropped the faint `ForgeCmsMark` crest that stood in the hero's DOM fallback — the 3D emblem is the only mark now.
- Gates: `pnpm verify` green (360 tests).

## 2026-06-15 — Storefront button contrast fix, no-flash theme, Oath II banners match Oath I, shorter hero

- **Light-on-light button labels fixed (root cause)**: a global **unlayered** `a { color: inherit }` in `styles.css` was overriding Tailwind's layered text-color utilities on every `<a>`-styled button, so bone-bg link CTAs inherited the light `--color-text` (bone-on-bone, invisible). Moved the rule into `@layer base` so a button's color utility wins; plain links still inherit. The shared `Button` color tokens were also made explicit (`text-[color:var(...)]`). Now all buttons — storefront and landing — render dark labels on bone. `ForgeCtaLink` dropped its bespoke override and renders the shared `buttonVariants` verbatim, so landing CTAs match the rest of the site.
- **No theme flash (FOUC)**: the published per-landing-page palette is now applied as an inline `style` on the `<html>` element (`publishedProjectionStyleVars`), which beats the stylesheet's `:root` defaults — so the bone palette paints on the first frame instead of flashing the default ember and correcting after hydration.
- **Oath II arsenal banners match Oath I**: rebuilt to the same `WarBanner` gonfalon + forged rail + sway + info layout as `ProductRevealSequence`, slightly taller (`aspect-[3/5]`), all three uniform, with more breathing room between them (`md:gap-16 lg:gap-20`).
- **Shorter hero**: the hero pin was 170% of viewport (too much scrolling to pass) — cut to 80% with a tighter `scrub: 0.5` for a quicker, smoother exit.
- Gates: `pnpm verify` green (360 tests).

## 2026-06-15 — Oath II polish: bony emblem, thinner + slower spin, recede-darken, banner showcase

- **Bony color** (user: pure white was too clinical): emblem material + monument lights + the `the-oath-2` accent palette override moved to a warm bone (`#e8e3d8` / `#e7e2d7`) with a touch of ivory, instead of cold near-white.
- **Thinner emblem**: extrude `depth` 300 → 130 (bevel 8/5) so the medallion isn't chunky.
- **Slower rotation**: `BASE_SPIN` 0.5 → 0.22 rad/s (entrance spin start lowered, flick gain softened) — a slow ceremonial turn; the hero cursor-flick still adds momentum.
- **Recede-darken**: as the emblem scrolls to the back through the creed/tenets, its material color + emissive lerp down smoothly (`dim = 1 − recede·0.6`) via a per-frame `traverse` that caches each material's base color — so it visibly sinks into the dark.
- **Dark label on the bone button** (user: wasn't applying): `ForgeCtaLink` primary now forces `font-bold text-[#0b0b0c]!` (Tailwind v4 important) so the near-bone "Take The Oath" button always has a solid near-black label.
- **Arsenal = battle banners** (`ForgeShowcase`): the three pieces are now `WarBanner` gonfalons (forged crossbar + hang-straps) with the live info beneath each (role, name, tagline, price, view) — all three the same fixed size (`aspect-[3/4]`, `max-w-[13rem]`, fixed-structure plate), and the section tightened (`py-12`) so the pinned scene fits one viewport. Animation `data-*` hooks preserved.
- Gates: `pnpm verify` green (360 tests). Verified headless (CDP): emblem bony/thinner/darkens-on-recede, button label dark, three uniform banners revealed.

## 2026-06-15 — CMS: per-landing-page theme assignment

- **Theme & Colors editor now assigns a theme to each landing page** (`SiteThemeEditor.tsx`): a new "Landing page themes" section lists every registered landing page with a theme dropdown (default = "page colors"). Assignments persist in `theme_config.landingPageThemes` ({ landingKey → themeId }) alongside the existing theme library, and flow through `adminCmsRemoteSync` to both `cms_settings` and `storefront_publication`.
- **Storefront reads the assignment** (`themeLibrary.resolveThemeConfigForLanding` + `publicStorefrontPublication.normalizeStorefrontPublicationRow`): when the active landing page has an assignment, that preset wins as-is; otherwise the storefront falls back to the live active theme **+** the page's code-owned palette defaults (`applyLandingPageTheme`, prior behavior). Resolution moved into the projection, so `__root.tsx` consumes `projection.theme` directly and the default/offline projection carries the same fallback.
- **Supabase** (`20260615120000_theme_landing_page_assignment.sql`): no schema change needed (`theme_config` is jsonb) — migration idempotently backfills `landingPageThemes: {}` on both singleton rows and updates the column comments. Applied to the live project; both rows verified to carry the key.
- **Assignment alert**: changing a landing page's theme dropdown now fires a toast naming the page + theme and reminding to save/publish (or noting it was cleared back to page defaults).
- **Color picker redesign** (`ThemeColorField.tsx`): replaced the square `<input type="color">` boxes and the rgba **Borders & dividers** text field with one branded control — a fully rounded swatch (click opens the native picker; checkerboard shows transparency) + the live value, plus an opacity slider for alpha fields. `THEME_EDITOR_COLOR_FIELDS` now flags `allowAlpha` instead of `input: 'color'|'text'`; rgba parse/serialize reuses `shared/lib/color`.
- Gates: `pnpm verify` green (360 tests), incl. two new normalize tests (assignment wins; unassigned fallback applies page palette).

## 2026-06-14 — Oath II emblem: full free-spin + cursor-flick, deeper extrude, cooler white, dark button labels

- **Continuous full rotation + cursor-spin** (`webgl/Monolith.tsx`): the emblem now turns a full rotation continuously (angular-velocity model with a steady ~0.5 rad/s base). In the hero, a horizontal cursor flick adds spin momentum (`motion.pointerVX` → angular impulse, consumed each frame so a stopped cursor stops adding) that eases back to the steady turn; the entrance starts the spin fast and slows in. Verified headless (CDP): three frames at distinct yaw angles + the flick advanced rotation.
- **Deeper extrusion** so the full rotation reads as solid 3D, not a flat sliver edge-on: `AnvlOath3D` `depth` 64 → 300, bevel 14/10. The emblem now shows real forged thickness as it turns.
- **Cooler near-white** (user: bone looked "yellowish / tofu"): emblem material, all three monument lights, and the glint are now a neutral near-white (`#f4f5f5` / `#edefef`), not warm ivory. The `the-oath-2` registry palette override likewise moves the site accent from bone `#e7e4df` to a cool near-white `#e9ebeb` (registry test updated).
- **Dark labels on light buttons** (user): `ForgeCtaLink` primary explicitly carries `font-bold text-[var(--color-bg)]`, so the near-white "Take The Oath" button always has a solid dark label (the rest of the site's light-bg buttons already used dark text). Dropped the now-unused `colors` prop from `Monolith`.
- Gates: `pnpm verify` green (358 tests).

## 2026-06-14 — Oath II monument = live 3D drop emblem (bone), enhanced animation, site buttons on landing

- **Root cause of the invisible emblem found + fixed**: `public/brand/the-oath-shape.svg` (and the `src/shared/assets/brand/` copy) contained a stray control character (`0x14`) inside the `aria-label`, making them **invalid XML**. They render fine as `<img>` (lenient HTML) but `SVGLoader` (strict `image/svg+xml`) silently returned **0 paths**, so every SVG-extrude attempt fell back to the faceted slab. Stripped the control char from both files (byte-safe, not via PowerShell — see [[powershell-utf8-footgun]]); SVGLoader now parses all 19 paths.
- **Monolith → live 3D drop emblem** (`webgl/AnvlOath3D.tsx`, brand-owner component adapted to the project): fetches the CMS drop-mark SVG, classifies each path by fill tone, extrudes with bevel, and normalizes to world size. `Monolith.tsx` wraps it with lighting + scroll poses + the cursor-tracked glint. `currentColor` is swapped for a neutral grey before parse (kills the `THREE.Color` warning); bevel-NaN pieces are skipped.
- **Lighting redesign (visible at rest)**: the scene has no environment map, so high-metalness PBR rendered near-black — that's why the old slab was nearly invisible. Dropped to low metalness with a steady bone key + front fill + rim; the cursor point-light is now an *additional* moving glint, not the only light.
- **Enhanced animation**: the emblem forges in on entrance (eases up from below + spins to face + scales in over ~1.5s), then idles with a floating bob, a slow depth "breath", a wider layered presentation swing, and cursor parallax on yaw/pitch — never going edge-on (it's a relief).
- **Bone recolor (user-requested, "from steel + white to bone")**: emblem material + all three monument lights are now bone (no pure white / cold steel); the registry palette override for `the-oath-2` remaps the site accent (`colorEmber`) from steel `#8e9196` to bone `#e7e4df`, so storefront accents read as bone.
- **Landing CTAs now use the shared site button** (user-requested): `ForgeCtaLink` renders `buttonVariants({ size: 'lg' })` from `shared/components/ui/Button`, so "Take The Oath" / "Join Waitlist" are visually identical to buttons elsewhere (still links). Verified headless (CDP screenshots): emblem renders the full 3D crest, both buttons legible, console clean.
- Gates: `pnpm verify` green (358 tests).

## 2026-06-14 — Story book follow-ups: multipage opening restored, leaf sheen, still pages, larger body

- **Multipage opening restored (user-requested)**: after the hardcover swings, thin leaves again flutter open in its wake onto the resting spread — but the gap fix stays, because the right sheet is still laid in early underneath, so the flutter plays over filled paper instead of the binding.
- **Flipping leaf enhanced**: the turning page now carries a traveling sheen (its baked gutter shade is modulated per frame so the curl's lit crest brightens and the far flank falls into self-shadow) on a slightly deeper curl — it reads as dimensional paper, not a flat card.
- **Page content no longer drifts (user-reported)**: the open book's idle float was removed — once open it sits perfectly still so the projected DOM text never floats (it was unfriendly to read). Per-page reveal animations were already gone.
- **Right-page body is larger**: act text 14px→15.5px, act title 1.7rem→1.85rem; `DEFAULT_PAGE_METRICS` retightened (46→42 chars/line, 19→17 lines/page) so the bigger type flows to more pages instead of clipping the fixed page.
- Gates: `pnpm typecheck` green, story tests 15/15, `pnpm build` green; opening flutter + filled spine, mid-flip sheen, and a committed turn verified headless (CDP), no console errors.

## 2026-06-14 — Story open-book redesign: living reading room, clean opening, two-page gutter

- **Award-tier open book** for `/story` (`book3d/`). New modules split out of `Book.tsx`: `bookGeometry.ts` (all dimensions, easing, gutter/leaf/corner-peel/shadow builders), `BookPagesHtml.tsx` (the projected DOM page layer), `EmberField.tsx` (GPU forge embers), `BookControls.tsx` (shared reader chrome). Three.js stays in the lazy `vendor-three` chunk; `Book` is its own 23 kB chunk.
- **Reading-room atmosphere** (`ChapterBook3D`): a GPU ember field warmed to the chapter's CMS foil color (all drift in the vertex shader — one time uniform per frame, cursor parallax, fades in only when open) plus a candle-flicker point light. `powerPreference: 'high-performance'` on the canvas.
- **Alive interactions in `Book.tsx`**: hovering a page peels its outer corner up (grab invitation); a turning leaf casts a traveling contact shadow and the uncovered side keeps its content while the incoming side inks in mid-flight; the open book breathes (the DOM page layer tracks the meshes per frame). Every interactive mesh is pre-warmed (sub-pixel scale) so no shader compiles mid-gesture.
- **Redesigned controls** (`BookControls`, shared by the 3D and flat readers): a gilded reading-progress thread (CMS foil → bone) that eases to position on each turn, plus a spread label that inks in; reduced-motion sets final state.
- **Opening fixed (user-reported)**: the cover no longer reveals the hardcover through a spine gap — the right sheet is laid in while the cover is still cracked (it rides the gilded block, which the barely-open cover hides), so the binding is never seen empty. Flutter pages removed (they were the "second cover" hack); the cover simply swings open onto the placed spread.
- **Two-page gutter (user-reported)**: the seam now reads as two sheets diving into a shared valley, not one flat page — both inner edges dip to a common crease (`z≈0.132`) with a sharp dark core shadow + soft rolled-paper falloff baked into vertex colors; the gilded block is narrowed so the deeper right dip clears it.
- **Removed**: the gutter ribbon bookmark (`RibbonBookmark.tsx`, user-requested) and all per-page content/word reveal animations (`BookPageView` is now static print — the page moves, the ink stays still).
- Gates: `pnpm typecheck` green, story tests 15/15, `pnpm build` green; opening swing + crease + both drag directions verified headless (CDP).

## 2026-06-12 — Oath II monument is the drop emblem; site palette follows the active drop; banner product cards

- **The monolith is now the drop emblem itself, in true 3D** (`webgl/Monolith.tsx`): the CMS drop-mark SVG is fetched and extruded with three's `SVGLoader` + `ExtrudeGeometry` (beveled, merged, normalized to ~2.5 world units), floating in the void with a ceremonial sway that turns its face through the cursor-tracked bone light — bevel edges catch the glint. Same scroll poses (loom → recede → return + rise). When the CMS mark is not a parseable SVG, the faceted obsidian slab returns as fallback with a **larger, brighter engraved emblem decal** on its face. Added a soft bone front-fill light so the emblem reads between glints.
- **Visibility pass (user-reported)**: the hero pin no longer dims the CTA row — "Take The Oath" stays fully legible for the whole pinned stretch (supporting copy now dims to 0.4 instead of 0.25, CTAs excluded via `[data-hero-cta-row]`). Primary CTA label is `font-bold` near-black on bone; ghost secondary got a readable fill (`border /45`, `bg /[0.08]`). All scene eyebrows lifted `/70 → /85`, micro-numerals `9px → 10px`, hero corner labels and scroll cue brought to full muted/heading color.
- **The whole site now follows the active landing page's palette**: `LandingPageDefinition` gained code-owned `palette` overrides; `applyLandingPageTheme()` (registry) is applied over the published CMS theme in the root loader, so nav, footer, shop, PDP, and cart accents all follow the active drop. With `the-oath-2` active, every warm ember token remaps to cold steel + bone (`colorEmber #8e9196`, `colorEmberBright` bone, soft/glow at bone 10%/8%). `the-oath` leaves the theme untouched.
- **Product cards are now war banners** (`shared/components/ui/ProductCard.tsx`): the landing page's `WarBanner` gonfalon (crossbar, hang-straps, pointer tilt, ground glow) merged with the shop card's info plate — role, name, price/compare, colorways, status chip pinned to the crossbar as a heraldic label, "View piece" affordance. Fixed `aspect-[3/4]` fabric + fixed-structure plate (`line-clamp-2` + `min-h` name) keeps every card in the shop and related-products grids exactly the same size.
- **Console flood fixed (user-reported)**: configured a branded `defaultNotFoundComponent` (`app/components/AppNotFound.tsx`, "Off the forged path") on the router — TanStack was logging a warning on every render that no `notFoundComponent` was set, so any missing route / stale preload spammed the console. Also hardened the emblem monument: the extruded SVG geometry is rejected (falls back to the slab) if any vertex is non-finite, so a degenerate path can never make three.js warn every frame during frustum culling. Verified headless (CDP): home and a missing route both emit 0 console warnings/errors, and the missing route renders the branded 404.
- Gates: `pnpm verify` green (358 tests).

## 2026-06-12 — Oath II redesigned: The Black Monolith (cold steel + bone, no fire)

- **Third visual concept, picked by the user from three options**: all fire/ember art is gone. The WebGL layer is now **a faceted obsidian monolith** (low-segment cylinder, de-indexed flat shading, deterministic vertex displacement) floating in a near-black void — lit by a **cursor-tracked bone point light** so specular glints sweep the facets as the hand moves (the core interactivity), plus a dim steel rim light. The CMS drop logo is rasterized onto a faint emissive **crest decal** on its face (graceful null on load failure).
- **Scroll poses the stone**: looming beside the hero copy → receding through the creed → hidden behind the tenet dissolve → returning centre and rising for the finale; subtle cursor-lean on rotation. All lerped in `useFrame` from the existing motion-state bridge.
- **Spark fountain → void dust**: ~350/700 bone-grey motes on a slow lissajous drift, parted by the pointer, breathing slightly brighter on hover/finale — never a glow.
- **Cold palette pass**: every ember accent swapped to bone/graphite (eyebrows, rules, ticks, rail fill, card hovers, crest glow); primary CTA is now a bone slab with dark text; warm `ForgeAtmosphere` removed from the page in favour of a pure void gradient; hero DOM fallback shows a faint standing crest as the stone. Copy rethemed to the carved-oath voice ("An oath is not spoken. It is carved." / finale "The Stone Stands").
- Deleted: `oathHall.ts`, `embers.ts`, `HeroMoltenPlane.tsx`, `EmberParticles.tsx` (replaced by `Monolith.tsx`, `DustMotes.tsx`, `shaders/dust.ts`).
- Gates: `pnpm verify` green (356 tests).

## 2026-06-12 — Oath II hero: central hearth fire + spark fountain, dark page floor

- **Hero fire is now one contained hearth at bottom-centre** (`oathHall.ts` rework): a narrow flickering flame core + short plume with a tight halo; floor, edges, and top all fall to the page background, so the frame is dark everywhere except the fire itself. The flame leans toward the pointer; the steel mist parts around the hand.
- **Embers became a spark fountain**: particles now spawn at the hearth mouth and spray in an upward fan, arc under gravity, and die before landing (all vertex-shader). **Sparks bend toward the cursor** (exponential pull in mesh-local space). Finale/hover surge halved so the bottom of the page never brightens.
- **Bottom-of-page darkened**: finale's rising ember glow cut to a faint narrow hearth undertone; hero DOM fallback replaced with a matching central-glow gradient (full-width shimmer band removed).
- Gates: `pnpm verify` green (356 tests).

## 2026-06-12 — The Oath II rebrand, oath-hall atmosphere, header scrim + modal stacking fix

- **Page identity renamed `the-forge` → `the-oath-2` ("Drop 01 — The Oath II")**: registry entry, asset-slot scope, admin content editor, picker row, and any keyed `landing_content`/`asset_config` blobs migrated (migration `20260612124031`, applied). The code folder keeps its original codename (`pages/TheForgeLanding/`).
- **Hero rebuilt as an oath-hall atmosphere** (`webgl/shaders/oathHall.ts`, replaces the molten-steel shader): dark steel mist drifting through black, a faint bone-light shaft over the headline, a low breathing torch undertone — peak luminance stays low so content always reads. Pointer parts the mist instead of dragging fire. Default copy rethemed to the oath voice (Sworn In Steel / The Oath / Four Vows / The Oath Holds).
- **Brightness pass on everything fiery**: ember particles' alpha/size/surge reduced, DOM fallback gradients halved, hero vignette deepened, shader exposure floored.
- **Top bar legibility**: the transparent fixed nav now sits over a page-scoped top scrim (black→transparent gradient) on The Oath II, so it reads cleanly before the solid-on-scroll state kicks in.
- **Shared `Modal` now portals to `document.body`** at `z-[90]`: the landing-page activation confirm on the admin dashboard rendered inside `AdminCard` (a `z-[1]` stacking context) and painted behind sibling cards. Fixes every Modal usage.
- Gates: `pnpm verify` green (356 tests).

## 2026-06-12 — Drop 01 — The Oath II (built as "The Forge"): new WebGL landing page + CMS landing content model

- **New code-owned landing page** (`src/features/landingPages/pages/TheForgeLanding/`), registered alongside `the-oath` (which stays the default + active page until flipped in `/admin`). Six scenes: generative WebGL hero (SplitText char reveal, magnetic CTAs), pinned word-masked manifesto, four-tenet cross-dissolve gallery, optional warrior video interlude, pinned product showcase with pointer-tracked tilt, and a crest finale — plus a page-scoped custom cursor and a fixed scene progress rail.
- **Persistent WebGL layer** (three.js / @react-three/fiber): a fixed pointer-transparent canvas mounted by `ForgeCanvasGate` only on WebGL-capable ≥768px devices without reduced motion. Layers: generative hero shader plane reactive to scroll + pointer, a GPU ember field (700–1400 vertex-shader particles) that dims with the creed and surges on hover/finale, and a fullscreen displacement-dissolve plane for the tenets (CMS images upgrade procedural duotone textures in place). Three.js stays in the lazy `vendor-three` chunk — `ForgeCanvas` is its own 7.3 kB chunk; phones never download it. DOM fallback planes hand off via `[data-webgl="on"]` (opacity-only CSS).
- **DOM ⇄ WebGL motion bridge** (`motion/forgeMotionState.ts`): plain mutable object — ScrollTrigger writes scene progress + pointer, `useFrame` lerps uniforms toward it. Zero React re-renders; scrub jitter never reaches the GPU.
- **CMS landing content model**: new `landing_content jsonb` on `cms_settings` + `storefront_publication` (migration `20260612073914`, applied) carrying per-landing-key copy blobs. New `/admin/content` editor (RHF + Zod, scene-grouped) — every field optional, designed defaults shown as placeholders and applied whenever a field is blank, so clearing a field restores the designed copy. Flow: local store (`anvl.landingContent.v1`) → debounced `adminCmsRemoteSync` → both tables → SSR projection → `LandingPageComponentProps.landingContent` → `resolveForgeContent` (deep-merge over `FORGE_DEFAULT_CONTENT`). Projection read includes a missing-column retry so pre-migration deploys degrade to `{}`.
- **Asset slots** (`forgeAssetSlots.ts`): tenet media ×4, manifesto backdrop, interlude video/poster, product renders ×3, brand marks — every slot falls back to duotone + drop-mark placeholders (DOM `ForgeMediaFallback`, WebGL `forgeTextures.ts`); no hero media slot by design (the hero is generative).
- **SplitText registered** in `src/shared/lib/gsap.ts` (free since GSAP 3.13) with a masked-reveal wrapper that reverts in matchMedia cleanup.
- **Scope note**: the interlude renders its video in the DOM (not as a WebGL `VideoTexture`) — the band scrolls freely, and syncing a fixed canvas plane to a scrolling rect would require per-frame layout reads. The tenets plane works because that stage is pinned full-viewport.
- **Fallback matrix**: mobile/reduced-motion → `buildForgeStatic` (no pins, no WebGL, batch reveals, videos held at frame 0 under reduced motion); no-WebGL desktop → full GSAP film over DOM planes.
- Also fixed two pre-existing test failures (stale `DEFAULT_FONT_CONFIG` expectation; dashboard tests missing a QueryClient after the picker gained TanStack Query).
- **Gates:** `pnpm verify` green at every phase (typecheck + 356 tests + build); chunk audit confirms entry stays three-free.

## 2026-06-11 — Story book: real gutter, sunken spine, flutter ordering + back-turn fix

- **Backward grab-turn fixed**: releasing a back-dragged page sprang it forward again — the release handler XOR'd the landing side with the turn direction (double-counting it). The paper now falls to whichever side it is physically on (flick can override); whether that commits or cancels is decided per direction in `finishTurn`. Verified headlessly with simulated mouse drags both ways (Act 02 → 01 and 02 → 03).
- **No more "second cover" during opening**: the flutter leaves chased the cover on their own clock and could overtake it mid-swing. They now start later and are **hard-clamped to trail the cover** (`angle ≤ coverAngle − 0.07·(i+1)`), so the cover always leads and the pages follow, like a real book.
- **Soft gutter instead of a hard ridge**: the cloth spine box used to stand proud between the open pages. The spine now **sinks beneath the page block as the book opens**, and the page surfaces are **curved geometries that dip toward the binding** (`makeGutterPageGeometry`, gaussian dip ≈0.055 world) — the pages visibly join in the middle like paper sewn into a spine.
- Gates: typecheck + story suite 15/15 green; settled-book capture confirms the gutter.
- **Follow-up — true seam:** the two page meshes actually stopped **0.036 world short of the spine on each side**, exposing a cloth strip that read as a hard divider; and the first gutter dip's slope on the right page caught the key light as a white band. Pages now **extend to meet exactly at the spine at the same height** (`GUTTER_EXT`; left page carries the deep shadow-side roll 0.07, right page a shallow 0.012 crease), and the gilded block is narrowed so the dipped paper clears it. The open spread reads as one continuous sheet.
- **Follow-up — leaf hinge + gutter shading:** the turning leaf had the same 0.036 inner-edge gap (a visible slot at the spine during every flip) — it now reaches the pivot exactly and its hinge edge **droops into the binding** while turning (`LEAF_DROOP`, like sewn-in paper). Both pages and the leaf carry **baked vertex-color gutter shading** (paper darkens ~30% rolling into the binding, σ 0.2) so the spread visibly curves into the middle like a real open book. Verified via settled + mid-turn captures.

## 2026-06-11 — Story book: grab-to-turn pages, instant cover dissolve, mobile trims + app-wide cleanup

- **Grab the paper, not the book.** Pages now turn by **grabbing with the cursor**: invisible grab zones over each page; the leaf's hinge angle follows the held point (`acos(x/grab)` — hold it anywhere, even the middle, and it tracks), curling as it moves. On release it **falls to whichever side position + flick velocity dictate** (commit past the spine or flick ≥1.6 rad/s), then the spread advances (`onTurned` → `ChapterBook`). Arrows/keyboard still work. `PresentationControls` removed — the book itself can no longer be dragged/rotated.
- **Cover content no longer visible while opening**: the foil stamp now dissolves within the **first quarter** of the cover swing.
- **drei `<Html>` screen-space scale-loss fix**: after pointer-event churn, drei's mount effect could reset the overlay's `cssText` and its `eps` position-guard then never restored the `scale()` (content rendered unscaled). `eps={-1}` forces a per-frame transform refresh — verified by drag-turning headlessly (spread advances, layout stays pixel-locked).
- **Mobile story page trims**: shelf is a **2-up grid** with compact cards (description hidden); the tall hero war-banner and the closing "saga never ends" CTA are desktop/tablet-only.
- **GSAP "target not found" spam fixed** — page-reveal tweens now only target selectors present on the page variant (this warn, forwarded by vite, once filled a 10GB dev log).
- **App-wide cleanup**: removed **42 dead files** (old admin form components incl. `AdminDropdownMenu` + its orphan CSS, drop-builder-era CMS hooks/sync (`storefrontCmsSync`, `cmsSubscriptions`, `useStorefrontPublication`), waitlist mock/hook/types, unused `shared/types/*` + `site-settings.schema`, unused layout/motion/premium components (`AnnouncementBar`, `StickyHeader`, `AnimatedText`, `CTAGroup`, `EditorialHero`, `BrandBadge`, `HeroSpinningMark`, `IndustrialDivider`), `SceneMeta` + `useResponsiveMotionConfig` (unwired TheOath leftovers), and more). Removed unused deps **`@tanstack/react-table`** and **`@radix-ui/react-dropdown-menu`** (PERF-11 resolved). No `console.log` in src. CLAUDE.md folder map updated.
- **Gates:** `pnpm typecheck` + build green; story suite 15/15; full suite 327 passed with only the 4 pre-existing unrelated failures.

## 2026-06-11 — Story book: page content finally locked to the pages (all screen sizes)

- **Root cause found and fixed.** The page content drifted off the pages **proportionally to the window size** because drei `<Html transform>` (CSS-3D) mixes pixel and world units: the scene ends up ~4.6px from the CSS eye plane, where Chromium's painted projection diverges from WebGL canvas-size-dependently (and `getBoundingClientRect` reports the un-diverged position, which hid it from DOM probes).
- **Fix:** page content now renders via drei `<Html>` **screen-space mode** — position is a true camera projection (identical math to the WebGL paint) and scale is computed per canvas height (`size.height × HTML_DISTANCE / 400`), so the content **tracks the page meshes exactly at every window size and on resize**. Supporting geometry: the open book recenters so the page planes sit at z≈0, faces the camera dead-on (no tilt), camera on-axis, gentler PresentationControls range.
- **Remastered opening:** auto-open now waits for the fly-in to land (was opening mid-flight); fly-in arcs gently upward with a slight roll (1.1s); cover foil stamp dissolves in the first half of the swing; flutter pages tinted parchment; OpenFlash softened.
- Removed the interim runtime-calibration hack (superseded by the deterministic fix).
- **Verified:** headless-Chrome captures at 950×650 and 1600×1000 — content pixel-locked to the pages at both; `pnpm typecheck` + build green; story suite 15/15.

## 2026-06-11 — Story book: ancient cover tooling + cover fade on open

- **Ancient ornamental cover** (`coverTexture.ts`): the baked foil stamp now carries a **double frame**, **corner scroll flourishes with diamonds**, **side/bottom midpoint ornaments**, and a **faint compass medallion** (twin rings + 15° ticks + cardinal diamonds) behind the logo. All foil-coloured, alpha-tuned to read as worn hand tooling. Applies to the shelf and fullscreen book automatically (shared texture).
- **Cover content no longer lingers while the book opens**: the foil stamp **dissolves during the first half of the cover swing** (`opacity = 1 − 1.6t`, reversible on close).
- Verified via headless-Chrome captures of the shelf cover and mid-open frame; `pnpm typecheck` + build green; story suite 15/15.

## 2026-06-11 — Story book: real spreads, realistic open/turn, mobile flat reader

- **True facing-page spreads** (`bookSpreads.ts`, replaces `bookLeaves.ts`): the **left (verso) page is always visual** — the act's Supabase asset as a framed plate (with foil act caption + sheen sweep) or an **illuminated emblem plate** (crest, foil numeral, chapter + act titles); the **right (recto) page carries the act's text**. Both pages have their own running header and **printed-book folios** (left page = outer-left `2i-1`, right page = outer-right `2i`). Long acts **flow onto further spreads automatically** (even a single oversized paragraph is split at sentence boundaries).
- **Layout actually pinned.** Header/footer are now **absolutely positioned** inside a fixed-size page box (`overflow:hidden`), body strictly bounded between them — header can no longer escape the page top nor the footer float mid-page, regardless of content.
- **Realistic cover open**: timed eased swing (not an exponential lerp) with a soft **landing bounce**, **3 thin pages fluttering** after the cover, and the book breathing up as it opens; the facing pages reveal only once the cover has fully landed.
- **Realistic leaf turn** both directions: eased flip, the leaf **lifts off the stack**, and the curl is a **wave traveling free-edge → spine** (mirrored when turning back) instead of a static bow.
- **Magical reveals** after the leaf lands: words rise from the parchment, the rule draws itself, crest/numeral bloom in, and media gets a **random pose + foil sheen sweep** each turn.
- **Mobile (<768px)**: no three.js / GSAP at all — book **and** shelf use the lean CSS readers (single scrollable parchment page per spread, CSS-only entrance clamped by reduced-motion, safe-area-aware controls). **Tablets keep the full 3D book** with DPR capped at 1.5 for smoothness.
- **Gates:** `pnpm typecheck` + `pnpm build` green; story suite 15/15; vendor-three still lazy.

## 2026-06-10 — Story book: turn-then-reveal content (GSAP)

- **Decoupled the turn from the content.** The page-turn is now a clean **blank parchment flip**; the new page's content is hidden during the turn and **animates in only after the flip finishes** — text rises **word-by-word** (manual word-split + GSAP stagger, blur→sharp), and media gets a **random magical pose** each time (one of six). Honors reduced motion.
- **Header/footer fixed.** It was a flexbox `min-height:auto` bug — the body grew past the page and pushed the header/footer off. Body is now `min-h-0 flex-1 overflow-hidden`, so the header pins to the top and the footer to the bottom of the page.
- **Bigger page type** (12.5→14px) with pagination density retuned (`DEFAULT_PAGE_METRICS`) so it still fits.
- **Gates:** `pnpm typecheck` + `pnpm build` green; story suite 15/15; `/story` SSR 200.

## 2026-06-10 — Story book: coverage-based page reveal + page fit

- **Coverage-based reveal (true 3D turn).** Static pages are no longer drawn through the turning leaf. Each page's opacity is now driven by how much the leaf covers it: the **incoming page is hidden until the leaf lifts** (no more overlapping/overflowing text), the **leaf carries its content only while front-facing**, and the **left page hides as the leaf sweeps over it**. Drives a real crossfade outgoing→incoming as the page lifts.
- **Page fit.** Reduced the `<Html>` content scale (`distanceFactor` 1.2→1.1, ~84% of the page) so the **header sits inside the top margin and the footer at the bottom** instead of spilling past the page edges.
- **Gates:** `pnpm typecheck` + `pnpm build` green; story suite 15/15.

## 2026-06-10 — Story book: page-turn carries its content

- **The turning page now carries its content.** Previously a *blank* leaf flipped while the text sat static and swapped — disconnected. The turn state is now centralised in `Book` and the **leaf renders its own page** (`BookPageView` on the leaf), curling + flipping away to reveal the next page underneath. Content visibility is gated to when the leaf front faces the camera (no mirrored text).
- **Direction fixed.** Direction was read from a prop that could go stale across renders (pages turning the wrong way). It's now set synchronously in the turn effect. Forward: outgoing page flips away → incoming revealed; backward: incoming flips in from the left (content swaps at mid-flip). Softer curl + tuned speed to de-glitch.
- **Cleaner page layout.** Refined `BookPageView` — running header (chapter · act), drop-cap on the act's first paragraph, better line spacing, `16/9` media, ornamented page-number footer. Inlined the leaf (removed `CurlingLeaf`).
- **Gates:** `pnpm typecheck` + `pnpm build` green; story suite 15/15.

## 2026-06-10 — Story book: one book that opens + pages that fit

- **One book, not two.** Merged the shelf book and the opened book into a single `Book` component driven by an `open` flag — the *same* cloth hardcover (loved closed look, baked foil cover, gilded block, rounded spine) physically swings its front cover open and recentres on the spine. No more swapping to a separate, lower-quality open book.
- **Content fits the pages.** The page overflow was a drei `<Html transform>` scaling mismatch (`world = px × distanceFactor / 400`). Sized the page DOM (420×600) at `distanceFactor 1.2` so the header/body/footer render at ~92% of the actual page mesh — fully inside the page instead of spilling out.
- Removed `ClosedBook` (folded into `Book`). Shelf (`BookCanvas`) and overlay (`ChapterBook3D`) now both render `Book`.
- **Gates:** `pnpm typecheck` + `pnpm build` green; story suite 15/15; `/story` SSR 200.

## 2026-06-10 — Story book: baked cover, pagination, header/footer

- **Fixed the cover "jump to bottom".** The cover (drop label + logo + foil title + brand) is now **baked to a canvas texture** stamped on the cloth (`coverTexture.ts`) instead of a drei `<Html>` overlay, which mis-anchored/jumped on mount. SVG logos are tinted to the foil colour; the stamp is lit like real foil. Retired `CoverFace`/`ChapterPageContent`.
- **No more cheap-book flash.** Opening no longer flashes the flat CSS reader — the 3D `Suspense` fallback is now `null` (three.js is already warm from the shelf). The flat reader remains only for no-WebGL / reduced-motion.
- **Pagination + fit.** Page content is **paginated into leaves** (`bookLeaves.ts`): an act that doesn't fit one page **continues on the next** (`Act 01 (1/2)`…). Smaller book type and an `overflow-hidden` body so nothing spills.
- **Header + footer.** Each page has a running **header** (chapter · act) and a **footer** with the page number (`n / total`) — shared by the 3D and flat books via `BookPageView`.
- **Better open.** The book flies in as the **real closed shelf book**, gently rotates into place (`easeInOutCubic`), blooms (`OpenFlash`), then swings open with the **curling** leaf turn. Open-page **heading/text colours are CMS-driven**.
- **Gates:** `pnpm typecheck` + `pnpm build` green; story suite 15/15; `/story` SSR 200.

## 2026-06-10 — Story book: cover polish, realistic open + page-turn

- **Cover face** now anchors the drop logo + foil title to the **top** (padded), with a **bigger logo**; **SVG logos are tinted to the foil colour** (CSS mask) so they read as a stamped foil mark, raster logos render as-is.
- **CMS page colours.** Book colours gain **page heading** + **page text** (open-book ink), alongside cover/foil/edge — `bookColorsSchema` + `BookColorsField`; applied to the open pages via CSS-var overrides.
- **Bigger, realistic open book.** Larger book + pages so text/media fit; **vertex-curling page-turn** (`CurlingLeaf` billows + re-lit normals) instead of a flat flip.
- **Magical open-from-card.** The overlay now flies in as the **exact closed shelf book** (`ClosedBook` reused for continuity), eased (`easeInOutCubic`) from the card toward the viewer, then an additive **`OpenFlash`** bloom (foil-tinted) masks the cover swing into the open spread.
- **Gates:** `pnpm typecheck` + `pnpm build` green; story suite 15/15; `/story` SSR 200.

## 2026-06-10 — Story book: branded cover + physical open-from-card

- **Reusable book cover.** The 3D book now stamps the **drop logo + foil title** on its cloth cover (shared `CoverFace` + `resolveBookCover`, used by both the shelf book and the opened book so they're unmistakably the same object). Logo falls back to cover art, then the ANVL crest.
- **CMS colours + logo.** Story editor (`/admin/story`) gains a **drop-logo upload** and a **Book colours** panel (cloth cover / foil / gilded page-edge) via `BookColorsField`. Persisted to new `story_chapters.cover_logo` + `cover_colors` jsonb (migration `20260626120002_story_book_cover`); threaded through schema (`bookColorsSchema`, `coverLogo`), mapper, service, and the anon reader.
- **Physical open-from-card.** Clicking a shelf book hands its on-screen rect to the overlay (`openOrigin`), and the opened book **flies in from that card**, swings its cover open, and turns leaves — **drag to rotate** (`PresentationControls`). The pages are now **ink-on-parchment** (`.story-book-page` recolours the content tokens) instead of the old dark modal panel, so it reads like a real book.
- **Gates:** `pnpm typecheck` + `pnpm build` green; story suite 15/15; `/story` SSR 200. (Also unblocked a pre-existing, unrelated type error in the in-flight `useTheOathScrollTimeline.ts` — `tl.scrollTrigger ?? null`.)

## 2026-06-10 — Story books: premium 3D (Stripe-Press style)

- **Premium 3D book objects** (three.js / `react-three-fiber` + `drei`), modelled on the Stripe Press showcase. **Materials are the point:** cloth-bound `MeshPhysicalMaterial` covers (sheen + clearcoat), **foil-stamped ANVL crest** (gold-metal `alphaMap` of `mark.svg`), **gilded page block** (per-face material array), rounded covers + spine. Lit by a shared **studio rig** — image-based lighting from baked `Lightformer`s (no HDR download) + soft `ContactShadows` — which gives the cloth/foil their reflective sheen and grounding.
- **3D shelf.** `/story`'s chapter shelf now renders each chapter as a **live 3D book** (`StoryShelf3D` → `ChapterShelfCard` → `BookCanvas` → `ClosedBook`) that turns to show its spine and lifts on hover/focus. Semantics stay in the DOM (real `<button>` per card) so it's keyboard/SR-accessible; the canvas is purely visual. CMS image covers map onto the cover; otherwise the foil crest shows.
- **Opened book.** Click → a cloth hardcover with foil title/crest (+ cover art) that **flies in, swings its cover open, and turns a parchment leaf per act**, with **drag-to-rotate** (`PresentationControls`). Act/roster content renders as crisp `drei <Html>` on the page meshes.
- **Graceful degradation.** WebGL probe + `prefers-reduced-motion` gate both surfaces: no-WebGL/reduced-motion/SSR get the accessible **CSS shelf** (`ChapterShelf`) and **flat reader** (`ChapterBookFlat`). Dialog a11y (focus trap, Escape, scroll lock, page controls, arrow keys) lives in the `ChapterBook` orchestrator.
- **Bundle:** three.js is code-split into a lazy **`vendor-three`** chunk (~939 KB / ~245 KB gz) loaded **only on capable clients when the shelf/book mounts** — the `story` route chunk stays ~15 KB, storefront entry unchanged. New shared 3D modules live under `src/features/story/components/book3d/`.
- **Dependencies:** `three`, `@react-three/fiber` (v9, React 19), `@react-three/drei` (v10), `@types/three`. New `vendor-three` manual chunk in `vite.config.ts`.
- **Fix:** `AdminMicroHeading` renders its polymorphic `as` tag via `createElement` — three.js's global JSX element augmentation collapsed the `ElementType` children type to `never` under the old JSX form.
- **Gates:** `pnpm typecheck` + `pnpm build` green; story suite passes (15); `/story` SSR verified (200, content crawlable, no three.js on the server). Pre-existing unrelated failures remain: `publicStorefrontPublication.test.ts` (font migration) and `-adminDashboard.test.tsx` (landing-picker `QueryClient` in tests).

## 2026-06-09 — Story saga: chapters → acts → cast (CMS + cinematic book)

- **Story reimagined as a living saga.** `/story` is now a kingdom-and-army narrative told in **chapters** (one per drop), each with ordered **acts** and an authored **cast** (generals/recruits/loyal members). The old hardcoded four-section page became the seeded "Chapter 01 — The Oath" with four acts.
- **Cinematic book overlay.** The shelf shows chapter covers; clicking one opens a full-screen, deep-linkable overlay (`/story?chapter=<slug>`) where a forged cover **flips open (GSAP + CSS 3D)** to reveal the reader. Desktop/tablet get the flip; mobile/reduced-motion get the final state instantly (`gsap.matchMedia` both gates). Accessible dialog (focus trap, Escape, focus restore). **No three.js added** — pure CSS 3D + GSAP.
- **Supabase:** new relational tables `story_chapters` / `story_acts` / `story_cast` with RLS (anon reads published only; `editor`/`admin` write) and a dedicated public **`story-media`** bucket (image + video, 500 MB). Migrations `20260626120000_story_tables` + `20260626120001_story_media_bucket`. Advisors: no new RLS gaps.
- **Dependency inversion:** new `StoryClient` interface in `clients.ts`, wired in `runtime.ts` with a Supabase reader + a bundled **seed fallback** (works with no env). Assets resolve through `sanitizeHref`/`isLikelySafeMediaSrc` allowlists; external video supports Mux/YouTube/Vimeo embeds.
- **Admin:** new **Story** editor at `/admin/story` (lazy route) — chapter CRUD + per-chapter acts and cast, image/video upload to `story-media` or paste an embed URL, publish toggle.
- **Tests:** schema/asset-resolver/seed-client/row-mapper specs (15 tests). **Docs:** `docs/cms-architecture.md` updated (Story surface + schema + modules).
- **Gates:** `pnpm typecheck` + `pnpm build` green; story suite passes.

## 2026-06-08 — Responsive landing + chrome polish (mobile/tablet)

- **The Oath landing:** tablet now runs the **same** cinematic (pins + bleed) as desktop at full intensity — only CSS layout differs (hero `md:`/`lg:` split). Mobile reworked: the four tenets collapse into a one-screen 2×2 grid of translucent cards (forge bleeds through), products render as a 2-col grid (odd last item centred), and reveals use a staggered `ScrollTrigger.batch`. Hero video plays **once** on mobile then holds the last frame (no loop); the DR-01/coords metadata strip is hidden on mobile (decluttered + no scroll-cue overlap). CTA buttons redesigned (forged ember slab + nudging arrow, smaller on mobile).
- **Storefront nav:** removed the fixed mobile **bottom bar**; the burger + cart now live in `PremiumNavTopbar` (variant-aware, slightly smaller on mobile). Inline desktop links moved to `lg:`; `PremiumNavMobile` is now purely the drawer.
- **Footer:** complete redesign — removed the placeholder newsletter form and dead `#` social links (+ admin-leak fallback text). Brand block + multi-column nav grid + thin legal bar; emblem watermark, tagline, and "Forged Under Pressure" micro-caption retained.
- **Docs:** updated `docs/responsive-design-guidelines.md` (nav section).
- **Gates:** `pnpm typecheck` + `pnpm build` green; landing + layout test suites pass. (Pre-existing unrelated failure: `publicStorefrontPublication.test.ts`, tied to the in-progress font-library migration on this branch.)

## 2026-06-07 — Static storefront navigation

- **Nav chrome is code-owned:** header, footer, and mobile drawer links come from `staticWebsiteNavigation.ts` / `navigation.defaults.ts` — never Supabase or CMS layout editors.
- **Links:** Story (`/story`) and Care Guide (`/care-guide`) in header + footer; removed legacy `/drop/the-oath` nav target (no drop route).
- **`useWebsiteNavigation`** is now a pass-through (no CMS config subscription for nav).
- **Sitemap:** replaced `/drop/the-oath` with `/story`.

## 2026-06-07 — CMS + Supabase minimal cleanup

- **Slim CMS:** Admin reduced to four surfaces — Active drop (`/admin`), Theme & Colors (`/admin/theme`), Fonts (`/admin/fonts`), Assets (`/admin/assets`) — plus Settings. Removed Products, website layout, SEO, drop-builder, campaigns, lookbook, and global-brand editors.
- **Supabase:** Migration `20260607120000_cms_minimal_cleanup` — dropped `cms_admin_products`, `shopify_product_links`, bloated `storefront_publication` columns; added `theme_config`, `font_config`, reshaped `asset_config`; dropped `cms_settings.seo_config`; seeded Anton/Sora/Cinzel + oath-dark palette defaults.
- **Storefront:** `SiteThemeProvider` applies published theme/fonts via CSS variables; `resolvePublishedAssets` merges general + per-drop slot assignments; `LandingPageRenderer` passes `assets` to code-owned pages. Nav/footer/SEO use hardcoded defaults.
- **Commerce:** Shopify when configured, else seed/mock — no CMS product editor or `products_snapshot`.
- **Docs:** Rewrote `docs/cms-architecture.md`; updated `docs/landing-pages.md`, `CLAUDE.md`.
- **Gates:** `pnpm verify` green (279 tests, build OK).

## 2026-06-06 — Drop-builder teardown completed (code green + DB applied)

- **Repaired the half-finished deletion.** A prior session deleted ~40 drop-builder files but left ~20 dangling imports (Vite + `tsc` red). Repointed relocated helpers (`createCmsId` → `admin/lib/cmsId`, `resetAllLocalCmsKeys` → `admin/lib/resetLocalCms`); `products.mapper` no longer calls `readDropsArray` (empty local drop index); seed products are drop-free individuals.
- **Removed drop UI from admin editors:** `ProductEditorRoute` (Drops tab + drop-link persistence gone), `-adminProductsIndex` (drop filter/grouping/column gone), `SiteLayoutEditor` + `SiteLayoutPreview` (active-drop "campaign slot" concept gone), `AdminShopifyProductGrid` (inlined `/shop/$slug`). Stale tests updated; dead `ActiveDropThemeBridge.test` + the `cms_publish_drop` RPC helpers (`adminCmsPublish.ts`, `adminCmsProcessScheduledDrops.ts` + test) deleted. `getActiveDrop`/`getLandingCmsContent`/`getHomepageContent` now have zero source references.
- **Products snapshot write** already lands in `adminCmsRemoteSync` (`products_snapshot` + `catalog_drop_index`), independent of the removed RPC.
- **Destructive DB teardown applied** (Supabase MCP, project `cptebkgyrfmokklwtrgp`): dropped `anvl_drops`, the three `storefront_publication` drop columns, the `cms_publish_drop`/`_core`/`cms_process_scheduled_drops` RPCs, and unscheduled the `anvl-process-scheduled-drops` cron. Recorded as migration `20260606051107_drop_builder_teardown` and promoted into `supabase/migrations/`; manual `supabase/teardown/` file removed. Publication row verified intact.
- **Edge Functions:** `publish-storefront` + `process-scheduled-drops` folders removed from the repo. Deployed instances are inert (cron/table/RPCs gone) but remain live — Supabase MCP has no delete tool, so undeploy via `supabase functions delete <slug>`.
- **New-model migrations applied** (were never on the remote DB): `cms_settings_landing_pages` (`cms_settings`, `landing_pages`, `storefront_publication.active_landing_page_key` + RLS/grants, seeded `the-oath`) and `storefront_profiles` (customer identity + signup auto-create trigger + RLS). Recorded as migrations `20260606052134` / `20260606052151`; local files renamed to match remote versions (idempotent guards) and the future-dated originals removed. Hardened the new `handle_new_storefront_user()` trigger fn with `REVOKE EXECUTE` (advisor 0028/0029).
- **Gates:** `pnpm verify` green (329 tests, build OK). Remaining follow-ups (`docs/cms-teardown-plan.md`): undeploy the two live edge-function instances via CLI; optionally drop orphaned `cms_act_natures`/`cms_act_layouts` tables.

## 2026-06-06 — Warrior redesign, wave 2 (type, chrome, motion, controls)

- **Type pair swapped to fit the logo:** Bebas→**Anton** (heavy condensed industrial display; single weight keeps `font-normal` headings bold) and Manrope→**Sora** (modern geometric grotesk body), self-hosted via `@fontsource`, preloaded in `__root.tsx`. Cinzel kept only as the small heraldic accent.
- **Unified buttons:** `Button` cva primary→forged ember + uppercase tracking; secondary→steel w/ ember hover. `OathCtaLink` + page CTA classes matched. One feel site-wide.
- **Themed native controls:** global CSS styles every `input[checkbox/radio]` + `select` (ember `accent-color`, custom forged box/dot, chevron) — reusable with no per-use class.
- **Header:** fixed transparent overlay over the hero, solid blurred panel on scroll (`usePremiumNavPhase` scroll-aware), bottom border removed; `<main>` offset on non-home routes, home hero full-bleed.
- **Landing motion:** hero no longer scroll-seeks the video (was janky) — it plays smoothly while scroll drives a Ken-Burns/parallax exit + entrance (mask-in title, drawing ember underline). Tenets shortened (~55%/tenet) with distinct per-tenet enter/exit + ember progress ticks + a manifesto line each. Final section rebuilt as a closing vow (crest banner drop-in, igniting ember rule, word mask-up). Scenes capped at `--anvl-section-h` (viewport − header).
- **Nav fix:** dead `/drop/the-oath` top-bar link repointed to `/story` (`navigation.defaults` + `cms.mock`).

## 2026-06-06 — Warrior identity redesign (landing + story + shop + about + size-guide)

- **Accent layer (additive, brand tokens kept):** new `--color-ember` / `--color-ember-bright` / `--color-ember-soft` forged-bronze tokens in both themes; `--font-display` ("Cinzel", self-hosted via `@fontsource/cinzel`, preloaded in `__root.tsx`) + `.anvl-display` heraldic utility; `.anvl-ember-rule` divider; `.anvl-ember` / `.anvl-banner-sway` motion (reduced-motion safe). Bebas/Manrope and the bone/steel/black palette are unchanged.
- **Shared primitives:** `WarBanner` (3D medieval hanging banner — forged crossbar, gonfalon clip-path, ember frame, wraps media or duotone+emblem placeholder) and `ForgeAtmosphere` (persistent ember/grain backdrop, deterministic SSR-safe ember field). `SectionEyebrow` gained an `ember` variant.
- **Landing (The Oath):** now reads as **one continuous forge** — a fixed `ForgeAtmosphere` behind transparent scenes (Manifesto/Final use `MediaPlane transparent`; Chapters/Products transparent) instead of opaque per-section backgrounds. **Product reveal rebuilt**: a single pinned scene where the three pieces assemble **horizontally** as war banners (outer slide in from left/right, centre drops onto a forged rail) — vertical scroll reading as sideways motion. Motion in `buildProducts` (`useTheOathScrollTimeline`), `gsap.matchMedia` desktop/tablet/static; mobile + reduced-motion stack and reveal, no pin.
- **Pages:** `/story` (drop page), `/shop` (listing hero + `ProductCard` ember pass + PDP shell), `/about`, `/size-guide` reskinned with ember + heraldic display; all commerce/filter/loader/SEO logic preserved. Fixed long-standing mojibake (`â€“`/`â€™`/`â€”`) in size-guide copy.
- **Note:** the concurrent drop-builder teardown that briefly made repo-wide `pnpm verify` red was completed the same day (see the entry above) — `pnpm verify` is green again.

## 2026-06-02 — Landing act section height and clipping fix

- **Root cause:** `.anvl-screen-section` capped acts at `max-height: 100svh` with `overflow-y: auto`, so tenet lists, chapter stacks, and lookbook grids were clipped or trapped in inner scroll instead of growing the page.
- **Global:** Sections grow with content (`overflow: visible`, `max-height: none`); default floor `min-height: max(28rem, min(70svh, …))`; modifiers `--standard`, `--tall`, `--content`, `--compact`.
- **Oath presets:** `OathTenetLedger`, `OathNarrativeScroll` use `sectionSize="tall"`; `OathForgeClose` uses `content`; spacing/typography polish; `ACT_RESPONSIVE_STYLE` emblem/padding floors raised.
- **Lookbook:** `MasonryLookbook`, `EditorialLookbook`, `CarouselLookbook` use `--tall` + `overflow-visible` with roomier vertical padding.
- **Admin preview:** `DropEditorLivePreview` iframe CSS matches storefront act sizing (no max-height clip).
- **Tests:** `actPresetUtils` standard/tall class tests; `actResponsiveTokens.test.ts`.

## 2026-06-02 — Landing hero scroll, product banners, act viewport cap

- **Cinematic hero (CRITICAL):** Root cause — pinned beats are `absolute inset-0`; GSAP scrub on scroll-back left multiple beats partially opaque and `onLeaveBack`/`onEnterBack` did not reset timeline progress to 0. Fix: `visibility` + z-index stack sync, `resetToScrollTop()` on re-enter, CSS `invisible` fallback on non-first beats, `syncCinematicBeatStack` during mid-scroll crossfades.
- **Product cards:** Redesigned as compact horizontal banner strips (`aspect-[5/2]` / height-capped in pinned beat); side-by-side row at `sm:grid-cols-3`; image-left editorial layout; desktop GSAP tilt via `useProductCardParallaxTilt`, CSS hover depth when reduced motion.
- **Act sections:** `.anvl-screen-section` capped at `max-height: min(100svh, var(--anvl-section-h))` with `overflow-y: auto` (superseded by act clipping fix entry above).
- **Tests:** `CinematicScrollHero`, `BrandShowcaseExperience`, `actResponsiveTokens`.


## 2026-06-02 — Cinematic hero scroll-top visibility + nav overlay

- **Cinematic hero:** First desktop beat defaults to `opacity-100` (SSR/pre-GSAP); `applyCinematicHeroScrollStartState` re-shows section 0 when ScrollTrigger progress is at top (fixes scrub lag hiding beat 0 after scroll-back). Desktop stage drops `--anvl-header-h` vertical padding so the hero fills the viewport under the overlay nav.
- **PremiumNav:** Mobile height spacer omitted during cinematic overlay so the hero is not pushed down in document flow.
- **Tests:** `cinematicHero.visibility.test.ts`, extended `CinematicScrollHero` and `PremiumNav` tests.

## 2026-06-02 — Cinematic nav, logos, and act sizing fixes

- **PremiumNav:** Transparent header wrapper and ghost cart button while `cinematic` phase; solid chrome only after hero pin `onLeave` (timeline no longer resets phase on desktop context cleanup).
- **CampaignMark:** Inline brand SVGs with `onDark` tint; GSAP `data-cinematic-copy` wrapper in cinematic hero; oath act presets (`OathTenetLedger`, `OathForgeClose`, `OathMonolithReveal`, `OathNarrativeScroll`) use `CampaignMark` instead of raw `<img>`.
- **Act sections:** `.anvl-screen-section` uses content-driven `min-height: clamp(28rem, 62svh, …)` instead of forced full viewport; smaller `--act-emblem-size`; admin live preview CSS aligned.
- **Tests:** `CampaignMark.test.tsx`, extended `PremiumNav.test.tsx`.

## 2026-06-02 — Premium design system primitives + shop chrome

- **`shared/components/premium/`:** `SectionShell`, `PageHero`, `ContentPanel`, `SectionEyebrow`, `CTAGroup`, `BrandBadge` for consistent storefront hierarchy.
- **`ContentPage`:** Static pages use `PageHero` + `ContentPanel`.
- **`/shop`:** Premium page hero and availability badge; mobile filter drawer unchanged.
- **Tokens:** `--anvl-section-py`, `--anvl-content-gap` in `styles.css`.
- **Drop 01 seed:** 8-act sequence adds `lookbook` (`masonryLookbook`) between materials and final CTA.
- **Tests:** `PageHero.test.tsx`.

## 2026-06-02 — PremiumNav replaces StickyHeader

- **`PremiumNav`:** Phase-aware storefront chrome (`PremiumNavTopbar`, `PremiumNavSideRail`, `PremiumNavMobile`, `AnnouncementRail`) driven by `usePremiumNavPhase` + `cinematicHeroPhase` store — transparent topbar and desktop side rail during cinematic scroll; solid commerce chrome after.
- **`__root.tsx`:** Always renders `PremiumNav` and site footer with drop theme (no brand-showcase shell hide).
- **Tests:** `PremiumNav.test.tsx`, `usePremiumNavPhase.test.ts`.

## 2026-06-02 — Cinematic scroll hero storefront module

- **`cinematic-hero/`:** Zustand phase store, GSAP pinned timeline (`useCinematicHeroTimeline`), background/section views, and `CinematicScrollHero` act preset wired in the registry (four hero presets; default `cinematicScrollHero`).
- **Homepage:** `/` always renders `PublicLandingActs`; Lenis smooth scroll only when a enabled `cinematicScrollHero` act is present; drop theme and site chrome always apply (`__root.tsx`).
- **CMS:** `siteHomepage` mode `default` parses to `custom`; Drop 01 seed hero uses `cinematicScrollHero` + `defaultCinematicConfig`; `drops.migrate` keeps `lookbook` acts; layered hero media presets are `productHero` / `standardHero`.
- **Supabase:** migration `20260602120000_cinematic_hero_layouts.sql` seeds hero layout rows and normalizes published `site_homepage.mode`.
- **Admin:** dashboard homepage mode toggle replaced with act-based guidance.
- **Tests:** `cinematicConfig.zod`, `CinematicScrollHero` SSR render, updated `registry.test.ts`.

## 2026-05-20 — Production follow-ups: migrations, scheduler cron, bundle split

- **Supabase (project `cptebkgyrfmokklwtrgp`):** applied migrations **`storefront_site_drafts`**, **`cms_media_assets`**, **`cms_scheduled_activation`** (`media_index`, catalog table, `cms_process_scheduled_drops`).
- **Edge Function:** **`process-scheduled-drops`** deployed (`CRON_SECRET` auth, calls RPC with service role). Schedule in Dashboard every 1–5 min after setting secrets.
- **Bundle:** `vite.config.ts` splits act presets per nature (`act-presets-hero`, `act-presets-lookbook`, …) instead of one monolithic chunk (`PERF-12`).

## 2026-05-20 — Admin sidebar nav revert + footer actions

- **`AdminSidebar`:** Nav links restored to pre-chip bordered blocks (accent border when active); badge pills and chip nav removed. Footer only: bone-outline “View storefront” and red-tint Logout with leading icons on one line (`inline-flex`, `whitespace-nowrap`).
- **`AdminLayout`:** Drawer-only nav at all breakpoints (removed persistent `lg:` rail and `lg:hidden` on drawer).

## 2026-05-20 — New act natures + homepage extras (PR-9 / MAINT-21)

- **`act-presets/`:** Storefront renderers for **`lookbook`**, **`specialEvent`**, and **`finalCTA`** (nine presets total) registered in `registry.ts` with defaults matching the Acts builder keys; GSAP via **`useActScrollReveal`** (desktop + reduced-motion gated).
- **`PublicLandingActs`:** Resolves the three new natures through the registry (no unsupported-act skip for these types).
- **Homepage:** **`CampaignCardsSection`** and **`LookbookStripSection`** render on `/` when **`storefront_publication.campaigns`** / **`lookbook`** (or local **`siteHome`** storage) are non-empty.
- **Admin:** **Home extras** tab on **Website layout** edits campaign cards + lookbook strip; **`adminCmsRemoteSync`** syncs both arrays to **`storefront_publication`**.

## 2026-05-20 — Admin nav drawer at all breakpoints

- **`AdminLayout`:** Removed persistent `lg:grid-cols-[280px_1fr]` sidebar column; main content is full width at every breakpoint. Nav opens via the shared left `Drawer` (focus trap, Escape, backdrop click, route-change close via `onNavigate`).
- **`AdminTopbar`:** Burger menu button is always visible (removed `lg:hidden`).
- **`Drawer` / `styles.css`:** Slide-in + backdrop fade animations gated on `prefers-reduced-motion: no-preference`.
- **Tests:** `AdminLayout` (no persistent aside, burger opens drawer, nav link closes), `AdminTopbar` (burger not `lg:hidden`).

## 2026-05-20 — Admin sidebar chip nav (desktop / drawer parity)

- **`AdminSidebar`:** Nav links use shared `adminChipButtonVariants` pills (`primary` when active); removed secondary badge pills (Overview, System, …) and desktop-only descriptions.
- **Footer:** “View storefront” and Logout both use chip styling (`AdminTopbarChipButton` / chip link classes).
- **Layout:** Persistent `lg:` sidebar and mobile drawer share the same compact nav chrome; drawer hidden on `lg:`; section cluster labels stay muted uppercase.
- **Tests:** `AdminSidebar` asserts badge pills are absent and active route uses `aria-current="page"`.

## 2026-05-20 — Admin CMS chip field controls (shared `cmsFieldStyles`)

- **`cmsFieldStyles`:** Pill / soft-surface tokens aligned with `adminChipButtonVariants` — `adminFieldControlClass`, `adminFieldTextareaClass`, `adminSelectTriggerClass`, clear-button + compact row helpers.
- **Primitives:** `AdminInput`, `AdminTextarea`, `AdminSelect`, `AdminNativeSelect`, `AdminCheckbox`, `AdminDateField`, `AdminDateTimeField` use shared classes; dropdown panels stay elevated/readable.
- **Pickers:** `ColorField` compact row + fine inputs, `MediaPickerField` URL row, media library search inherit chip chrome.
- **Tests:** `cmsFieldStyles`, `AdminSelect` trigger chrome, updated `ColorField` / `MediaPickerField` class assertions.

## 2026-05-20 — Drop editor status badge dedupe

- **`DropEditorRoute`:** One emerald **Live** chip when the drop is storefront-active; otherwise CMS status only (Draft, Scheduled, …). Removed redundant **ACTIVE** + **Active drop** pair.
- **`DropAdminListCard`:** Same single-badge rule; removed extra **Storefront drop** label.
- **`AdminStatusBadge`:** `size="chip"` (`h-9`) for topbar alignment; shared `dropStatusBadgeLabel` helper; live tone tokens aligned with chip `success` variant.

## 2026-05-20 — Admin CMS pill chip buttons (shared variants)

- **`adminChipButtonStyles`:** CVA tokens (`default`, `primary`, `destructive`, `ghost`, `success`) + `icon` size for overflow/menu triggers.
- **`AdminTopbarChipButton`:** `variant`, `size`, `loading`; re-exports class helpers.
- **`AdminButton`:** `primary` / `secondary` / `ghost` / `destructive` render as chips; tab variants still use shared `Button`.
- **Migrated:** Editor topbars (variant props), `AdminSaveBar`, `AdminConfirmDialog` footers (via `AdminButton`), drops overflow trigger, forged/outline/icon links, `AdminSecondaryExternalLink`.
- **Tests:** Chip variant coverage on `AdminTopbarChipButton`, `AdminButton`, `adminChipButtonStyles`.

## 2026-05-20 — Act preset registry + GSAP scroll animations (PR-8 / PERF-12 RESP-15)

- **`act-presets/`:** Registry maps `nature × preset` → lazy storefront renderers for all seven existing act natures; defaults align with CMS builder seeds.
- **`useActScrollReveal`:** Shared ScrollTrigger helper gated on `(min-width: 768px) and (prefers-reduced-motion: no-preference)`; mobile shows static final state.
- **Presets:** Default wrappers for legacy sections (`HeroForgeSequence`, `OathStampSequence`, etc.) plus alternate layouts (`splitProduct`, `splitText`, carousel, specs grid, split waitlist, …).
- **`PublicLandingActs`:** Registry lookup by `act.nature` + `act.preset` (fallback to nature default); `vite.config.ts` **`act-presets`** manual chunk.

## 2026-05-20 — Admin drops list card grid (all breakpoints)

- **`DropsAdminList`:** Removed desktop TanStack Table; drop cards render in a responsive grid (`1` / `sm:2` / `xl:3` columns) at every breakpoint.
- **Sort:** Column-header sorting replaced with a **Sort by** dropdown (default **Last edited (newest)**); logic extracted to **`dropsListSort.ts`**.
- **`DropAdminListCard`:** Card UI extracted from the list page; active drops keep a subtle emerald border tint.

## 2026-05-20 — Admin topbar chip actions + drop activate toggle

- **`AdminTopbarChipButton`:** Shared pill control (`h-9`, `rounded-full`, `surface-soft`) for topbar actions and session chip.
- **`DropEditorRoute`:** Reset / Delete / Save / Activate|Deactivate use chip buttons; activate toggle calls `setAdminActiveDrop` / `deactivateAdminDrop` with confirm dialogs.
- **`ProductEditorRoute`:** Catalog / Save / Delete topbar actions use chip styling.
- **Backend:** `deactivateDrop`, `clearStorefrontActiveDrop`, `deactivateAdminDrop` on CMS client + `useDeactivateAdminDropMutation`.

## 2026-05-20 — Admin drops list card redesign

- **`DropAdminListCard`:** Campaign grid cards with right-aligned emblem watermark (gradient scrim), optional theme-accent wash, live storefront styling, and preserved overflow menu + metadata.
- **`AdminDropListItem`:** List mappers now include `emblemImageUrl` and `themeAccent` from drop visuals/theme (localStorage + Supabase).

## 2026-05-20 — CMS editor actions in admin topbar

- **Pattern:** All CMS editors register Save / Reset / Delete via `useAdminPageActions()` + `AdminTopbarChipButton` pills in the `admin-page-actions` slot (reference: `DropEditorRoute`).
- **Migrated:** `ProductEditorRoute` (Catalog, Save, Delete), `SiteSeoEditor`, `SiteLayoutEditor` (inline validation alert when save blocked), `SiteThemeEditor`.
- **Removed:** Sticky bottom `AdminSaveBar` from site SEO, layout, and brand-fallbacks editors.
- **Tests:** Topbar slot coverage for product + site editors; layout validation error + disabled save.

## 2026-05-20 — Admin mobile nav control styling

- **`AdminTopbar`:** Mobile menu button matches session chip — `h-9`, `rounded-full`, `bg-[var(--color-surface-soft)]`, muted 14px icon (replaces square `IconButton`).

## 2026-05-20 — Drop functional gaps (PR-7 / MAINT-20)

- **DB:** Migration **`20260620130000_cms_scheduled_activation.sql`** — `_cms_publish_drop_core`, **`cms_process_scheduled_drops()`** (service_role; Edge/cron — pg_cron not used); refactors **`cms_publish_drop`** to delegate to core.
- **Admin sync:** **`scheduleDropActivation`** already writes **`status: scheduled`** + **`scheduled_activation_at`** via **`buildAnvlDropRemoteRow`** (Vitest coverage added).
- **Storefront:** **`PublicLandingActs`** product showcase uses act **`productIds`** when set; otherwise first six products.


- **DB:** Migration **`20260620120000_cms_media_assets.sql`** — `cms_media_assets` catalog with RLS (CMS read; editor/admin write).
- **Admin:** `MediaLibraryPage` grid (search, mime filters, inline alt, copy URL, delete confirm), drag-drop upload to `cms-media` + catalog row.
- **Sync:** `flushAdminCmsRemoteSync` patches **`storefront_publication.media_index`** from the catalog.
- **Picker:** `MediaPickerField` optional **Browse library** modal; `uploadCmsMediaFile` supports `registerInCatalog`.

## 2026-05-20 — Site SEO editor + structured data (PR-5 / MAINT-21)

- **`SiteSeoEditor`:** Defaults / Pages tabs, char-count meta fields, live Google + Twitter preview, sticky **`AdminSaveBar`**.
- **Persistence:** **`saveSiteSeoContentAsync`** write-through to **`storefront_publication.site_seo`**.
- **Storefront:** **`buildSeoHeadForSiteStaticPath`** merges **`site_seo.staticPages`** on `/`, `/shop`, `/about`, `/size-guide`.
- **JSON-LD:** **`dropStructuredDataJsonLd`** on homepage (when active drop sets type) and drop route.

## 2026-05-20 — Brand fallbacks editor redesign (PR-4 / MAINT-21)

- **`SiteThemeEditor`:** hero strip, side-by-side emblem tiles, read-only active drop palette swatches, sticky **`AdminSaveBar`**.
- **Nav:** Site item renamed **Brand fallbacks** (badge **Global**).
- **Route shell:** `-adminTheme.tsx` delegates to `src/features/admin/site-theme/`.
- **Storefront:** `previewLoadingSrc` test confirms drop emblems win over global fallbacks.

## 2026-05-20 — Site Layout editor redesign (PR-3 / RESP-15)

- **`SiteLayoutEditor`:** tabbed Header / Footer / Announcement panels; sticky **`AdminSaveBar`**; live **`SiteLayoutPreview`** (lg+ column, mobile `<details>`).
- **Route shell:** `-websiteLayoutRoute.tsx` delegates to feature module under `src/features/admin/site-layout/`.
- **Copy:** trimmed `/drop/` campaign slot helper text; save moved off topbar page actions.

## 2026-05-20 — Admin topbar + CMS copy trim (PR-2 / MAINT-21)

- **`AdminTopbarSessionChip`:** compact account pill with menu (storefront, settings, logout).
- **Topbar:** single-line title, no duplicate “ANVL Admin” + username row; description only on Dashboard.
- **Copy:** shortened nav descriptions, trimmed site route helper text (SEO, Media, Theme, Settings, Drops list).

## 2026-05-20 — Supabase CMS single source of truth (PR-1 / MAINT-20)

- **`cmsPersistenceMode`:** `shouldStorefrontUseLocalCmsFallback()` — public site never reads admin `localStorage` when `VITE_SUPABASE_*` is set; sync helpers use `canWriteCmsDraftsToSupabase` (`editor` + `admin`).
- **Write-through:** `cmsWriteThrough.afterLocalCmsMutation()` + `saveWebsiteLayoutContentAsync` / `saveGlobalBrandSettingsAsync` flush to Supabase on explicit Save (layout + brand fallbacks).
- **Storefront sync:** `storefrontCmsSync` returns seed snapshot on Supabase-configured browsers until publication hooks resolve (no draft leakage).
- **Admin:** Re-hydrates CMS from Supabase on window focus / tab visible when signed in.
- **DB:** Migration **`20260620100000_storefront_site_drafts.sql`** — `storefront_publication.media_index` placeholder for Media library (PR-6).

## 2026-05-20 — Admin CMS UI primitives consolidation (full pass)

- Summary: Added reusable admin UI primitives and completed a five-step CMS UI pass: (1) migrated `ProductEditorRoute`, website layout, settings, login, and products filters to `AdminFormField` / `AdminInput` / `AdminSelect` / `AdminNativeSelect` / `AdminCheckbox`; (2) `AdminConfirmDialog` on drop editor save/reset/delete and product delete; (3) `DropActsBuilderPanel` uses `AdminPanel`, `AdminFieldLabel`, `AdminMicroHeading`; (4) `motion-safe` transitions on `AdminPanel`, `Modal`, `AdminConfirmDialog`; (5) trimmed redundant `AdminSectionHeader` strips — product/website editors register actions in `AdminTopbar` via `useAdminPageActions`. Vitest coverage for core primitives. See `docs/features/admin-ui.md`.

## 2026-05-19 — Storefront acts + drop theme follow published snapshot

- **Landing acts:** Public `composeLandingPageFromDrop` prefers **`Drop.acts`** (acts builder) when non-empty, then falls back to **`landingActSequence`**. **`LandingPageCmsContent.dropActs`** carries full act rows so **`PublicLandingActs`** overlays copy on `/` (same path as drop editor **`draftActs`**).
- **Theme/colors:** Published drop palette CSS targets `:root[data-theme="oath-dark"]` so it overrides static defaults in `styles.css`; theme style tag keys off drop id + `updatedAt` for reliable updates after publish.

## 2026-05-19 — Fix cms_publish_drop UUID error + sync drops table actions

- **DB:** Migration **`20260519230000_cms_publish_drop_client_drop_ids.sql`** — `cms_publish_drop` resolves product **`dropIds`** via **`anvl_drops.client_drop_id`** (fixes `invalid input syntax for type uuid: "drop_the-oath"` on save/activate when products link to drops).
- **Drops list:** Duplicate, schedule, archive, and delete now **`flushAdminCmsRemoteSync`** before the list refetches Supabase (actions were local-only until debounced sync).
- **Edge:** **`publish-storefront`** accepts app **`Drop.id`** (`client_drop_id`) or UUID PK.

## 2026-05-19 — Create new drop inserts `anvl_drops` row before editor

- **`/admin/drops/new`:** **`createDraftDropAsync`** saves default draft values locally, inserts into **`public.anvl_drops`** immediately when Supabase is configured, invalidates the admin drops list, then redirects to **`/admin/drops/:dropId`**. Remote insert failure rolls back the local draft and shows an error.

## 2026-05-19 — Fix cms_profiles timeout on admin sign-in

- **Role read:** After `signInWithPassword`, `cms_profiles.role` is fetched via PostgREST with the sign-in **access token** (bypasses GoTrue `getSession` lock when bootstrap is still running on the same storage key).
- **Session:** Calls `setSession` from the sign-in response before CMS hydration; stale bootstrap work aborts when the admin client is disposed.
- **Supabase setup:** If sign-in succeeds but access is still denied, ensure a row exists: `INSERT INTO public.cms_profiles (user_id, role) VALUES ('<auth-user-id>', 'admin') ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;` — RLS policy `cms_profiles_select_self` already allows `SELECT` where `auth.uid() = user_id`.

## 2026-05-19 — Fix admin sign-in spinner stuck (auth client lock)

- **Login:** Disposes in-memory Supabase client before sign-in so a hung bootstrap `getSession` cannot block `signInWithPassword`. Sign-in and `cms_profiles` role read use **20s / 12s timeouts**; errors surface instead of infinite loading.
- **Bootstrap:** When `getSession` times out, drops the in-memory client and recreates it for subsequent login.

## 2026-05-19 — Fix Supabase "No API key found in request"

- **Clients:** All browser Supabase clients set an explicit **`apikey`** header via **`createAnvlSupabaseClient`**. Admin singleton recreates when URL/key changes.
- **Env:** Rejects placeholder keys (`sb_publishable_...`); **`getSupabaseEnvIssue()`** shows setup instructions on admin login when URL is set but the key is missing/invalid.
- **`.env.example`:** Removed misleading placeholder publishable key.

## 2026-05-19 — Fix admin sign-in hang + persist session across reload

- **Auth:** `onAuthStateChange` clears session only on **`SIGNED_OUT`** (not every null session event). Login skips slow **`getSession`** retries when **`signInWithPassword`** already returned a user; role check is single-shot on login.
- **Bootstrap:** When **`getSession`** times out but **`anvl.supabase.admin.v1`** has tokens, falls back to **`getUser()`** to restore the session without clearing storage.
- **Tab close:** No **`pagehide`** / tab-close logout — session persists until explicit sidebar logout.

## 2026-05-19 — Admin UX: session persistence, publish-on-save, media upload, button loading

- **Auth:** Bootstrap **`getSession`** waits up to **20s** without clearing **`anvl.supabase.admin.v1`** on timeout; provider watchdog **120s** disposes in-memory client only (session tokens preserved for refresh).
- **Drop editor:** Header **Active** badge reads **`storefront_publication.active_drop_id`** via **`useDropLiveOnStorefront`**. Save publishes when the drop is already live (not only “Activate after saving”). Validation errors switch tab + scroll to **`data-drop-field`** targets.
- **Preview:** Live preview iframe uses fixed max height so acts do not stretch when the builder column is tall.
- **Media:** Visual + OG pickers upload to Supabase **`cms-media`** at **`drops/{slug}/{role}-{timestamp}.{ext}`** when configured.
- **UI:** Shared **`Button`** **`loading`** prop (inline spinner) on login + save modal; media picker uses inline loader during upload/embed.
- **Tests:** **`uploadCmsMedia`**, **`Button`**, **`dropEditorValidationNavigation`**, auth bootstrap + preview layout expectations updated.

## 2026-05-19 — Fix `anvl_drops_single_active` on CMS sync / activate

- **Sync:** Before upserting drops, demote stale **`status = 'active'`** rows in Supabase, then upsert **non-active first, active last** so the partial unique index is never violated.
- **Tests:** **`adminCmsRemoteSyncOrder`**.

## 2026-05-19 — Admin drops: backend live status + save loading

- **Drops list:** When Supabase is configured, **Live/active** badge reads **`storefront_publication.active_drop_id`** (not localStorage). Hydration normalizes **`isActive`** for all drops from that row.
- **Activate / save+activate:** **`cms_publish_drop`** demotes other actives on the server; local storage rehydrates after publish so only one drop stays active.
- **Drop editor save modal:** Shows **Saving…** spinner, awaits **flush + publish**, then closes the modal.
- **Tests:** **`adminCmsDropsList`**.

## 2026-05-19 — Admin + storefront: drop publish path + stale session UX

- **Auth:** Stale-session banner only when **`anvl.supabase.admin.v1`** had tokens before GoTrue timed out (avoids false alarm on cold login).
- **Admin drops:** Save with **Activate after saving** and reset of the active drop call **`cms_publish_drop`**; activate mutation invalidates storefront publication cache.
- **Storefront:** **`useStorefrontActiveDrop`** + **`ActiveDropThemeProvider`** read published drop theme from Supabase; **`useLandingCms`** no longer falls back to admin localStorage when Supabase is configured.
- **Tests:** **`useStorefrontActiveDrop`**, bootstrap/auth storage coverage updated.

## 2026-05-19 — Cleanup: remove unused bootstrap ops + tab-close helper

- **Removed:** **`scripts/bootstrap-cms-admin.mjs`**, **`supabase/scripts/`**, migration **`20260519180000_cms_profiles_bootstrap_fn.sql`**, **`adminTabCloseCleanup`** (unused after explicit logout-only auth). **`.env.example`** trimmed to URL + publishable key only.
- **Docs:** **`supabase-cms.md`**, **`admin-ui.md`**.

## 2026-05-19 — Admin: fix Supabase bootstrap timeout (stale session / hanging getSession)

- **Auth:** **`readBootstrapAdminSession`** — single **`getSession`** with **8s** timeout; clears **`anvl.supabase.admin.v1`** when GoTrue hangs (common after switching anon ↔ publishable keys). Watchdog **20s**; **`detectSessionInUrl: false`** on admin client.
- **Helpers:** **`resetAdminSupabaseBrowserClient`**, **`withTimeout`** on profile reads.
- **Tests:** **`adminSupabaseAuthFlow`**, bootstrap provider tests updated.

## 2026-05-19 — Fix duplicate GoTrue client (remove `shared/lib/supabase.ts`)

- **Removed:** **`src/shared/lib/supabase.ts`** — duplicate `createClient` (tutorial pattern); ANVL uses **`getAdminSupabaseBrowserClient`** + **`getSupabasePublicationAnonClient`** instead.
- **Auth client:** Admin singleton stored on **`globalThis`** so Vite HMR does not warn about multiple **`anvl.supabase.admin.v1`** GoTrue instances.
- **Tests:** **`adminSupabaseBrowserClient.test.ts`**.

## 2026-05-19 — Env: publishable key only (`VITE_SUPABASE_PUBLISHABLE_KEY`)

- **App:** **`getSupabasePublicEnv`** prefers **`VITE_SUPABASE_PUBLISHABLE_KEY`** over legacy **`VITE_SUPABASE_ANON_KEY`**; error copy updated. **`.env.example`** trimmed to URL + publishable key.
- **Tests:** **`supabasePublicEnv.test.ts`**.
- **Docs:** **`supabase-cms.md`**, **`AGENTS.md`**.

## 2026-05-19 — Ops: `pnpm bootstrap:cms-admin` (service role, no SQL CREATE)

- **Script:** **`scripts/bootstrap-cms-admin.mjs`** upserts **`cms_profiles`** via **`SUPABASE_SERVICE_ROLE_KEY`** when Dashboard SQL hits **`permission denied for schema public`** or RLS on direct **`INSERT`**.
- **Package:** **`pnpm bootstrap:cms-admin -- <auth-user-uuid>`**.
- **DB:** Migration grants **`service_role`** DML on **`cms_profiles`**.
- **Docs:** **`supabase-cms.md`**, **`admin-ui.md`**, bootstrap SQL comments.

## 2026-05-19 — Supabase: `bootstrap_cms_profile` RPC (RLS-safe admin row)

- **DB:** Migration **`20260519180000_cms_profiles_bootstrap_fn.sql`** — **`SECURITY DEFINER`** **`bootstrap_cms_profile(uuid, text)`** so first admin row can be created from SQL Editor (direct **`INSERT`** hits RLS **`42501`**).
- **Ops:** **`supabase/scripts/bootstrap-cms-admin-profile.sql`** updated (use **`SELECT bootstrap_cms_profile(...)`**, not Table Editor insert).
- **Docs:** **`supabase-cms.md`**, **`admin-ui.md`**.

## 2026-05-19 — Admin: fix Supabase sign-in after GoTrue session + cms_profiles gate

- **Auth:** New **`adminSupabaseAuthFlow.ts`** — wait for session attach, retry **`cms_profiles`** read, assert admin role, pull CMS in background. Login no longer blocks on full hydration; **`ProtectedAdminRoute`** gates on auth only; **`AdminLayout`** shows sync/error banners.
- **Removed:** **`pagehide`** auto-logout (broke reload and raced bootstrap). Logout is explicit via sidebar only.
- **Errors:** Access-denied copy includes Auth **`user_id`** + sample **`INSERT INTO cms_profiles`** SQL.
- **Ops:** **`supabase/scripts/bootstrap-cms-admin-profile.sql`** for first admin row.
- **Tests:** **`adminSupabaseAuthFlow.test.ts`**; bootstrap test retained.
- **Docs:** **`admin-ui.md`**, **`supabase-cms.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Docs: `.env.example` Supabase publishable vs anon

- **Env:** Clarified that **`VITE_SUPABASE_ANON_KEY`** or **`VITE_SUPABASE_PUBLISHABLE_KEY`** is enough (same resolver as **`getSupabasePublicEnv`**).

## 2026-05-19 — Admin: Supabase bootstrap timeout + tab-close guard

- **Auth:** **`pagehide`** cleanup runs only after **`isHydrated`** (avoids racing bootstrap). Bootstrap timeout sets **`timedOut`** so a slow **`getSession`** cannot overwrite session state after the watchdog fires. Timer handle typing uses **`number`** for **`window.setTimeout`** (Windows/ DOM typings).
- **Tests:** **`AdminAuthProvider.bootstrap.test.tsx`** (hang + no-session paths).
- **Docs:** **`docs/features/admin-ui.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Admin: show/hide password on sign-in

- **UI:** `/admin/login` password field includes an **`IconButton`** visibility toggle (**`Eye` / `EyeOff`**, **`aria-pressed`**).
- **Tests:** `-adminLogin.test.tsx`; **`getSupabasePublicEnv`** mocked in **`-adminSettings.test.tsx`** so reset-modal labels stay deterministic when **`.env`** enables Supabase.
- **Docs:** `docs/features/admin-ui.md`.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Admin: sign out when browser tab closes

- **Auth:** While a CMS session exists under **`AdminAuthProvider`**, a **`pagehide`** listener (skips **`persisted`** BFCache) runs **`runAdminTabCloseSessionCleanup`**: Supabase **`signOut`** + dispose client + **`clearAdminSession`** for legacy keys. Same path runs on full unload/reload (not on in-app TanStack navigation away from `/admin`).
- **Tests:** **`adminTabCloseCleanup.test.ts`**.
- **Docs:** **`docs/features/admin-ui.md`**, **`docs/features/supabase-cms.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Supabase: single publication anon client (GoTrue warning)

- **App:** `publicStorefrontPublication` uses **`getSupabasePublicationAnonClient`** (per-URL singleton + **`auth.storageKey` `anvl.supabase.storefront-public.v1`**) instead of creating a new **`createClient`** on every fetch — removes **“Multiple GoTrueClient instances”** when TanStack Query refocuses alongside other Supabase usage.
- **Tests:** `publicStorefrontPublication.test.ts` (singleton assertion).
- **Docs:** `docs/features/supabase-cms.md`.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Admin: fix stuck loading + top bar display name

- **Auth:** Supabase bootstrap always ends in **`try/finally`** so **`isHydrated` / `isRemoteCmsReady`** run even when **`cancelled`** mid-await (e.g. React Strict Mode) or after early **`return`** from hydration errors — fixes endless “Loading admin…”.
- **Session:** Supabase sessions include **`displayName`** from Auth **`user_metadata`** (`full_name`, `name`, `display_name`, …) or email local-part (**`adminDisplayName.ts`**).
- **UI:** **`AdminTopbar`** shows the signed-in label; **`ProtectedAdminRoute`** loading copy distinguishes sync vs redirect; **Settings** user line uses display name + email.
- **Tests:** **`adminDisplayName.test.ts`**, **`AdminTopbar.test.tsx`**.
- **Docs:** **`docs/features/admin-ui.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Fix admin hydration: `site_seo.staticPages` + clearer CMS role errors

- **CMS:** `storefront_publication.site_seo` blobs with `staticPages` keys set to `null` / `undefined` no longer break `saveSiteSeoContent` / Supabase hydration (Zod 4 enum-key `z.record` required every path). Sanitize via **`sanitizeStaticPagesLoose`** + **`z.unknown().transform(...)`** in **`siteSeo.local.ts`**.
- **Auth:** **`fetchCmsProfileRole`** returns **`{ role, selectError }`**, normalizes **`role`** with trim + lowercase, surfaces PostgREST errors; login uses **`formatCmsAdminAccessDeniedReason`** for targeted copy (RLS vs missing row vs editor/viewer).
- **Tests:** **`siteSeo.local.test.ts`**, **`adminCmsProfileRole.test.ts`**, **`adminCmsPublish.test.ts`** mock shape.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Admin: `cms_profiles` role read after Supabase sign-in

- **Auth:** `fetchCmsProfileRole` accepts an optional Supabase **`user.id`** so login and session restore query **`public.cms_profiles`** immediately (same **`role = admin`** gate); avoids an extra **`getUser()`** when the id is already known.
- **Tests:** `adminCmsProfileRole.test.ts`.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Storefront: Supabase reads with local/seed offline fallback

- **Reads:** `useLandingCms` and `useHomeProducts` prefer published Supabase data when `VITE_SUPABASE_*` is set, then SSR loader data, then the **existing** local/seed storefront (`storefrontReadFallback.ts`). Avoids replacing the live site with seed-only when the backend is down or unpublished.
- **Commerce:** `commerceClient.supabase` falls back to `localStorageCommerceClient` in the browser and `seedCommerceClient` on SSR when publication fetch fails.
- **Runtime:** Supabase CMS slice fallbacks use `getStorefrontOfflineLandingCms` / `getStorefrontOfflineActiveDrop` instead of seed-only on the client.
- **Tests:** `storefrontReadFallback.test.ts`.
- Tests / verify: **`pnpm verify`**.

## 2026-05-19 — Supabase: publish on activate + lock down cms_publish_drop RPC

- **App:** **`publishStorefrontDropByClientId`** flushes debounced CMS sync, resolves **`anvl_drops.id`** by **`client_drop_id`**, then calls **`cms_publish_drop`** when an admin sets the active drop (storefront reads **`published_drop_snapshot`** immediately).
- **DB:** Migration **`20260519120000_revoke_anon_cms_publish_drop.sql`** revokes **`anon`** / **`PUBLIC`** execute on **`cms_publish_drop`** (authenticated admins only).
- **Tests:** **`adminCmsPublish.test.ts`**.
- **Docs:** **`docs/features/supabase-cms.md`** (auth + publish flow).
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Supabase: admin Auth (admin role) + debounced CMS writes

- **DB:** Migration **`20260518220000_anvl_drops_client_id_admin_rls.sql`** — **`anvl_drops.client_drop_id`** (stable app `Drop.id`), idempotent **`storefront_publication`** catalog columns, **admin-only** INSERT/UPDATE/DELETE RLS on **`anvl_drops`**, **`cms_admin_products`**, and **`storefront_publication`** updates; **`cms_publish_drop`** now requires **`cms_profiles.role = admin`** (catalog snapshot refresh preserved).
- **App:** When **`VITE_SUPABASE_*`** is set, **`AdminAuthProvider`** uses Supabase **`signInWithPassword`**, **`hydrateAdminCmsFromSupabase`**, and **`scheduleAdminCmsRemoteSync`** after saves (drops / products / layout / site SEO / global brand). Legacy **`VITE_ANVL_ADMIN_*`** remains when Supabase env is absent. **`ProtectedAdminRoute`** waits for remote hydration; **`/admin/settings`** shows Supabase email and uses a dual-field confirmation for local reset when Supabase is on.
- **Tests:** **`adminCmsProfileRole.test.ts`**.
- **Docs:** **`docs/features/supabase-cms.md`**, **`docs/features/admin-ui.md`**, **`AGENTS.md`**, **`docs/audit-2026-05-17.md`**, **`.env.example`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Supabase: publication catalog snapshot + storefront commerce read path

- **Schema:** Migration **`20260518140000_storefront_publication_catalog.sql`** adds **`products_snapshot`**, **`catalog_drop_index`**, **`global_brand`**, **`campaigns`**, **`lookbook`**, **`legacy_landing_cms`** on **`storefront_publication`**; **`cms_publish_drop`** now aggregates **`cms_admin_products`** into **`products_snapshot`** and rebuilds **`catalog_drop_index`** from **`anvl_drops`** referenced by product **`dropIds`**.
- **App:** **`publicStorefrontPublication`** selects/normalizes the new columns (Zod parity with **`persistedProductSchema`**, catalog index, global brand merge, campaigns/lookbook). **`supabaseCommerceClient`** serves **`CommerceClient`** from the published projection on SSR and CSR when Supabase env is set (**`createRuntimeClients`**). **`supabaseStorefrontReaders`** uses layout for announcement bar and publication rows for campaigns/lookbook when present. Root loader / theme bridge can consume published **`globalBrand`**.
- **Bootstrap:** **`tools/genBootstrapSql.mjs`** / **`tools/oath-bootstrap.sql`** reset and set the new publication columns for idempotent Oath seeds.
- **Docs / DX:** **`.env.example`**, **`storageKeys.ts`** mapping comment, **`docs/features/drops-cms.md`**, **`docs/features/supabase-cms.md`**, **`publicStorefrontPublication.test.ts`** (extended normalization cases).
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Supabase: published storefront CMS + Edge publish stubs

- **Backend / CMS:** Added tracked migration **`supabase/migrations/20260518120000_anvl_cms_core.sql`** (`storefront_publication`, `anvl_drops`, `cms_profiles`, `cms_admin_products`, RLS, **`cms_publish_drop`** RPC). Edge Functions **`publish-storefront`** (forward JWT → RPC) and **`medusa-webhook-stub`** (shared secret placeholder).
- **App:** When **`VITE_SUPABASE_URL`** + anon key are set, **`createRuntimeClients`** overlays Supabase **public read** slices for CMS landing/active drop, **website layout**, and **SEO** via **`publicStorefrontPublication`** (Zod parity with **`persistedDropSchema`** / layout schema). Admin list/mutations still use existing local adapters. **`tsconfig`** excludes **`supabase/functions/**`** from `tsc`.
- **Docs / tests:** **`docs/features/supabase-cms.md`**, **`publicStorefrontPublication.test.ts`**, **`parseSiteSeoUnknown`** helper, **`seedSeoResolutionContext`** export.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: ViewportIframe fills shell height

- **UX:** **`ViewportIframe`** iframe uses **`flex-1 min-h-0 h-full max-w-full w-full`** (no **`62dvh`/`760px`** cap) so it consumes the **`drop-editor-viewport-iframe-shell`** height inside the gradient card; **`justify-start`** stays **top-aligned**. Shell adds **`overflow-hidden`** to reduce double-scrollbar risk.
- Files: **`DropEditorLivePreview.tsx`**, **`__tests__/DropEditorLivePreview.test.tsx`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Storefront: single active-drop resolver + live theme provider

- **Storefront:** Added **`storefrontCmsSync`** so SSR (`SEED_DROP` / `SEED_WEBSITE_LAYOUT`) and browser (`localStorage` CMS) resolve the active drop + layout the same way for composed landing content, seed **`CmsClient` / `SeoClient`**, homepage catalog picks, and related helpers. **`ActiveDropThemeProvider`** now owns the public **`:root`** palette `<style>` (id **`anvl-active-drop-theme`**) and subscribes to drop storage changes so theme/nav/footer stay aligned without relying on root loader re-runs.
- Files: **`src/features/cms/runtime/storefrontCmsSync.ts`**, **`publicLanding.ts`**, **`cmsClient.seed.ts`**, **`cmsClient.localStorage.ts`**, **`seoClient.seed.ts`**, **`products.commerce.ts`**, **`ActiveDropThemeProvider.tsx`**, **`__root.tsx`**, **`DropLoadingIndicator.tsx`**, **`storefrontCmsSync.test.ts`**, **`docs/features/drops-cms.md`**, **`docs/design-system.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: viewport iframe shell top-aligned

- **UX:** **`ViewportIframe`** shell (**`drop-editor-viewport-iframe-shell`**) uses **`justify-start`** so the iframe aligns to the **top** of the preview chrome (no vertical centering gap above).

## 2026-05-18 — Drop editor live preview: capped iframe box + shell letterboxing

- **UX:** After the **`ViewportIframe`** shell fix, **`height:100%`** on the iframe stretched the iframe to the full preview column, so **`svh`-based landing sections reflowed and the hero read “huge” on desktop.** Fix:** Shell stays **`flex-1 min-h-0 self-stretch`** with **`justify-start`**; iframe **`width`** stays Fit **`100%`** or device widths **390 / 820 / 1280**. **`height` / `max-height`** use Tailwind **`h-[min(62dvh,760px)] max-h-[…]`** (avoids jsdom stripping `min()` in React inline styles while matching browser intent); surplus shell letterboxes inside the gradient chrome.
- Files: **`DropEditorLivePreview.tsx`**, **`__tests__/DropEditorLivePreview.test.tsx`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.


- **RCA:** **`ViewportIframe`** rendered the **`<iframe>`** as the **direct flex item** of the preview row (`DropEditorLivePreview`). For replaced elements, **`height: 100%`** often **does not resolve** when the flex item’s used size is still tied to the **intrinsic default iframe height (~150px)** — so the live preview band collapsed while the builder column stayed tall. Separately, the **`layout="wide"`** content wrapper did not participate in a **`flex-1` / `min-h-0`** chain under **`main`**, so the split row could not reliably consume **remaining viewport height** below the top bar.
- **Fix:** Wrap the iframe in a **`flex-1 min-h-0 self-stretch`** shell (**`data-testid="drop-editor-viewport-iframe-shell"`**); iframe keeps **`h-full min-h-0 flex-1`** inside that shell. **`AdminLayout`** (`wide` only): **`main`** + inner **`max-w-[1600px]`** wrapper use **`flex flex-col flex-1 min-h-0`**. **`DropEditorRoute`** split: **`flex-1 min-h-0`** + **`xl:flex-nowrap`**. Dropped redundant **`max-h-full`** / **`h-full`** duplications on the iframe **`className`** in **`DropEditorLivePreview`** (height comes from the shell + inline **`height: 100%`**).
- Files: **`AdminLayout.tsx`**, **`DropEditorRoute.tsx`**, **`DropEditorLivePreview.tsx`**, **`__tests__/DropEditorLivePreview.test.tsx`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: `main` gutter in `min-h`, `xl` split row floor, tighter device shell

- **UX:** **`DROP_EDITOR_PREVIEW_PANE_MIN_H_CLASS`** and new **`DROP_EDITOR_SPLIT_XL_MIN_H_CLASS`** subtract **`--admin-main-block-gutter`** (**`3rem`**, in **`src/styles.css`**) from **`100dvh`** alongside **`--admin-topbar-height`** + safe-area so the preview lane matches “viewport below top bar + **main** breathing room.” On **`xl`**, the **split row** shares that **`min-h`** so a **short** builder stack still yields a tall preview column; **`items-stretch`** + builder **`xl:flex xl:h-full`** keep the **live preview** stack aligned with the **BASICS/THEME** tab row + forms when the rail grows. **`DropEditorLivePreview`** trims **`gap`/`p`** on the device shell; the **Live preview** **`AdminCard`** uses slightly tighter padding (**`!p-4` / `sm:!p-5`**) to reduce dead chrome.
- Files: **`src/styles.css`**, **`dropEditorRoute.shared.ts`**, **`DropEditorRoute.tsx`**, **`DropEditorLivePreview.tsx`**, **`DropEditorRoute.visuals.test.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor `xl` preview column: full stack height + iframe fills shell

- **UX:** Row stretch height applies to the **entire** preview column (**toolbar** + **AdminCard** chrome + body). **`DropEditorLivePreview`** uses **`overflow-hidden`** on the outer shell so scrolling stays **inside the iframe**; the iframe host row drops **`items-start`** so **`height:100%`** no longer leaves a **gray slab** under the device frame. **`AdminCard`** wraps **`children`** in **`min-h-0 flex-1`** so the live preview body participates in the height chain below the header.
- Files: **`DropEditorRoute.tsx`**, **`DropEditorLivePreview.tsx`**, **`AdminCard.tsx`**, **`DropEditorRoute.visuals.test.tsx`**.

## 2026-05-18 — Drop editor live preview: viewport `min-height` + `xl` row stretch

- **UX:** The **Live preview** column uses **`min-h-[calc(100dvh-var(--admin-topbar-height)-env(safe-area-inset-top,0px))]`** so the chrome fills roughly **one viewport below the sticky top bar** at every breakpoint; **`--admin-topbar-height`** (**`6.5rem`**) lives in **`src/styles.css`** as an apron for **`AdminTopbar`** (incl. description slot). On **`xl`**, **`h-full`** + **`self-stretch`** remain so when the **builder** rail is taller than that minimum, the **preview** column **matches the row height** (sash split unchanged; no builder column scroll traps).
- Files: **`src/styles.css`**, **`dropEditorRoute.shared.ts`** (**`DROP_EDITOR_PREVIEW_PANE_MIN_H_CLASS`**), **`DropEditorRoute.tsx`**, **`DropEditorRoute.visuals.test.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor `xl`: stretch preview + builder row, document-scroll forms

- **RCA:** **`xl:items-start`** on the split row matched preview height to short **Basics** content but left the **live preview** column visually shorter than the **builder** column when the form grew; nested **`min-h-0` / flex scroll chains** on the builder rail also encouraged **column-internal** scrolling instead of **`AdminLayout` `main`**.
- **Fix:** Restore **`xl:items-stretch`** on the **`xl`** split flex row; keep preview column **`min-h-0`** + **`xl:h-full`** **`AdminCard`** so **`DropEditorLivePreview`** still scrolls inside the preview chrome. Builder rail uses **`xl:overflow-visible`** and drops **`xl:min-h-0`**; tab **`AdminCard`**s (and **`DropActsBuilderPanel`**) pass **`h-auto min-h-0`** so cards **hug tab content** without a giant empty **Basics** plate.
- Files: **`DropEditorRoute.tsx`**, **`DropActsBuilderPanel.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: re-bootstrap on new iframe `Document`

- **RCA:** `readystatechange` was attached **once** (`if detachReadystate return`), so when `iframe` fired **`load`** again and the browser handed us a **fresh** `contentDocument`, the listener stayed on the **old**, detached `Document`. Meanwhile `bootstrappedRef` short-circuited **`bootstrap()`**, so we never recloned styles or re-pointed **`createPortal`** at the new **`body`** → **blank white frame** after reloads/hidden-preview/show cycles/engines that recreate the srcdoc document.
- **Fix:** Track **`wiredPreviewDocRef`** (`Document` identity): if `contentDocument` differs, run full bootstrap again; **rebind** `readystatechange` whenever the active iframe document changes; **try/finally** + **`bootstrapInFlight`** guard against re-entrant double head clears.
- **Tests:** `DropEditorLivePreview` asserts **`body`** contains **`[data-anvl-drop-preview-scope]`** before/after viewport toggle; second **`load`** after **`contentDocument` swap** must repopulate **`style[data-anvl-preview-reset]`** and the scope marker. **`minimalProps`** aligns with the route via **`editorPreviewHeroFallback: true`**.
- Files: **`DropEditorLivePreview.tsx`**, **`__tests__/DropEditorLivePreview.test.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Admin shell: trim main bottom padding (desktop)

- **RCA:** **`AdminLayout`** **`main`** used **`pb-28` / `lg:pb-32`**, which exaggerated the empty strip below page content on desktop. **Toasts** are already lifted via global **`sonner`** **`Toaster`** (`offset`, **`mobileOffset`**).
- **Fix:** **`pb-8`** / **`lg:pb-8`** alongside existing horizontal + top padding. **Regression:** mobile nav **`Drawer`** unchanged; long drop/product pages still scroll inside **`main`** as before.
- **Verify hardening:** Vitest **`testTimeout: 15s`** so parallel admin UI suites don’t flake at the default 5s; **`DropEditorRoute.products.test.tsx`** / **`newDropRoute.test.tsx`** avoid untyped **`jest-dom`** matchers under strict **`tsc`**.
- Files: **`AdminLayout.tsx`**, **`__tests__/AdminLayout.test.tsx`**, **`vitest.config.ts`**, **`DropEditorRoute.products.test.tsx`**, **`newDropRoute.test.tsx`**, **`docs/features/admin-ui.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Admin: `/admin/drops/new` without “Missing drop” flicker

- Summary: **`createDraftDrop`** could run while **`useDropsList`** had no active subscriber, leaving the hook’s snapshot stale so **`DropEditorRoute`** briefly rendered **Missing drop**. **Fix:** bump a persist generation at the start of **`persistDropsState`** so **`ensureSnapshots`** always refreshes after writes. **Bootstrap UX:** **`AdminSpinner`** + verified id before **`replace`** navigation; storage verify failure surfaces an alert + back link.
- Files changed: **`drops.persistGeneration.ts`**, **`drops.service.ts`**, **`useDrops.ts`**, **`-newDrop.tsx`**, **`useDropsList.cache.test.ts`**, **`-newDropRoute.test.tsx`**, **`src/test/setup.ts`** ( **`@testing-library/jest-dom`** ), **`vitest.config.ts`** ( **`maxWorkers` cap** ), **`docs/features/drops-cms.md`**, **`docs/changelog.md`**. Stabilized **`DropEditorRoute`** header + products RTL tests ( **`waitFor`** / duplicate **Active** pill assertions ).
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor `xl`: resizable live preview / builder split

- Summary: At **`xl`**, the drop editor uses a **sash** between **Live preview** and the form column: **pointer capture** drag, clamp **320px–70%** of the split container width, optional persist to **`ANVL_DROP_EDITOR_PREVIEW_SPLIT_PX`**, **←/→** nudge when the sash is focused. **`overflow-x-hidden`**, **`min-w-0`**, and **`overscroll-x-contain`** avoid horizontal page scroll while dragging; **no width transition** (respects reduced-motion expectations). **`clampDropEditorPreviewWidthPx`** unit-tested.
- Files changed: **`DropEditorRoute.tsx`**, **`useDropEditorXlPreviewSplit.ts`**, **`dropEditorPreviewSash.ts`**, **`dropEditorPreviewSash.test.ts`**, **`storageKeys.ts`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**. Manual: drag sash at **`xl`**, reload confirms width; narrow window clamps. **Vitest** default timeout raised to **15s** (parallel Windows runs); **`@testing-library/jest-dom/vitest`** in setup + **`vite-env`** reference fixes **`tsc`** on DOM matchers.

## 2026-05-18 — Drop editor Products tab: responsive roster cards

- Summary: Product roster under **Products** replaced viewport **`sm:grid-cols-2`** (which forced two cramped columns inside the **`xl`** ~**460px** rail) with **container-query** columns and per-card **stack → row** breakpoints; thumbnails use a controlled **5:4 / square** aspect, **`min-w-0`** + **`line-clamp-2`** on titles, refined status / **Active** · **Hidden** pills, lazy images, and RTL-safe toolbar spacing (**`me-1.5`**). **Tests:** **`DropEditorRoute.products.test.tsx`** (roster smoke + RTL checkbox).
- Files changed: **`DropEditorRoute.tsx`**, **`DropEditorRoute.products.test.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Admin sidebar: `100dvh` + sticky rail (lg+)

- Summary: **`AdminSidebar`** (default density) uses **`lg:self-start lg:sticky lg:top-0`** with **`h` / `min-h` / `max-h` `100dvh`** so the left column tracks the dynamic viewport instead of stretching with a tall document row; **`AdminLayout`** shell/grid/main use **`min-h-[100dvh]`**. **`src/test/setup.ts`** imports **`@testing-library/jest-dom/vitest`** ( **`@testing-library/jest-dom`** devDep) so matcher typings match usage across tests. **`AdminSidebar.test.tsx`** covers logout + drawer **`onNavigate`**; **`AdminLayout.test.tsx`** **`useRouterState`** mock supports **`select`**.
- Files changed: **`AdminSidebar.tsx`**, **`AdminLayout.tsx`**, **`src/test/setup.ts`**, **`package.json`**, **`pnpm-lock.yaml`**, **`AdminSidebar.test.tsx`**, **`AdminLayout.test.tsx`**, **`docs/features/admin-ui.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**. **Manual (Chrome, ≥lg):** open a long admin page (e.g. drop editor); sidebar height stays one viewport; scroll **`main`** — rail stays pinned; border/footer do not extend with page height.

## 2026-05-18 — Drop editor xl split: form cards hug content

- Summary: On **`xl`**, the editor grid used **`items-stretch`**, so the form column matched the tall preview row and **`AdminCard`**’s default **`h-full`** left empty space below short tabs (e.g. **Basics**). **Fix:** **`xl:items-start`** on the grid and **`xl:self-stretch xl:h-full xl:min-h-0`** on the preview column so only the live-preview pane fills the row; form **`AdminCard`**s height follows tab content. **&lt;xl** layout unchanged.
- Files changed: **`DropEditorRoute.tsx`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**. Manual: at **`xl`**, **Basics** card ends after fields; preview column still fills.

## 2026-05-18 — Drop editor live preview: iframe `contentDocument` / `readystatechange` bootstrap

- Summary: **RCA (still-blank iframe):** `ViewportIframe` could strand React portal wiring when `iframe.contentDocument` was **temporarily null**, or when `readyState` stayed **`loading`** until a later **`readystatechange`** after microtask/`rAF` retries (so **`load`** and one-shot probes were not enough). **Fix:** **`requestAnimationFrame`** poll (bounded) until `contentDocument` exists, plus a **`readystatechange`** listener on the iframe document to re-run bootstrap, keeping **`scheduleRetries`** as extra coverage. **Tests:** **`DropEditorLivePreview`** asserts **`[data-anvl-drop-preview-scope]`** appears under the iframe **`body`**; iframe helper tests cover marker toggles under **`loading`**.
- Files changed: **`DropEditorLivePreview.tsx`**, **`__tests__/DropEditorLivePreview.test.tsx`**, **`__tests__/dropEditorLivePreviewIframe.test.ts`**, **`ColorField.test.tsx`** (assertions aligned with compact row DOM), **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — ColorField compact: input-height row (quick create modal)

- Summary: **`density="compact"`** is a fixed **`h-10 max-h-10`** bordered control (inset swatch chip + mono hex, **`rounded-md`**) so grid **`items-stretch`** no longer grows a full-bleed swatch tile; **Quick create** modal grid adds **`sm:items-end`** plus **`flex flex-col gap-1`** stacks and **`AdminInput mt-0`** for aligned label/control pairs.
- Files changed: **`ColorField.tsx`**, **`ColorField.test.tsx`**, **`DropEditorRoute.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor: iframe preview bootstrap, Oath hero fallback, palette presets

- Summary: **RCA (blank preview):** some `srcDoc` iframes stayed on `readyState === "loading"` after `head`/`body` existed, so `isDropEditorPreviewIframeDocumentReady` never bootstrapped the portal (white iframe). **Fix:** treat `loading` as ready when the stub’s `data-anvl-drop-editor-live-preview` is on `<html>`; **unmount** clears `body` portal state. **Empty / all-disabled acts:** `composeLandingPageFromDrop(..., { editorActsPreview: true, editorPreviewHeroFallback: true })` uses `publicLandingActsHeroSlotOnly()` (canonical hero slot + Oath preset wiring; copy from composed `landing.hero`). **Theme:** **Save as preset** persists Zod-validated rows to **`ANVL_DROP_THEME_PALETTE_PRESETS`**; preset select merges built-ins + `user-…` rows. **Quick create product** uses **`DebouncedColorField`** for swatch + popover hex UX.
- Files changed: `dropEditorLivePreviewIframe.ts`, `DropEditorLivePreview.tsx`, `composeLandingPageFromDrop.ts`, `landingActs.normalize.ts`, `DropEditorRoute.tsx`, `DropThemePaletteCard.tsx`, `dropThemePalettePresets.*`, `drops.persistence.zod.ts` (export palette schema), `storageKeys.ts`, tests, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — `ColorField` swatch tile, popover editor, hex copy

- Summary: **Default** `ColorField` is **swatch-first** (~7–7.5rem min height): checkerboard under semi-transparent fills, forge-style rim, mono **hex** copy (**`toast.success`**), **`SlidersHorizontal` `IconButton`** opens a **non-modal** Radix popover (`modal={false}`, no inner scroll, `w-[min(22rem,92vw)]`) containing **`ColorFieldPopoverForm`** (native wheel + HEX / RGB / α). **`rgbaToClipboardHex`** in **`color.ts`** emits **`#RRGGBB`** / **`#RRGGBBAA`**. **`inline`** keeps compact always-visible controls. **`DebouncedColorField`** behavior unchanged (**`startTransition` + debounce**).
- Files changed: **`src/shared/lib/color.ts`**, **`src/shared/components/ui/ColorField.tsx`**, **`src/shared/components/ui/__tests__/ColorField.test.tsx`**, **`docs/design-system.md`**, **`docs/changelog.md`**.
- Tests / verify: **`pnpm verify`**.

## 2026-05-18 — Drop editor preview: act copy overlay + xl height / Fit iframe

- Summary: **Live preview** now merges **`draft.acts`** row fields (eyebrow/title/subtitle/body + **`content` CTAs**) over composed landing slices in **`PublicLandingActs`**, so Acts builder edits re-render immediately. **`ViewportIframe`** supports **`fill`** (**Fit** = `width: 100%` / `max-width: 100%`); **Fit** always uses the iframe+portal path (breakpoints still match the iframe width). **`DropEditorRoute`** **`xl`** grid uses **`items-stretch`** / **`min-h-0`**, preview **`AdminCard`** drops **`sticky`** so column height tracks the builder; preview scroll stays inside **`overflow-y-auto`**. **`DropActsBuilderPanel`** **`onChange`** uses functional **`setDraft`** to avoid stale merges.
- Files changed: **`landingActPreviewOverlay.ts`**, **`PublicLandingActs.tsx`**, **`DropEditorLivePreview.tsx`**, **`DropEditorRoute.tsx`**, tests, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: remove viewport status caption

Removed the trailing **`fits preview pane`** / simulated-width caption from **`DropEditorLivePreview`** viewport toolbar (**`pnpm verify`**).

## 2026-05-18 — Drop editor Visuals: reliable media fallbacks + AdminSpinner

- Summary: **`MediaPickerField`** adds **`onError`** recovery for raster previews, **`fallback="wordmark"`** (inline **`AnvlWordmark`**), and **`AdminSpinner`** for file-embed loading (`prefers-reduced-motion` safe). **Visuals** tab uses **Basics/Theme-style** subsection shells (**emblem → wordmark → hero**, then **Additional lockups**), hero previews use **`fallback="none"`**, wordmark chains **logo → emblem → global emblem fallback**. New **`AdminSpinner`** in shared UI.
- Files changed: **`MediaPickerField.tsx`**, **`AdminSpinner.tsx`**, **`index.ts`**, **`AnvlCrest.tsx`**, **`AnvlWordmark.tsx`**, **`DropEditorRoute.tsx`**, **`MediaPickerField.test.tsx`**, **`DropEditorRoute.visuals.test.tsx`**, **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — MediaPickerField: hoist trimmed (toast TDZ) + test repair

- Summary: Move **`trimmed`** / SEC-20 preview flags before file handlers so synchronous **`toast`** cannot trigger **`ReferenceError`** from the **`trimmed`** temporal dead zone. Restore **`onError`** preview test (**`fireEvent.error`**) and use **`queryByRole`** assertions instead of untyped **`toBeInTheDocument`**.
- Files changed: **`MediaPickerField.tsx`**, **`MediaPickerField.test.tsx`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Acts builder: icon reorder/remove toolbar (44px targets)

- Summary: **`DropActsBuilderPanel`** act rows replace **Up / Down / Remove** text buttons with **`IconButton`** + **lucide** (**`ChevronUp`**, **`ChevronDown`**, **`Trash2`**), **`aria-label`** move/remove copy (optional position when multiple acts), disabled **up**/**down** at ends, destructive styling on remove, compact bordered **`inline-flex`** group.
- Files changed: **`DropActsBuilderPanel.tsx`**, **`DropActsBuilderPanel.test.tsx`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin date fields: trigger height matches AdminInput

- Summary: **`AdminDateTimeField`** / **`AdminDateField`** popover triggers drop **`min-h-[44px]`** so height follows shared **`adminFieldControlClass`** (**`py-2`**, **`text-sm`**, **`focus-ring`**, same border as **`AdminInput`**). **`AdminDateField`** adds **`mt-1`** + **`self-center`** on icons for parity; clear side buttons rely on row **`items-stretch`** instead of a fixed **44px** min-height.
- Files changed: **`AdminDateTimeField.tsx`**, **`AdminDateField.tsx`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin forge date pickers: oath accent selection + taller popover shell

- Summary: **`adminCalendarSkin`** replaces the library default **blue** selection/`--rdp-accent-*` with **`--color-accent`** + **bone-tinted** border/fill (**`color-mix`**) and **`focus-visible`** rings on **`rdp-day_button`**; tightens **rdp** cell/nav sizing. **`AdminPopoverContent`** shell uses **`max-h-[min(520px,var(--radix-popover-content-available-height))]`**, **`flex flex-col`**, and a **single** **`overflow-y-auto`** (removed the old **`!overflow-hidden`** fight). **`AdminDateTimeField`** / **`AdminDateField`** drop duplicate max-height/padding overrides; datetime time block **`pt-2`**/**`gap-2.5`**.
- Files changed: **`adminCalendarSkin.ts`**, **`AdminPopover.tsx`**, **`AdminDateTimeField.tsx`**, **`AdminDateField.tsx`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Acts builder: Radix AdminSelect for nature / preset / fields

- Summary: **`DropActsBuilderPanel`** replaces native **`<select>`** (nature, preset, animation intensity, product showcase card style, lookbook layout) with **`AdminSelect`** (Radix), **`aria-labelledby`** + trigger **`id`** parity with Basics Status, and **`data-testid="drop-acts-builder-panel"`** on the Acts **`AdminCard`** for tests. Optional card style / lookbook layout use a **`__inherit__`** sentinel item for “schema default” (maps to **`undefined`** in content).
- Files changed: **`DropActsBuilderPanel.tsx`**, **`AdminCard.tsx`**, **`DropActsBuilderPanel.test.tsx`**, **`docs/features/acts-builder.md`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor Visuals tab + MediaPickerField chrome alignment

- Summary: **Visuals** **AdminCard** uses **`testId="drop-editor-visuals"`**; **Emblem alt** uses the **Basics-style** label + **`aria-labelledby`** pattern. **`MediaPickerField`** **Hide crest preview** uses **`adminCheckboxControlClass`**; the **URL** row uses **`adminFieldControlClass`** from **`src/shared/lib/cmsFieldStyles.ts`** (also sourced by **`AdminInput`**, **`AdminCheckbox`**, **`dropEditorRoute.shared`**). **`DropEditorRoute.visuals.test.tsx`** smoke: open **Visuals** tab, **`querySelector('select')`** is null inside the card, **Emblem alt** textbox present.
- Files changed: **`cmsFieldStyles.ts`**, **`dropEditorRoute.shared.ts`**, **`AdminInput.tsx`**, **`AdminCheckbox.tsx`**, **`MediaPickerField.tsx`**, **`DropEditorRoute.tsx`**, **`MediaPickerField.test.tsx`**, **`DropEditorRoute.visuals.test.tsx`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor theme: AdminSelect preset + admin chrome on color HEX/RGB inputs

- Summary: **`DropThemePaletteCard`** preset uses **`AdminSelect`** (Radix combobox) instead of a native **`<select>`**. **`DebouncedColorField`** passes shared **`adminFieldControlClass`** into **`ColorField`** via new **`fineInputControlClass`** so HEX / numeric channel inputs match **`AdminInput`** styling while **`startTransition`** debounced commits are unchanged.
- Files changed: **`DropThemePaletteCard.tsx`**, **`DebouncedColorField.tsx`**, **`ColorField.tsx`**, **`DropThemePaletteCard.test.tsx`**, **`ColorField.test.tsx`**, **`DropActsBuilderPanel.tsx`** (remove unsupported Radix **`modal`** prop), **`DropActsBuilderPanel.test.tsx`** (explicit **`disabled`** assertions), **`DropEditorRoute.visuals.test.tsx`** (scoped **`querySelector`**), **`AdminDateTimeField.test.tsx`** (longer timeout for jsdom), **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor: legacy Act I–VI panel removed; acts merge + builder bootstrap

- Summary: Deleted **`DropLandingActsEditor`** (legacy **`<details>`** block editing **`Drop.landingContent`** Act I–VI). The **Acts** tab now loads **`DropActsBuilderPanel`** with **`React.lazy`** + **`Suspense`** from **`DropEditorRoute`**. **`resolveActsForMergedDrop`** / **`mergeDropPartial`** preserve persisted **`acts: []`** instead of re-deriving acts from merged landing; partial rows **without** an **`acts`** key still seed via **`landingContentToSimpleActs`** for migration. **`DropActsBuilderPanel`** no longer auto-imports landing JSON on mount when acts are empty — operators use **Reset acts from landing copy** explicitly. **`Drop.landingContent`** remains stored and used by default homepage compose (non-preview paths) and section payloads; **`composeLandingPageFromDrop(..., { editorActsPreview: true })`** continues to build **`landingActs`** only from **`Drop.acts`**.
- Files changed: **`DropEditorRoute.tsx`**, **`DropActsBuilderPanel.tsx`**, **`drops.service.ts`**, removed **`DropLandingActsEditor.tsx`**, **`resolveActsForMergedDrop.test.ts`**, **`docs/features/drops-cms.md`**, **`docs/features/acts-builder.md`**, **`docs/features/admin-ui.md`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor live preview: reliable `ViewportIframe` bootstrap

- Summary: **`ViewportIframe`** retries **`srcDoc`** mounting (**`interactive`** or **`complete`**, **`queueMicrotask`**, double **`requestAnimationFrame`**, synchronous probe, **`load`** listener **+ React `onLoad`**) so **`setBody`** / portal wiring is not stranded when navigation completes before **`useLayoutEffect`**. Stub HTML lives in **`dropEditorLivePreviewIframe.ts`** with **`data-anvl-drop-editor-live-preview`** on **`<html>`** for regressions/tests.
- Files changed: **`DropEditorLivePreview.tsx`**, **`dropEditorLivePreviewIframe.ts`**, **`__tests__/dropEditorLivePreviewIframe.test.ts`**, **`DropEditorLivePreview.test.tsx`**, **`AdminDateTimeField.test.tsx`** (hour option **17** avoids duplicate **MM** vs **HH** labels in open Radix lists), **`docs/features/drops-cms.md`**, **`docs/changelog.md`**.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin `AdminDateTimeField` popover polish (calendar + time row)

- Summary: **Forge date+time picker** uses **`navLayout="around"`** with **`IconButton`** month nav, restored **`rdp-*` skin classes** so react-day-picker positioning works, **`MMM yyyy`** caption, **accent ring** selection + **today** outline, **months** area owns **vertical scroll** on short viewports while the **popover shell** stays **`overflow-hidden`** (no redundant axes). **Hour / minute** use **`AdminSelect`** in one row; **Today** shortcut in the calendar footer; helper copy tightened.
- Files changed: `AdminDateTimeField.tsx`, `AdminDateField.tsx`, `adminCalendarSkin.ts`, `adminDayPickerChrome.tsx`, `AdminDateTimeField.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin forge calendar pickers (`react-day-picker` + Radix popover)

- Summary: **`AdminDateTimeField`** / **`AdminDateField`** replace native **`<input type="datetime-local>`** / **`<input type="date>`** on drop editors, schedules, product editor pricing windows, and product index Updated filters (`src/features/admin/lib/adminDateTime.ts` explains UTC ISO persistence + legacy `datetime-local` semantics). Dependencies: **`react-day-picker` v9**, **`@radix-ui/react-popover`**.
- Files changed: `src/features/admin/components/AdminDateTimeField.tsx`, `AdminDateField.tsx`, `AdminPopover.tsx`, `adminCalendarSkin.ts`, `adminDateTime.ts`, `DropEditorRoute.tsx`, `DropsAdminList.tsx`, `ProductEditorRoute.tsx`, `-adminProductsIndex.tsx`, shared route helpers, Vitest specs, `package.json`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin/storefront: drop card shell hover translate

- Summary: **`AdminCard`** loses **`motion-safe:hover:-translate-y`** and **`transform`** transitions — hover stays **border + inset/ambient shadow** only ( **`motion-reduce`** still kills transitions ). Global CSS **removed** the **`.group/card`** override that zeroed CTA **`translateY`** now that the plate no longer lifts, so **`DashboardCardCtaLink`** and peers regain the usual **micro-lift**. **Pieces grid** product links drop **`hover:-translate-y`** / **`will-change-transform`** for a subtle **border** transition instead. **`anvl-global-interactive-styles`** contract test updated.
- Files changed: `AdminCard.tsx`, `PiecesGrid.tsx`, `src/styles.css`, `src/test/anvl-global-interactive-styles.test.ts`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests: **`pnpm verify`**.

## 2026-05-18 — Global scrollbars + admin mobile drawer from left

- Summary: Site-wide **thin scrollbars** use **`scrollbar-color`** (Firefox) plus **`::-webkit-scrollbar-*`** (Chromium/Safari), themed from **`--color-*`** (`--anvl-scrollbar-thumb` / hover / track). **`color-scheme`** follows **`data-theme="bone-light"`** vs dark defaults. **`Drawer`** adds **`placement="left"`**; **`AdminLayout`** mobile nav uses it with **`overflow-hidden`** shell + **`AdminSidebar`** **`density="drawer"`** (no inner nav scroll, tighter spacing, truncated labels, descriptions omitted). **`pnpm verify`** passes.
- Files changed: `src/styles.css`, `Drawer.tsx`, `AdminLayout.tsx`, `AdminSidebar.tsx`, `Drawer.test.tsx`, `docs/design-system.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**. **Manual QA:** Firefox + Chromium/Edge — viewport scrollbar readable (thumb visible on Windows); **`/admin`** &lt; `lg`: menu opens from **left**, backdrop dismisses; sidebar clusters fit **`100dvh`** without an interior scroll strip (short viewport may clip — acceptable); storefront **`Drawer`** still slides from **right**. **PR screenshots:** narrow **`/admin`** with drawer open (left rail); optional storefront **`Drawer`** unchanged.

## 2026-05-18 — Drop editor: Basics status AdminSelect

- Summary: **Basics** tab **Status** uses **`AdminSelect`** (Radix) instead of a native **`<select>`**, with labelled trigger (**`id`** + **`aria-labelledby`**) matching other admin fields.
- Files changed: `DropEditorRoute.tsx`, `DropEditorRoute.header.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor: live preview collapse in preview chrome

- Summary: Below **`xl`**, **Hide / Show live preview** **`IconButton`** (**`EyeOff`** / **`Eye`**) sits in **`AdminCard` `actions`** on the same row as **Live preview** (**`aria-label`**, **`title`**, **`aria-expanded`**); **`DropEditorLivePreview`** only applies **`max-xl:hidden`** to the viewport toolbar + scrollable iframe shell when collapsed (no overlay on the preview frame).
- Files changed: `DropEditorRoute.tsx`, `DropEditorLivePreview.tsx`, `DropEditorLivePreview.test.tsx`, `DropEditorRoute.header.test.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Drop editor: activate-after-save in save modal only

- Summary: **Activate this drop after saving** moved from the editor body into the **Commit changes to storage?** modal (same label/description; summary copy + `saveDrop(..., { makeActive })` unchanged). Vitest covers modal-only checkbox + `makeActive` + re-open pre-check.
- Files changed: `DropEditorRoute.tsx`, `DropEditorRoute.header.test.tsx`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-18 — Admin: global page actions + drop editor top bar icons

- Summary: **`AdminPageActionsProvider`** wraps the **`/admin`** **`Outlet`** so routes register **`ReactNode`** toolbar slots via **`useAdminPageActions()`** (cleanup on unmount). **`AdminTopbar`** renders the slot (**`data-testid="admin-page-actions"`**); **`View storefront`** + **Logout** moved to **`AdminSidebar`** footer (**≥44×44** targets). **`DropEditorRoute`** drops **`AdminSectionHeader`** — **Reset** / **Delete** / **Save** are **`IconButton`** controls with themed **`Modal`** confirms (**Commit changes to storage?**, **Discard unsaved changes?**, destructive delete). Vitest: **`AdminPageActionsContext`**, updated **`DropEditorRoute`** toolbar tests (`DropEditorRoute.header.test.tsx`).
- Files changed: `src/routes/admin/route.tsx`, `AdminPageActionsContext.tsx`, `AdminTopbar.tsx`, `AdminSidebar.tsx`, `DropEditorRoute.tsx`, tests under `src/features/admin/**/__tests__/`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**. **Manual:** `/admin/drops/:id` — icons in top bar, modals fire; sidebar footer opens storefront + logs out; **`/admin`** dashboard — top actions region empty, sidebar footer unchanged behavior.

## 2026-05-18 — Drop editor: quick-create catalog modal + preview viewport stability

- Summary: **`AdminSelect`** (`@radix-ui/react-select`) matches **`AdminDropdownMenu`** forge styling. **Quick create product** uses **`MediaPickerField`** (native picker + drag-drop + optional URL), exposes pragmatic **`AdminProduct`** fields (slug, category, descriptions, tags, PDP detail lines, color + comma-separated sizes, visibility toggles, listing origin), **SKU prefix**, and **Quantity** (UI label — persists as **`stockQuantity`** on each variant via **`buildQuickCreateAdminProduct`** + **`rebuildAvailabilityMatrix`**). **Link this drop** controls **`dropIds`** / roster append. **`DropEditorLivePreview`**: iframe viewport glitch fixed (no breakpoint **`key`** remount; drop **`height`** from CSS transition; stable fixed viewport shell + **width-only** animation); preview shell uses **bounded height** with **sticky viewport toolbar** and **scrollable** chrome/iframe region.
- Files changed: `src/features/admin/components/AdminSelect.tsx`, `src/features/admin/drops/quickCreateAdminProduct.ts`, `DropEditorRoute.tsx`, `DropEditorLivePreview.tsx`, `src/test/setup.ts`, `src/features/admin/components/__tests__/AdminSelect.test.tsx`, `src/features/admin/drops/__tests__/quickCreateAdminProduct.test.ts`, `products.persistence.zod.test.ts`, `package.json`, `docs/features/drops-cms.md`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (220 tests). **Manual:** toggle Mobile → Tablet → Desktop — preview height stays stable; quick-create modal scrolls; Radix selects open + persist value.

## 2026-05-18 — Drop editor: P5–P8 follow-through (theme card, products modal, SEO shells)

- Summary: **P5** — `DropThemePaletteCard` unifies preset header, live swatch strip, and per-token `DebouncedColorField` grid; **Revert palette** compares against last saved drop snapshot; **Copy JSON** exports `Drop.theme`; persistence remains **`saveDrop`** (palette-only persistence API still absent). **P2** — Debounced commits (~72ms) replace per-frame draft updates for theme sliders. **P6** — `MediaPickerField` adds **`fallbackPreviewSrc`** (safe relative/https/data-image chain before crest) plus an **embedding spinner** while FileReader runs (`motion-reduce` simplifies animation). **P7** — Products tab uses thumbnail cards + **`AdminCheckbox`** roster, reorder arrows, and a **Quick create product** modal (`uniqueProductSlug`, `upsertAdminProduct`, `persistProductDropLinks`). **P8** — SEO tab splits **Core metadata** vs **Open Graph** inset sections with **`AdminInput`/`AdminTextarea`**. **P4** — `DropActsBuilderPanel` + legacy **`DropLandingActsEditor`** advanced blocks adopt shared admin controls. **`adminProductPrimaryPreviewImage`** powers listing thumbnails; **`AdminLayout`** increases bottom padding (`pb-28`, `lg:pb-32`).
- Files changed: `DropEditorRoute.tsx`, `DropThemePaletteCard.tsx`, `DebouncedColorField.tsx`, `DropActsBuilderPanel.tsx`, `DropLandingActsEditor.tsx`, `MediaPickerField.tsx`, `AdminLayout.tsx`, `products.slug.ts`, `products.mapper.ts`, new/updated Vitest files (`DebouncedColorField`, `DropThemePaletteCard`, `products.slug`, `products.mapper.preview`, `MediaPickerField`), `docs/features/admin-ui.md`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (212 tests).

### Phased checklist (this batch)

| Phase | Status | Notes |
|-------|--------|--------|
| P2 Color perf | Done | `DebouncedColorField` + `startTransition` on flush |
| P4 Admin inputs | Done | Acts builder, legacy landing advanced, visuals/SEO/products |
| P5 Theme cards / palette UX | Done | Unified card; revert + JSON export |
| P6 Visuals fallbacks/spinner | Done | `fallbackPreviewSrc`; embed spinner |
| P7 Products cards + modal | Done | Quick create stays on page |
| P8 SEO hierarchy | Done | Core vs OG panels |

- Notes/debt: **Named palette preset persistence** (user-stored presets beyond Copy JSON / shipped `DROP_THEME_PRESETS`) not implemented. **Quick-create** intentionally seeds a minimal `AdminProduct` — full variant matrix / PDP SEO still require **`ProductEditorRoute`**. **`leaveEmpty` visuals** remain editor-only until storefront honors persisted empties (prior debt). **Zero persisted acts** flag unchanged.

## 2026-05-18 — Drop editor: acts-only preview, layout/iframe QA, admin inputs

- Summary: **P0** — `composeLandingPageFromDrop(..., { editorActsPreview: true })` drives the CMS preview strictly from `Drop.acts` (no `landingActSequence` fallback). `PublicLandingActs` shows an explicit empty state when `cmsPreview` + zero acts. Default Oath / `createEmptyDrop` seed `acts` via `landingContentToSimpleActs`; `mergeDropPartial` bootstraps acts from merged landing when storage has an empty `acts` array (cannot persist a truly empty act list until a flag lands — see debt). **Viewport iframe** uses `useLayoutEffect`, explicit `minHeight`, and `min-h-[280px]`; preview wrapper uses `min-h-0` flex discipline. **P1** — Editor grid is **two-column from `xl` only**; **Hide/Show live preview** below `xl`. **P2 (partial)** — Theme `ColorField` updates wrapped in `startTransition`. **P3** — Slug field help text. **P4 (partial)** — `AdminInput` / `AdminTextarea` / `AdminCheckbox` (+ shared `adminFieldControlClass`) on Basics + Theme. **Layout** — `AdminLayout` main adds bottom padding for toasts/safe scroll.
- Files changed: `composeLandingPageFromDrop.ts`, `PublicLandingActs.tsx`, `DropEditorRoute.tsx`, `DropEditorLivePreview.tsx`, `drops.defaults.ts`, `drops.service.ts`, `dropEditorRoute.shared.ts`, `AdminLayout.tsx`, `AdminInput.tsx`, `AdminCheckbox.tsx`, `src/features/cms/landing/__tests__/composeLandingPageFromDrop.test.ts`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (205 tests).
- **Manual QA matrix (tablet/mobile editor):** (1) `/admin/drops/$id` below 1280px: single column, forms full width. (2) “Hide live preview” hides preview card; “Show” restores. (3) At `xl+`: two columns, preview sticky. (4) Preview pills: Fit vs Mobile/Tablet/Desktop — iframe modes show the same act stack as Fit (GSAP reset CSS). (5) Acts tab reorder/disable — preview updates without relying on slot toggles alone. (6) Slug help reads clearly on narrow widths.

### Phased checklist (this batch)

| Phase | Status | Notes |
|-------|--------|--------|
| P0 Preview + iframe + overlap | Done | Acts-only compose; iframe init/layout; admin main `pb-*` |
| P1 Responsive split | Done | `xl` breakpoint; collapsible preview `< xl` |
| P2 Color perf | Partial | `startTransition` on theme colors; debounce revisit if still janky |
| P3 Slug copy | Done | |
| P4 Admin inputs | Partial | Basics + Theme only |
| P5 Theme cards / palette persist | Deferred | |
| P6 Visuals fallbacks/spinner | Deferred | |
| P7 Products cards + modal create | Deferred | |
| P8 SEO hierarchy | Deferred | |

- Notes/debt: **Empty `acts`** now round-trip on merge without landing re-seed (see newer changelog entry); storefront compose without **`editorActsPreview`** still falls back to **`landingActSequence`** when acts are empty. **ColorField** debounce was reverted (controlled slider sync); prefer `startTransition` + future `memo`d subtree. P5–P8 unchanged in this slice.

## 2026-05-18 — Admin drop editor: streamlined section header toolbar

- Summary: **`DropEditorRoute`** **`AdminSectionHeader`** no longer shows the preview explainer paragraph or the external **Live route** link. The strip keeps **Drop editor** + **title** ( **`Untitled`** when the internal name is blank/whitespace), with **`AdminButton`** actions only: **Reset** (`secondary`), **Delete** (`destructive`), **Save drop** (`primary`, disabled when validation fails). **Make active** was removed from the header (activation remains via **Activate this drop after saving** + save, and the drops index). **`AdminSectionHeader`** tightens vertical rhythm when **`description`** is omitted and tunes the **`h2`** for oath-dark headings. Tests: **`src/features/admin/drops/__tests__/DropEditorRoute.header.test.tsx`**.
- Files changed: `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/components/AdminSectionHeader.tsx`, `src/features/admin/drops/__tests__/DropEditorRoute.header.test.tsx`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-17 — Admin `/admin/drops`: forged outline “Create new drop” icon control

- Summary: Toolbar **`Plus`** link drops the flat **`primary`** pill for a **`DashboardCardCtaLink`-style** forged plate (**OKLab accent border**, **`--color-surface`** fill, inset rim + depth shadow, **`h-11`** / **44px** touch). **`focus-ring inline-flex`** stays on the global CTA hover path (`src/styles.css`).
- Files changed: `src/features/admin/drops/DropsAdminList.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**.

## 2026-05-17 — Admin `/admin/drops`: overflow (⋯) column first on desktop table

- Summary: **`DropsAdminList`** **`ColumnDef`** order puts the **`DropRowOverflowMenu`** (**`actions`**) column **leftmost** before Campaign/Slug/etc.; overflow cell aligns **start**. Test asserts the **first** **`columnheader`** is **Actions** (sr-only).
- Files changed: `src/features/admin/drops/DropsAdminList.tsx`, `src/features/admin/drops/__tests__/DropsAdminList.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**. Manual: desktop **`/admin/drops`** — ⋯ sits in the leading column.

## 2026-05-17 — Admin layout: contain wide drops table (viewport overflow)

- Summary: **`AdminLayout`** main column and **`DropsAdminList`** wrappers use **`min-w-0`** so grid/flex tracks can shrink below the table’s intrinsic width; the desktop table stays inside **`max-w-full overflow-x-auto`** so horizontal scroll is confined to the card, not the whole page (~320–390px sanity). Test asserts the table’s parent carries **`overflow-x-auto`** + **`max-w-full`**.
- Files changed: `src/features/admin/components/AdminLayout.tsx`, `src/features/admin/drops/DropsAdminList.tsx`, `src/features/admin/drops/__tests__/DropsAdminList.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**. Manual: narrow viewport **`/admin/drops`** — body should not gain a horizontal scrollbar; table region may scroll horizontally.

## 2026-05-17 — Admin `/admin/drops`: toolbar table + Radix overflow menus

- Summary: Drops index drops the duplicate **`AdminSectionHeader`** hero in favor of a **toolbar card** (search, segmented status tabs, **`Plus`** square link with **`focus-ring`** / **`aria-label`**, View site). Desktop uses **`@tanstack/react-table`** for sortable columns (title/slug/status/dates/products/last edited), **sticky** header, zebra + active tint, **column resize** handles, and **`DropRowOverflowMenu`** (**`MoreVertical`** + **`AdminDropdownMenu`** / **`@radix-ui/react-dropdown-menu`**). Motion on menu panel respects **`prefers-reduced-motion`** via **`admin-dropdown-menu-content`** (`src/styles.css`). Tests: **`src/features/admin/drops/__tests__/DropsAdminList.test.tsx`** (+ **`@testing-library/user-event`**). **`pnpm verify`** green (**197** tests).
- Files changed: `package.json`, `src/features/admin/drops/DropsAdminList.tsx`, `src/features/admin/drops/DropRowOverflowMenu.tsx`, `src/features/admin/components/AdminDropdownMenu.tsx`, `src/styles.css`, `src/routes/admin/drops/-dropsIndex.tsx`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`**. Manual: `/admin/drops` — sort headers, drag resize, ⋯ menu keyboard + reduced-motion OS toggle; confirm storefront bundle still has no admin imports.
- Notes/debt: **`useReactTable`** was not previously used elsewhere (deps already listed **`@tanstack/react-table`**); jsdom ignores Tailwind breakpoints — RTL scopes desktop assertions **`within(table)`**.

## 2026-05-17 — Admin Settings: password-gated local CMS reset

- Summary: **Danger zone** on `/admin/settings` uses a **full-width destructive** control (min height ≥44px, `focus-ring`, no label truncation). **Reset** opens the shared **`Modal`** with **`AdminCard`-style** inset rim/shadow; **`verifyAdminPassword`** in `adminAuth.storage.ts` centralizes the same plain compare as login (dev gate, not a hash). Users must **match admin password in two fields**; inline errors for mismatch / wrong password; **Confirm** stays disabled until valid. **`Modal`** accepts optional **`aria-describedby`**. Tests: `src/routes/admin/__tests__/-adminSettings.test.tsx`, `Modal` described-by case.
- Files changed: `src/features/admin/auth/adminAuth.storage.ts`, `src/features/admin/auth/AdminAuthProvider.tsx` (uses `verifyAdminPassword`), `src/routes/admin/-adminSettings.tsx`, `src/shared/components/ui/Modal.tsx`, `src/shared/components/ui/__tests__/Modal.test.tsx`, `src/routes/admin/__tests__/-adminSettings.test.tsx`, `docs/features/admin-ui.md`, `docs/features/auth-accounts-orders.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (this run). **PR screenshot:** Settings → Danger zone → open modal → show twin password fields + destructive actions on oath-dark panel.
- Notes/debt: Still aligns with temporary **`VITE_ANVL_ADMIN_*`** client-exposed credentials (`SEC-*` debt unchanged).

## 2026-05-17 — Admin: AdminButton + shared pressable variants

- Summary: **`AdminButton`** re-exports the shared **`Button`** (`class-variance-authority` + `forwardRef`) from `src/features/admin/components/AdminButton.tsx` for admin feature imports. Extended **`src/shared/components/ui/Button.tsx`** with **`destructive`**, **`size: none | compact`**, and segmented-tab variants **`adminTabList` / `adminTabEditor` / `adminTabProduct`** (use with **`data-active="true" | "false"`**). Migrated high-traffic controls: drops list status tabs + modals + row actions (**`DropsAdminList`**), product + drop editor tabs and toolbars (**`ProductEditorRoute`**, **`DropEditorRoute`**), acts builder toolbar + reorder/remove (**`DropActsBuilderPanel`**), live preview viewport pills + error fallback (**`DropEditorLivePreview`**). Documented token mapping in **`docs/features/admin-ui.md`**. Tests: **`src/features/admin/components/__tests__/AdminButton.test.tsx`**.
- Files changed: `src/shared/components/ui/Button.tsx`, `src/features/admin/components/AdminButton.tsx`, `src/features/admin/drops/DropsAdminList.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/drops/DropActsBuilderPanel.tsx`, `src/features/admin/drops/DropEditorLivePreview.tsx`, `src/features/admin/products/ProductEditorRoute.tsx`, `src/features/admin/components/__tests__/AdminButton.test.tsx`, `docs/features/admin-ui.md`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (see subagent run).
- Notes/debt: **`AdminTopbar`** and other admin surfaces still import **`Button`** from `@/shared/components/ui/Button` directly; prefer **`AdminButton`** when touching those files. No **shadcn/ui** install — project already had CVA + tokens; path **(A)** chosen for minimal churn.

## 2026-05-17 — Admin dashboard: equal-height cards + pinned footers + Settings CTA label

- Summary: **`AdminCard`** is a **full-height column shell** (`flex flex-col`, `h-full`, `min-h-0`) so grids can **`items-stretch`** tiles; **`/admin`** dashboard cards get **`min-h`** + footer row **`mt-auto`** so the **badge stays bottom-left** and **`DashboardCardCtaLink`** **bottom-right** regardless of description length. **Settings** nav item **`cta`** renamed from “Workspace settings” to **“Settings”** (`adminNav.ts`); **`getByRole('link', { name: card.cta })`** keeps tests aligned. **`DropActsBuilderPanel`** restores the missing **`MediaPickerField`** import so **`pnpm verify`** typechecks (unrelated regressions caught while verifying).
- Files changed: `src/features/admin/components/AdminCard.tsx`, `src/routes/admin/-adminDashboard.tsx`, `src/features/admin/components/adminNav.ts`, `src/features/admin/drops/DropActsBuilderPanel.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (this batch).
- Notes/debt: Other **`AdminCard`** call sites omit **`mt-auto`** on **`children`** so editor forms are unchanged; dashboard owns the pinned footer markup.

## 2026-05-17 — Admin: premium forged AdminCard treatment

- Summary: **`AdminCard`** shell now uses layered inset/ambient shadows, a non-interactive **bone corner wash + inset hairline** overlay, tighter **title/description** rhythm, hover **border brighten + subtle lift** with transitions gated by **`motion-safe`** / **`motion-reduce`**. **Dashboard** tile footer: chip tint + **`DashboardCardCtaLink`** `rounded-lg` and deeper inset/ambient shadow to match the plate; inner CTAs intentionally stay **brightness + shadow-only** on hover (`src/styles.css` already suppresses **`transform`** on `focus-ring` links inside **`group/card`** so the plate lift isn’t doubled). **`AdminCard`** tests in `src/features/admin/components/__tests__/AdminCard.test.tsx`.
- Files changed: `src/features/admin/components/AdminCard.tsx`, `src/routes/admin/-adminDashboard.tsx`, `src/features/admin/components/__tests__/AdminCard.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (see transcript).
- Notes/debt: none for this cosmetic pass.

## 2026-05-17 — Global button + CTA hover affordances

- Summary: Centralized **`cursor: pointer`** and cohesive hover (**brightness + shared transition timing**; **–1px `translateY` only** on CTA-shaped **`a.focus-ring.inline-flex`** with row heights **`h-9`–`h-12` / `min-h-10` / `min-h-11`**, only under **`prefers-reduced-motion: no-preference`**) in **`src/styles.css`**. Native **`button`**, **`input` submit/button/reset**, **`[role='button']`** (when not `aria-disabled`), **`::file-selector-button`**, and **`summary`** inherit the treatment; **native controls intentionally skip hover translate** so **`AdminCard`'s `group/card` plate lift** never stacks with an inner nudge. **Dashboard / admin CTAs inside `AdminCard`** drop CTA translate on hover and use a slightly softer brightness so card + control don’t double-animate. **Hero / drop-reveal** SafeLinks dropped redundant **`transition-transform hover:-translate-y-0.5`** in favor of the global CTA layer (primary hero sheen unchanged). Contract coverage: **`src/test/anvl-global-interactive-styles.test.ts`**.
- Files changed: `src/styles.css`, `src/features/marketing/components/HeroForgeSequence.tsx`, `src/features/marketing/components/DropRevealSection.tsx`, `src/test/anvl-global-interactive-styles.test.ts`, `docs/changelog.md`.
- Tests/manual checks: **`pnpm verify`** (log on this workstation); optional smoke: hover storefront hero CTAs, admin dashboard tiles, and a native **Join** / form button with motion on vs **reduced motion** in OS — translate should only appear for motion-OK link CTAs outside card shells; brightness-only for reduced motion.
- Notes/debt: Plain text links (`focus-ring` + `inline-flex` without fixed row heights) are unchanged so underline / micro-label patterns are not forced into “button” hover. Any future CTA link that omits both `min-h-*` and `h-*` won’t pick up the global link translate until one is added or the selector is extended.


## 2026-05-17 — Admin dashboard card CTA polish

- Summary: Redesigned dashboard card primary links in `src/routes/admin/-adminDashboard.tsx` from flat accent fills to **outline + inset highlight** (`focus-ring`, bone/heading label, accent-tinted border, restrained hover/active shadow) so CTAs read as forged controls on dark admin chrome. Added a co-located `DashboardCardCtaLink` helper; extended `src/routes/admin/__tests__/-adminDashboard.test.tsx` to assert every tile’s CTA `href`.
- Tests/manual checks: `pnpm verify` — typecheck + **185/185** Vitest tests + production build succeeded. Note: intermittent Windows `EBUSY` when copying `favicon.ico` into `dist` can occur if another process locks `dist`; clearing `dist/` and re-running resolves it.
- Notes/debt: none for this visual-only admin slice.

## 2026-05-17 — Admin dashboard: drop duplicate hero strip

- Summary: Removed the redundant `AdminSectionHeader` block from `/admin` (signed-in eyebrow, personalized welcome, localStorage blurb, and external **View site** CTA). Context already lives in `AdminTopbar`; main content now opens with the CMS destination cards only. Added Vitest coverage in `src/routes/admin/__tests__/-adminDashboard.test.tsx` (layout/auth/router mocks; assertions avoid jest-dom matchers).
- Files changed: `src/routes/admin/-adminDashboard.tsx`, `src/routes/admin/__tests__/-adminDashboard.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` (typecheck, Vitest, production build).
- Notes/debt: `AdminSectionHeader` remains available for other admin routes.

## 2026-05-17 — Integrate cms_merge into cms; trim branches to master + cms

- Summary: Fast-forwarded **`cms`** to **`cms_merge`** tip (`8a734e6`) so the main CMS line carries the full audit **A–J** stack. Deleted **`origin/cms_merge`** and all **`origin/cursor/*`** feature branches on GitHub; removed matching local branches. **Remote default branches remaining:** `master`, `cms`.
- Files changed: none (git-only); this changelog entry.
- Tests/manual checks: merge was fast-forward; prior `pnpm verify` green on merged tip.
- Notes/debt: Clone fresh or `git fetch --prune` so stale remote-tracking refs disappear locally.

## 2026-05-17 — cms_merge: merge Phase G (performance + storage migration)

- Summary: Merged `origin/cursor/audit-remaining-storage-g-drawer-289d` so Phase **G** joins phases **A–J** already integrated on `cms_merge`. Resolved `adminAuth.storage.ts` by combining Phase J `publicEnv` credential reads with Phase G `createLocalStorageChannel` + shared `isBrowser`; `website-layout` uses the lazy route shell from Phase G.
- Files changed (resolution only): `src/features/admin/auth/adminAuth.storage.ts`, `src/routes/admin/website-layout.tsx`.
- Tests/manual checks: `pnpm verify` (typecheck, **178/178** tests, build).
- Notes/debt: Full Phase G file list and audit-doc updates are in the entries immediately below this one.

## 2026-05-17 — cms_merge: merge audit phases A–H with existing D–J integration

- Summary: Merged `cursor/audit-phase-h-responsiveness-289d` (linear phases A through H) into `cms_merge`, which already contained the phase D–J CMS-boundary and hardening work. Resolved conflicts in `docs/changelog.md`, `package.json` (`verify` runs typecheck, Vitest, and build), `SiteFooter.tsx` (storefront CMS types + newsletter toast), and `HeroForgeSequence.tsx` (storefront CMS types). **Phase G** landed in a subsequent merge from `cursor/audit-remaining-storage-g-drawer-289d` (see entry above).
- Files changed: `docs/changelog.md`, `package.json`, `src/shared/components/layout/SiteFooter.tsx`, `src/features/marketing/components/HeroForgeSequence.tsx`, `src/routes/auth/__tests__/-sign-up.test.ts` (renamed from `sign-up.test.ts` so TanStack Router ignores it per `routeFileIgnorePrefix`).
- Tests/manual checks: `pnpm verify` after completing the merge commit.
- Notes/debt: none for this merge-resolution slice.

## 2026-05-17 — Contracts: catalog types out of admin

- Summary: Moved `AdminProduct` and related catalog document types to `src/features/products/types/catalogProduct.types.ts`. `features/admin/products/products.types.ts` re-exports for existing admin imports. `shared/api/contracts/products.contract.ts` now depends only on `features/products`.
- Files changed: `src/features/products/types/catalogProduct.types.ts`, `src/features/admin/products/products.types.ts`, `src/shared/api/contracts/products.contract.ts`, `docs/contracts/README.md`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` (pass). Browser smoke (dev server): `/`, `/shop`, PDP `/shop/oversized-tee`, `/drop/the-oath` — all rendered; only typical Vite/HMR dev warnings in console.
- Notes/debt: none for this slice.

## 2026-05-17 — Audit phases D–J: CMS boundary, editor splits, verify, repatch docs, public env

- Summary: **Phase D —** Moved canonical `Drop` types and `drops.actSequence` to `features/drops/`; website layout types to `features/cms/layout/`; landing compose + act normalization + `LANDING_CMS_VERSION` into `features/cms/landing/`; added `features/cms/read/*` facades and `features/products/catalog/storefrontCatalog.ts` / `productSubscriptions.ts` so public routes and marketing no longer import `@/features/admin/*` for reads. **Phase E —** Extracted shared drop/product editor utilities (`dropEditorRoute.shared.ts`, `DropEditorFieldError.tsx`, `productEditorRoute.shared.ts`). **Phase F —** Added `pnpm verify`. **Phase I —** Added `docs/tooling/router-repatch.md`. **Phase J —** Added Zod-backed `src/app/config/publicEnv.ts`; wired admin auth + international checkout flag. Drop editor imports `composeLandingPageFromDrop` from CMS module.
- Files changed: `src/features/drops/drop.types.ts`, `drops.actSequence.ts`, `src/features/cms/landing/*`, `src/features/cms/layout/websiteLayout.types.ts`, `src/features/cms/read/*`, `src/features/products/catalog/*`, admin re-export shims, `DropEditorRoute.tsx`, `ProductEditorRoute.tsx`, `publicEnv.ts`, `checkoutPayments.config.ts`, `adminAuth.storage.ts`, `package.json`, `vite-env.d.ts`, `docs/architecture.md`, `docs/README.md`, `docs/cursor-workflow.md`, `docs/tooling/router-repatch.md`, `docs/performance-accessibility-security.md`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` (pass).
- Notes/debt: CMS localStorage adapters intentionally call admin services behind `features/cms` facades until a real API exists. Catalog document types (`AdminProduct`, etc.) live in `features/products/types/catalogProduct.types.ts`; contracts import from there, not `features/admin`.

## 2026-05-17 — Audit program closure (documentation + Phase A–J status)
- Summary: Restored and published **`docs/audit-2026-05-17.md`** as the single canonical audit record: condensed finding index (`SEC` / `PERF` / `RESP` / `MAINT` / `REU`), **phase tracker** with **A–C, G, H marked done**, and **D, E, F, I, J explicitly deferred** with rationale (folder boundary, editor splits, DX, codegen, production hardening). Linked the doc from **`docs/README.md`** and added an **“Audit program — closed batch”** section to **`docs/technical-debt.md`** so launch blockers stay visible under Phase J. This closes the **execution scope** of the 2026-05-17 hardening task; remaining work is tracked as follow-up PRs, not as open audit execution.
- Files changed: `docs/audit-2026-05-17.md` (new), `docs/README.md`, `docs/technical-debt.md`, `docs/changelog.md`.
- Tests/manual checks: **Docs-only** — no code paths changed in this changelog entry.
- Notes/debt: Merge **PR #13** (and stacked PRs on `cms_merge` if applicable) to land the last code batch; use `docs/audit-2026-05-17.md` as the handoff for Phase D/E/F/I/J owners.

## 2026-05-17 — Audit Phase C optional + Phase G performance + Drawer focus hook
- Summary: Closes the Phase C follow-up by migrating hand-rolled `localStorage` EventTarget scaffolding on `drops`, `products`, `website-layout`, `global-brand`, and `adminAuth` storage modules to `createLocalStorageChannel`, extended with `readKey` / `writeKey` / `notifyChange` for multi-key drops + mirrored auth writes. `landingCms.storage.ts` only imports the shared `isBrowser` helper. Ships **Phase G** items: every admin route except the `/admin` layout shell uses `lazyRouteComponent` with colocated `-*.tsx` sidecars; `DropActsBuilderPanel` is `React.lazy` + `Suspense` inside `DropLandingActsEditor`; root route preloads Manrope + Bebas Neue latin-400 `woff2`; Vite `manualChunks` adds `vendor-zod`, `vendor-tanstack`, `vendor-react`; router `defaultPreloadStaleTime` is 30s (`PERF-07`). **Drawer** now uses `useDialogFocusTrap` like `Modal` (Phase H optional debt).
- Files changed: `src/shared/lib/storage/*`, admin `*.storage.ts` files above, new `src/routes/admin/**/-*.tsx` sidecars + slim route entries, `DropLandingActsEditor.tsx`, `Drawer.tsx`, `src/routes/__root.tsx`, `src/router.tsx`, `vite.config.ts`, `docs/changelog.md`, `docs/performance-accessibility-security.md`, `docs/features/drops-cms.md`, `docs/features/products-commerce.md`.
- Tests/manual checks: `pnpm verify` — **178/178** tests (**+3** channel tests). Build shows async chunks for admin shells and `DropActsBuilderPanel`.
- Notes/debt: **Phase D / E / F / I / J** still open at large. `src/routes/auth/__tests__/sign-up.test.ts` was renamed to `-sign-up.test.ts` so TanStack’s route scanner ignores it during `vite build`.

## 2026-05-17 — Audit Phase H responsiveness + a11y + smoothness (H1 – H14 batch)
- Summary: Fourth execution pass against `docs/audit-2026-05-17.md`, stacked on PR #11. Closes 13 of the 14 RESP findings the audit listed (RESP-01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14). Six logical commits, all surgical — no admin surface restructure, no behavior changes beyond the focus / motion / overflow fixes. Admin auth still untouched.
  - **RESP-01 / RESP-13 / RESP-14 — Modal focus trap + h2 dialog headings + Accordion aria.** `Modal` now wires `useDialogFocusTrap` (Tab/Shift+Tab cycle inside the panel, programmatic focus on open, focus restored on close, Escape closes) — previously the only way to dismiss was clicking the backdrop. New `title` prop renders an `<h2>` inside the panel with an auto-generated id wired to `aria-labelledby`, replacing inline `<h3>` headings in the settings reset modal and the four `DropEditorRoute` modals (save / activate / reset / delete). Explicit `aria-labelledby` still supported as the escape hatch (kept on `DropsAdminList`, `ProductEditorRoute`, `-adminProductsIndex` modals). `AccordionDisclosure` chevron marked `aria-hidden="true"`; the `<summary>` now uses the shared `focus-ring` utility.
  - **RESP-04 / RESP-05 — focus-ring + 44 px touch targets.** Added `focus-ring` to `ProductCard` link, `ProductGallery` thumb buttons (+ `aria-pressed`), `PiecesGrid` product card link, `AdminSidebar` header link + nav items. Raised `IconButton` to 44 × 44 px (default `type="button"`); `ColorSwatch` hit area expanded to 44 × 44 px with the visible 36 px swatch centered via `aria-hidden` inner span (design density unchanged); `QuantityStepper` switched to `size="md"` buttons with `aria-label` "Decrease/Increase quantity" + `aria-live="polite"` on the value display.
  - **RESP-02 — PDP mobile sticky purchase bar safe-area.** Bar now uses `pb-[max(env(safe-area-inset-bottom,0px),12px)]` so it clears notched-phone home indicators. A matching spacer (`h-[calc(64px+env(safe-area-inset-bottom,0px))]`) under the article prevents the bar from covering related products / accordion on mobile.
  - **RESP-09 — responsive hero scale.** Replaced raw `text-6xl` with `text-4xl sm:text-5xl md:text-6xl` on PDP h1, cart h1, checkout h1, shop/index h1 (matches the existing `DropActivePageView` pattern).
  - **RESP-12 — UTF-8 mojibake.** `routes/shop/index.tsx` SEO description: `ΓÇö` → `—`.
  - **RESP-07 — iOS zoom-on-focus prevention.** `Input` and `Textarea` shared primitives now default to `text-base md:text-sm` (was `text-sm` globally) so iOS Safari doesn't zoom into form fields on focus. Applies storefront-wide via every consumer (shop search, auth, account, checkout, waitlist, every admin editor using the primitives).
  - **RESP-06 — text overflow guards on long CMS names.** `ProductCard` title row gets `min-w-0 break-words` on the `<h3>` + `shrink-0` on the price column; cart line article wraps the title block in `min-w-0` + uses `text-2xl sm:text-3xl break-words`; checkout order summary line gets `gap-3` + `min-w-0 break-words` on the label + `shrink-0` on the price.
  - **RESP-08 — PiecesGrid mobile columns.** Was `grid-cols-3` from 320 px (squeezed type + tap targets). Now `grid-cols-2` on phones, `sm:grid-cols-3` from 640 px.
  - **RESP-03 — GSAP timelines gate on viewport + reduced motion.** Five marketing acts (`OathStampSequence`, `DropRevealSection`, `PiecesGrid`, `MaterialsMarquee`, `WaitlistSection`) previously only gated on `prefers-reduced-motion`. On phones with the default "no preference" motion setting all five ran their full ScrollTrigger timelines (incl. OathStampSequence's infinite shape rotation + parallax scrub). Widened the `gsap.matchMedia` keys so `motionOk = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'` and `reduced = '(max-width: 767px), (prefers-reduced-motion: reduce)'`. Each component's existing `reduced` branch already snaps to final state via `gsap.set`, so the snap path is now re-used on mobile without any callback changes. Matches the `HeroForgeSequence` model.
  - **RESP-10 — SiteFooter newsletter form + heading promotion.** Newsletter input + button were a bare div; now wrapped in `<form onSubmit>` (placeholder handler with sonner toast — real backend lands with Phase J). Input is now `type="email" required` so the browser validates before submit. Footer group titles and newsletter title promoted from styled `<p>` to `<h3>` (visual styling unchanged via `anvl-micro font-normal`) so the footer participates in the document outline.
  - **RESP-11 — responsive Toaster.** `AppProviders` Toaster moved from `position="top-right"` (which fought the sticky header + announcement bar on mobile) to `position="bottom-center"` with `offset={16}` and `mobileOffset={{ bottom: 96 }}` so the toast clears the iPhone home indicator AND the PDP sticky purchase bar.
- Files changed: `src/shared/components/ui/Modal.tsx` (rewritten), `AccordionDisclosure.tsx`, `Input.tsx`, `Textarea.tsx`, `IconButton.tsx`, `ColorSwatch.tsx`, `ProductGallery.tsx`, `ProductCard.tsx`, `QuantityStepper.tsx`, new `__tests__/Modal.test.tsx` + `__tests__/AccordionDisclosure.test.tsx`, `src/features/admin/components/AdminSidebar.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/marketing/components/{OathStampSequence,DropRevealSection,PiecesGrid,MaterialsMarquee,WaitlistSection}.tsx`, `src/routes/admin/settings.tsx`, `src/routes/cart.tsx`, `src/routes/checkout/index.tsx`, `src/routes/shop/index.tsx`, `src/routes/shop/$slug.tsx`, `src/shared/components/layout/SiteFooter.tsx`, `src/app/providers/AppProviders.tsx`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` — typecheck 0 errors, **175/175 tests passed across 20 files** (was 165/18 after PR #11; **+10 tests this PR**, all on the new Modal + AccordionDisclosure tests). `vite build` success. Modal test coverage: closed renders nothing, role=dialog + aria-modal=true, title renders as h2 wired to aria-labelledby, explicit aria-labelledby skips auto-heading, aria-label fallback, Escape closes, backdrop click closes. Accordion test coverage: title + body rendering, chevron is aria-hidden, summary has focus-ring class. Manual GUI testing intentionally skipped per `.cursor/rules/50-testing.mdc` — changes are either purely structural (text scale, focus-ring class additions, type-base size, GSAP matchMedia query strings) or covered by the new Vitest tests; the dev environment doesn't have a working browser harness today and the user previously asked to keep verification light.
- Notes/debt: Phase H is now functionally complete except for **RESP-15** (admin editor density on tablets) and **RESP-16** (skeleton/loading state consistency), both rated Low in the audit and best handled as part of Phase E (the editor splits) and Phase F (DX/reusability), respectively. The Drawer component still hand-rolls a copy of `useDialogFocusTrap` (predates the hook); switching it to use the shared hook is a mechanical zero-behavior follow-up (~25-line diff in `Drawer.tsx`). Next high-leverage targets: **Phase G** (admin route `lazyRouteComponent` + lazy `DropActsBuilderPanel` + expanded `manualChunks` + font preload) and **Phase E** (split the 600+ line editors). Admin auth gate remains unchanged.

## 2026-05-17 — Audit Phase C persistence Zod hardening (C1–C5)
- Summary: Third execution pass against `docs/audit-2026-05-17.md`, stacked on PR #10. Closes `SEC-07` across every non-drop persistence boundary (products, website-layout, global-brand), introduces the generic `createLocalStorageChannel` + `createJsonStore` factories called out by `REU-05`, centralizes every admin `localStorage` key per `MAINT-08`, and validates the `bootstrapFromLanding` JSON paste in the acts builder per `SEC-16`. Admin auth in `src/features/admin/auth/**` still untouched.
  - **C1 + C3 — factories + storage keys:** new `src/features/admin/storageKeys.ts` (`ADMIN_STORAGE_KEYS` map + `ALL_ADMIN_STORAGE_KEYS` list) is the single source of truth for the seven admin keys (`ANVL_DROPS`, `ANVL_ACTIVE_DROP_ID`, `ANVL_PRODUCTS`, `ANVL_WEBSITE_LAYOUT`, `ANVL_GLOBAL_BRAND`, `anvl.landingCms.v1`, `anvl.siteSeo.v1`). New `src/shared/lib/storage/`: `createLocalStorageChannel({ key, changeEvent, alsoListenForKeys? })` owns the SSR-safe read/write/remove + cross-tab event plumbing every `*.storage.ts` previously hand-rolled; `createJsonStore({ channel, schema, transform?, onInvalid? })` pairs a channel with a Zod schema and runs `safeParse` on every read so tampered or stale-schema blobs return `null` instead of an `as` cast. Future `*.storage.ts` migrations will use the channel/store factories instead of copying the scaffolding.
  - **C2 — Zod persistence for products / website-layout / global-brand (closes SEC-07):** new `products.persistence.zod.ts`, `websiteLayout.persistence.zod.ts`, and `globalBrand.persistence.zod.ts` mirror the drops persistence pattern. `products.service.getAdminProducts` now `safeParse`s each row and drops malformed neighbors (instead of wiping the whole catalog); `websiteLayout.service.getWebsiteLayoutContent` and `globalBrand.service.getGlobalBrandSettings` validate before their existing merge-with-defaults pipelines. The hand-written `AdminProduct` / `WebsiteLayoutContent` / `GlobalBrandSettings` types stay the public surfaces; the persistence schemas only guard the storage boundary, documented in each schema file header.
  - **C5 / SEC-16 — `bootstrapFromLanding` JSON paste:** `DropActsBuilderPanel.bootstrapFromLanding` now parses the pasted JSON, then `safeParse`s with `dropLandingContentSchema` (exported from `drops.persistence.zod.ts`) before feeding `landingContentToSimpleActs`. Invalid pastes become a no-op instead of producing unexpected draft state.
  - **C3 — `resetAllLocalCmsKeys` uses the central list:** replaced seven hard-coded literals / scattered key imports in `drops.service.ts` with a loop over `ALL_ADMIN_STORAGE_KEYS`. Adding a new persisted key now automatically includes it in the bulk reset, closing the original MAINT-08 silent-miss risk.
- Files changed: new `src/features/admin/storageKeys.ts`, new `src/shared/lib/storage/{index,createLocalStorageChannel,createJsonStore}.ts` + tests, new `src/features/admin/products/products.persistence.zod.ts` + 2 tests, new `src/features/admin/website-layout/websiteLayout.persistence.zod.ts` + test, new `src/features/admin/global-brand/globalBrand.persistence.zod.ts` + test, modified `src/features/admin/products/products.service.ts`, `src/features/admin/website-layout/websiteLayout.service.ts`, `src/features/admin/global-brand/globalBrand.service.ts`, `src/features/admin/drops/drops.service.ts`, `src/features/admin/drops/drops.persistence.zod.ts`, `src/features/admin/drops/DropActsBuilderPanel.tsx`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` — typecheck 0 errors, **165/165 tests passed across 18 files** (was 122/12 after PR #10; **+43 tests this PR**), `vite build` success. Coverage: storage factories 14 (channel round-trip / same-tab listener / cross-tab key filter / `alsoListenForKeys` widening / quota swallowing / `safeParse` rejects / `onInvalid` hook / `transform` / `clear`); products persistence 14 (9 schema + 5 integration tamper guard); website-layout persistence 8 (4 schema + 4 integration); global-brand persistence 7 (3 schema + 4 integration). The `bootstrapFromLanding` change is covered indirectly via `dropLandingContentSchema` which is already tested in the drops persistence suite.
- Notes/debt: Phase C is complete except for one nuance — the existing `*.storage.ts` modules still hand-roll the channel scaffolding (`isBrowser` + `EventTarget` + `storage` listener). The `createLocalStorageChannel` factory is in place and tested; migrating each `*.storage.ts` to use it is mechanical and best done in a focused follow-up (touches 4 files, no behavior change, reduces line count by ~40%). `landingCms.storage.ts` (legacy migration read path) is intentionally left as-is because it's slated for deletion once every renderer reads from `Drop.acts`. Next high-leverage targets: **Phase D** (move CMS-read code out of `features/admin/**` into `features/cms/**` — unlocks the admin-route lazy-loading wins in Phase G), **Phase E** (split the 600+ line editors). Admin auth gate remains unchanged.

## 2026-05-17 — Audit Phase B security minimums (B3 – B7)
- Summary: Second execution pass against `docs/audit-2026-05-17.md`, stacked on PR #9. Closes every Phase B finding except B1 (already shipped in PR #9) and B2 (already shipped in PR #9). Admin auth in `src/features/admin/auth/**` remains untouched per the locked AGENTS.md directive — these are all defense-in-depth changes at the render boundary and the in-page validation surface.
  - **B3 / SEC-04 — `sanitizeHref` + `SafeLink`:** new `src/shared/lib/url.ts` with `sanitizeHref(raw, { allowRelative, schemes })` (allowlists https/http/mailto/tel + relative URLs; rejects javascript:/data:/vbscript:/file:/ssh:/ftp:/scheme-less ambiguous + embedded control chars), `isExternalHref`, and `upgradeHttpToHttps`. New `src/shared/components/ui/SafeLink.tsx` primitive renders external URLs as `<a target=_blank rel=noreferrer noopener>`, relative URLs as TanStack `<Link>`, and rejected URLs as a non-interactive `<span>` so the label stays visible — `forceExternal` escape hatch for cases like footer socials. Forwards `data-*` / `aria-*` props on both branches so GSAP targeting attrs (e.g. `data-pieces-meta`) keep working after migration. Migrated every CMS-driven href: AnnouncementBar `ctaHref`; SiteFooter footer link groups, flat footer links, social anchors; StickyHeader announcement.href (removed brittle `href?.startsWith('http')` branching), desktop nav items, mobile drawer nav items; HeroForgeSequence primary + secondary CTAs; DropRevealSection primary + secondary CTAs; PiecesGrid `viewAllHref` and `footerLinkHref`; shop/$slug PDP 3D-model link (closes the cited `javascript:` threat from the audit). Product cards keep their typed `<Link to="/shop/$slug">` (not CMS-driven; no sanitization needed).
  - **B4 / SEC-20 — `MediaPickerField` rejects unsafe media URLs inline:** `isLikelySafeMediaSrc` allowlist (https / http / `/public` paths / `data:image/*` / `data:video/*`; rejects `javascript:`, `data:text/html`, `vbscript:`, `file:`, scheme-less ambiguous, control chars). When the operator types a rejected URL the preview short-circuits to a red "Unsafe URL blocked" placeholder and an inline error explains the allowlist; the text input keeps the typed value so the operator sees the bad paste and can correct it.
  - **B5 / SEC-19 — `stripAngleBracketTags` extended:** helper now accepts `string | null | undefined`. Applied at every storefront chrome surface that renders a CMS plain-text field: `AnnouncementBar` (message + ctaLabel), `StickyHeader` (announcement.message, desktop + drawer nav labels), `SiteFooter` (footerTagline, footerMicroCaption, group title, link labels, copyright), `ProductCard` (product.name, product.role, colorway names). Persistence-level sanitization (schema transform on save) remains a Phase C task.
  - **B6 / SEC-13 — uniform sign-up response (no email enumeration):** `/auth/sign-up` onError no longer calls `form.setError('email', 'This email is already registered.')` for `STOREFRONT_ACCOUNT_EMAIL_TAKEN`. Every failure (already-taken, validation, network) now produces the same neutral toast. SEC-13 inline comment notes that real auth (Phase J1) must also match success-response *timing* server-side to fully neutralize the oracle.
  - **B7 / SEC-15 — HTTPS-normalize SEO image URLs:** `absoluteImageUrl` in `src/shared/components/seo/structuredData.ts` upgrades `http://` to `https://` for every JSON-LD / OG / canonical surface so mixed-content image URLs from admin catalog data can't degrade those pages.
- Files changed: new `src/shared/lib/url.ts`, new `src/shared/lib/__tests__/url.test.ts`, new `src/shared/components/ui/SafeLink.tsx`, new `src/shared/components/ui/__tests__/SafeLink.test.tsx`, new `src/shared/components/ui/__tests__/MediaPickerField.test.tsx`, new `src/shared/lib/__tests__/stripAngleBracketTags.test.ts`, new `src/routes/auth/__tests__/-sign-up.test.ts`, `src/shared/components/ui/index.ts`, `src/shared/components/ui/MediaPickerField.tsx`, `src/shared/components/ui/ProductCard.tsx`, `src/shared/components/layout/AnnouncementBar.tsx`, `src/shared/components/layout/SiteFooter.tsx`, `src/shared/components/layout/StickyHeader.tsx`, `src/shared/components/seo/structuredData.ts`, `src/shared/lib/stripAngleBracketTags.ts`, `src/features/marketing/components/HeroForgeSequence.tsx`, `src/features/marketing/components/DropRevealSection.tsx`, `src/features/marketing/components/PiecesGrid.tsx`, `src/routes/shop/$slug.tsx`, `src/routes/auth/sign-up.tsx`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` — typecheck 0 errors, **122/122 tests passed across 12 files** (was 42/7 after PR #9; +80 tests this PR), `vite build` success. Coverage breakdown for the new helpers: `url.ts` 51 assertions across sanitizeHref + isExternalHref + isLikelySafeMediaSrc + upgradeHttpToHttps; SafeLink 12 (external/internal/rejected branching incl. forceExternal); MediaPickerField 5 (empty fallback, safe data URI, `javascript:` block, `data:text/html` block, scheme-less block); stripAngleBracketTags 4; sign-up regression guard 4. The sign-up onError change is hard to exercise end-to-end without a TanStack Router + Query rig, so the test is a string-level regression guard documented in the file.
- Notes/debt: Phase B is now complete. Remaining Phase B7 nuance (warn in admin on save for `http://` image URLs) is a small ergonomic follow-up — the runtime SEO path is already protected. Next high-leverage targets: Phase C (`createJsonStore` + Zod-validate non-drop persistence — closes SEC-07 across products / website-layout / global-brand / legacy landing), Phase D (move CMS reads out of `features/admin/**`), and Phase E (split the 600+ line editors). Admin auth gate remains unchanged.

## 2026-05-17 — Audit Phase A foundations + Cursor rules + testing infra
- Summary: First execution pass against `docs/audit-2026-05-17.md` (delivered on PR #8 / `cursor/full-app-audit-289d`). Lands the safety-net Phase A tasks and two Phase B quick wins, plus a `.cursor/rules/*` rule set and an AGENTS.md update so future agents abide by the audit. Admin auth in `src/features/admin/auth/**` is intentionally **unchanged** per direction — it remains the documented temporary `VITE_ANVL_ADMIN_*` static gate until a real auth provider lands (Phase J1; hosted-demo blockers `SEC-01`/`SEC-02`/`SEC-03`/`SEC-11` stay flagged in `docs/technical-debt.md`).
  - **Rules (`.cursor/rules/`):** `00-anvl-overview.mdc` (always-on working agreement + Definition of Done + out-of-scope list), `10-security.mdc` (admin-auth-locked, Zod-or-no-merge for CMS persistence, `sanitizeHref` policy, no new `VITE_*` secrets, no `"latest"` deps), `20-performance-bundle.mdc` (every admin route uses `lazyRouteComponent`, storefront/admin import boundary, GSAP matchMedia gate, image/font hygiene), `30-responsiveness-a11y.mdc` (mobile-first type scale, ≥44 px touch targets, focus-ring everywhere, dialog focus-trap, safe-area, iOS-zoom-prevention), `40-solid-maintainability.mdc` (300/500 line budget, presentational components, folder boundaries, helper extraction triggers), `50-testing.mdc` (Vitest is the safety net, coverage per area, layout conventions). `AGENTS.md` now mandates reading the audit per task, adds the "Admin auth — locked" section, and rewrites Definition of Done around `pnpm verify` + Vitest + audit task status updates.
  - **Phase A1 — testing infrastructure:** `vitest.config.ts` (separate from `vite.config.ts`, jsdom env, `css: false`, path aliases, v8 coverage), `src/test/setup.ts` (RTL cleanup, `localStorage`/`sessionStorage` reset, `matchMedia` / `IntersectionObserver` / `ResizeObserver` polyfills). Scripts: `test`, `test:watch`, `test:coverage`, `test:related`, `verify` (typecheck + test + build). **42 tests across 7 files** covering: `sanitizeCssValue` (active-drop CSS injection rejects), `persistedDropSchema` (SEC-07 tamper guard), `drops.actSequence` normalize (canonical order across partial/shuffled/null/undefined/unknown-key inputs), `shopUrlSearch` (validate + filter + aggregations), `JsonLd` (`<` escaped to `\u003c` to defeat `</script>`), `createRuntimeClients` (SEC-08 SSR vs browser contract), `ErrorBoundary` (catch + reset + resetKey).
  - **Phase A2 / MAINT-11 — error boundaries:** `src/app/components/ErrorBoundary.tsx` (generic class boundary with render-prop fallback + reset + resetKey-driven auto-reset), `AppErrorBoundary.tsx` (ANVL-branded storefront fallback — "Forge interrupted" — retry + back-to-home), `AdminErrorBoundary.tsx` (admin-only fallback that keeps the admin chrome usable when a panel throws). Wired into `__root.tsx` (around the storefront `<Outlet />`, pathname-keyed) and `routes/admin/route.tsx` (around the admin `<Outlet />`, pathname-keyed).
  - **Phase A3 / PERF-06:** `pnpm analyze` script added — runs `ANVL_ANALYZE=1 vite build` so the analyzer in `vite.config.ts` writes `dist/stats.html` per docs.
  - **Phase A4 / SEC-23:** Six `@tanstack/*` `"latest"` specifiers pinned to carets at the resolved versions (`react-devtools ^0.10.2`, `react-router ^1.169.2`, `react-router-devtools ^1.166.13`, `react-router-ssr-query ^1.166.12`, `react-start ^1.167.64`, `devtools-vite ^0.6.0`). Lockfile reconciled — no resolved-version drift.
  - **Phase B1 / SEC-06:** `.env.example` no longer ships the realistic-looking `Test123@` password. Replaced with a loud warning block (Vite inlines `VITE_*` into the public JS) + a neutral placeholder (`changeme-please-set-a-strong-local-password`) + an `openssl rand -base64 24` hint + a pointer at `docs/technical-debt.md`.
  - **Phase B2 / SEC-22:** `TanStackDevtools` in `__root.tsx` gated by `import.meta.env.DEV` — belt-and-braces alongside `@tanstack/devtools-vite`'s `removeDevtoolsOnBuild` default.
- Files changed: `.cursor/rules/00-anvl-overview.mdc`, `10-security.mdc`, `20-performance-bundle.mdc`, `30-responsiveness-a11y.mdc`, `40-solid-maintainability.mdc`, `50-testing.mdc`, `AGENTS.md`, `vitest.config.ts`, `src/test/setup.ts`, `package.json`, `pnpm-lock.yaml`, `src/app/components/ErrorBoundary.tsx`, `AppErrorBoundary.tsx`, `AdminErrorBoundary.tsx`, `src/routes/__root.tsx`, `src/routes/admin/route.tsx`, `.env.example`, `src/app/__tests__/runtime.test.ts`, `src/app/__tests__/ErrorBoundary.test.tsx`, `src/features/admin/drops/__tests__/dropPaletteStyle.test.ts`, `drops.persistence.zod.test.ts`, `drops.actSequence.test.ts`, `src/features/products/shop/__tests__/shopUrlSearch.test.ts`, `src/shared/components/seo/__tests__/JsonLd.test.tsx`, `docs/changelog.md`.
- Tests/manual checks: `pnpm verify` (typecheck 0 errors, test 42/42 passed across 7 files, build success). Manual: tests assert `<` escaping in JSON-LD vs the literal `</script><img onerror=...>` payload and reject `expression(`, `javascript:`, `@import`, `<>`, `{}`, oversize input for the CSS sanitizer. Smoke-tested locally that `import.meta.env.DEV` is truthy under `pnpm dev` and falsey under `pnpm build`.
- Notes/debt: Admin auth gate (`src/features/admin/auth/**`) intentionally unchanged this PR — see Section "Admin auth — locked" in `AGENTS.md`. Phase tracker and follow-ups live in `docs/audit-2026-05-17.md` on `cms` (supersedes open PR #8, which was docs-only and never merged).

## 2026-05-17 — CMS code-review follow-ups
- Summary: Applied the senior-engineer review fixes against PR #7. (1) `ViewportIframe.initialize` is now idempotent and disconnects any prior `MutationObserver` before installing a new one — eliminated a one-observer-per-mount leak when `iframe.contentDocument.readyState === 'complete'` arrived synchronously. (2) Deleted now-dead `HexColorPicker.tsx` and `ImageFileOrUrlField.tsx`; pulled them out of the public UI barrel. (3) Loosened `URL_OR_PATH_PATTERN` to accept param-less `data:` URIs (`data:image/svg+xml,<svg/>` no longer flags as invalid). (4) Added `useWebsiteLayout()` (mirrors `useDropsList` shape via `useSyncExternalStore` + `subscribeWebsiteLayoutChange`) and routed the drop editor preview through it; switched the products map to read from the already-reactive `useAdminProductsList()` snapshot so cross-tab layout/product changes refresh the preview. (5) Upgraded the remaining raw text inputs in `DropActsBuilderPanel` (hero `backgroundImageUrl` + `emblemWatermarkSrc`, drop-reveal `dropVisualSrc`, final-CTA `backgroundImageUrl`, lookbook `galleryItems[].src`) to `MediaPickerField` so every act media slot is drag-and-drop with crest preview. (6) Relabelled the per-field "Leave empty (no fallback)" toggle to "Hide crest preview" with a tooltip explaining that the flag is editor-only state today; documented the persisted-`leaveEmpty` plan under a "Persisted leaveEmpty (planned follow-up)" doc section in `drops-cms.md`. (7) Gated the "or drag & drop" affordance behind `@media (hover: hover) and (pointer: fine)` so touch-first devices don't see a misleading desktop-only hint, and the drop handler short-circuits accordingly. (8) Added a maintenance note in `drops-cms.md` that `PREVIEW_RESET_CSS` is an enumeration to keep in sync when new act renderers introduce `data-*` animation attributes (with a sketch of the eventual single-token replacement). Minor: simplified an identical-branch ternary in `ColorField` initial state.
- Files changed: `src/features/admin/drops/DropEditorLivePreview.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/drops/DropActsBuilderPanel.tsx`, `src/features/admin/drops/drops.editor.validation.ts`, `src/features/admin/website-layout/useWebsiteLayout.ts` (new), `src/shared/components/ui/ColorField.tsx`, `src/shared/components/ui/MediaPickerField.tsx`, `src/shared/components/ui/index.ts`, deleted `src/shared/components/ui/HexColorPicker.tsx` + `src/shared/components/ui/ImageFileOrUrlField.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass). Manual: verified Visuals tab uses "Hide crest preview" copy; Hero act exposes `Background image` + `Emblem / watermark` as MediaPickerFields; Lookbook act exposes all 5 gallery items as MediaPickerFields.
- Notes/debt: `leaveEmpty` persistence remains an explicit follow-up — when ready, add `Drop.visualsLeaveEmpty?: Partial<Record<keyof DropVisuals, boolean>>` plus a renderer-side resolver, then flip the toggle label back to its stronger semantics.

## 2026-05-16 — Drop preview: responsive iframe simulation for Mobile / Tablet / Desktop
- Summary: Upgraded `DropEditorLivePreview` so the **Mobile / Tablet / Desktop** viewport pills render the preview inside a portal-into-iframe at the simulated width. Tailwind responsive variants (`sm:` / `md:` / `lg:`) now evaluate against the simulated device width rather than the admin window width, so every act renderer (hero, manifesto, drop reveal, pieces, materials, waitlist) reflows into its true mobile / tablet / desktop layout. **Fit** remains a no-iframe, full-pane render and is still the default. Added `PREVIEW_RESET_CSS` to neutralize GSAP intro states across all act data attributes (`[data-hero-*]`, `[data-drop-*]`, `[data-oath-*]`, `[data-pieces-*]`, `[data-mm-*]`, `[data-join-*]`) so the preview shows the final layout instead of animation-frozen `opacity:0` states. Iframe width transitions use `cubic-bezier(0.16, 1, 0.3, 1)` over 380 ms for smooth resizes, and a subtle device-frame chrome (rounded panel + dot row + `/drop/preview` caption) wraps the constrained viewports. The iframe scaffold copies parent stylesheets / fonts to its `<head>` and installs a `MutationObserver` to mirror live HMR + active-drop theme updates.
- Files changed: `src/features/admin/drops/DropEditorLivePreview.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass). Manual: switched between Fit / Mobile 390 / Tablet 820 / Desktop 1280 on `/admin/drops/drop_the-oath`; verified the hero collapses to a single-column mobile layout at 390 px (no truncated desktop layout), tablet shows comfortable mid-width spacing, desktop unlocks the multi-column hero grid; scrolled the desktop iframe to confirm manifesto / drop-reveal / pieces acts render their final layouts cleanly without frozen GSAP intro states.
- Notes/debt: Animations themselves (GSAP timelines + ScrollTrigger) don't replay inside the constrained preview iframe because the act components execute in the parent's JS context (`window.matchMedia` / `ScrollTrigger` look at the parent window). The live `/drop/$slug` route is the source of truth for cinematic animation review; the preview prioritizes accurate, jank-free responsive layout QA. If a future iteration wants live animations inside the preview, the simplest path is to inject a `gsap-context` provider keyed to the iframe `contentWindow` so matchMedia / ScrollTrigger bind to the iframe's window — non-trivial but additive.

## 2026-05-16 — CMS UX overhaul: preview-centric drop editor + full color/media pickers
- Summary: Rebuilt the Drop Editor as a **preview-centric** workspace where the live preview claims the wider column on desktop and the editor lives in a compact tabbed side panel (Basics / Theme / Visuals / Acts / Products / SEO). Introduced two new shared CMS field components: `ColorField` (native color wheel + HEX text input + RGB channel inputs + opacity slider, parses & emits hex/rgb/rgba) and `MediaPickerField` (drag-and-drop on desktop, file picker fallback, paste-URL fallback, image+SVG+video support, MIME/size validation, ANVL crest preview as the default for empty logo-like fields, optional per-field "Leave empty (no fallback)" toggle). Wired both components through the drop editor (theme, visuals, SEO OG image), Acts builder (act image + video), Website Layout (header + footer logos), Theme & Brand fallbacks, and Product Editor swatches. Replaced legacy `HexColorPicker` / `ImageFileOrUrlField` usages and removed redundancy: legacy Act I–VI cards are now collapsed under a single "Legacy section copy" disclosure inside `DropLandingActsEditor`, with the Acts builder as the canonical surface. Added field-level validations (slug uniqueness + pattern, color validity, URL-or-path checks, alt text required when emblem set, SEO title/description lengths, schedule + release date validity) surfaced inline next to each input plus red dots on errored tabs; save attempts auto-jump to the first errored section.
- Files changed: `src/shared/lib/color.ts` (new), `src/shared/components/ui/ColorField.tsx` (new), `src/shared/components/ui/MediaPickerField.tsx` (new), `src/shared/components/ui/index.ts`, `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/drops/DropLandingActsEditor.tsx`, `src/features/admin/drops/DropActsBuilderPanel.tsx`, `src/features/admin/drops/drops.editor.validation.ts`, `src/features/admin/components/AdminCard.tsx`, `src/features/admin/products/ProductEditorRoute.tsx`, `src/routes/admin/website-layout.tsx`, `src/routes/admin/theme.tsx`, `docs/design-system.md`, `docs/features/drops-cms.md`, `docs/changelog.md`.
- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass). Manual smoke: open `/admin/drops/$dropId`, confirm preview pillar takes the wider column on `lg+`, theme tab opens the native color picker and shows HEX/RGB/alpha inputs round-tripping to `rgba(...)`, visuals tab accepts drag-and-drop image upload, paste-URL fallback, and toggling "Leave empty" hides the crest preview; SEO tab shows length counters and reds out over-long copy; entering an invalid slug surfaces inline + red tab dot, save auto-jumps to Basics.
- Notes/debt: `MediaPickerField` "Leave empty" is UI-only state today — the storage field stays `''` either way. If the public renderer ever needs to differentiate explicit empty from "use crest", we can add an optional `visualsLeaveEmpty?: Partial<Record<keyof DropVisuals, boolean>>` to `Drop` without breaking persistence (the merge already tolerates extra keys). The legacy Act I–VI form still exists under a disclosure because some marketing renderers still read `DropLandingContent`; once every act renderer reads from `Drop.acts`, the disclosure block can be deleted entirely.

## 2026-05-14 â€” Shop + PDP refactor (Prompt 12)
- Summary: Public `/shop` lists the full visible catalog with URL-driven filters (status, drop, source, color, in-stock size, price), debounced search, and a mobile bottom-sheet filter drawer plus desktop sidebar. PDP adds per-colorway galleries, optional YouTube embed and 3D link placeholder, disabled OOS sizes, accordions, smarter related products, and richer `productJsonLd`. `CommerceClient` gains `getShopListingCatalog`; mapper builds `ProductShopMeta` from admin inventory.
- Files changed: `src/features/products/types/product.types.ts`, `products.mapper.ts`, `products.commerce.ts`, `src/app/config/clients.ts`, `commerceClient.mock.ts`, `src/features/cms/api/cmsClient.mock.ts`, `src/features/admin/landing-cms/landingCms.types.ts`, `src/features/admin/drops/drops.types.ts`, `src/features/products/shop/shopUrlSearch.ts`, `ShopFiltersForm.tsx`, `src/routes/shop/index.tsx`, `src/routes/shop/$slug.tsx`, `src/features/products/pdp/videoEmbed.ts`, `Drawer.tsx`, `AccordionDisclosure.tsx`, `src/shared/components/ui/index.ts`, `ProductCard.tsx`, `ProductGallery.tsx`, `ColorSwatch.tsx`, `SizeSelector.tsx`, `structuredData.ts`, `seoMeta.ts`, `src/routes/admin/index.tsx`, `DropEditorRoute.tsx`, `src/features/admin/hooks/useSaveSuccessFlash.ts`, storefront links (`about`, `size-guide`, `cart`, `checkout/success`, `DropActivePageView`), `docs/features/products-commerce.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: `/shop` â€” filters update URL, mobile Filters drawer, debounced search; PDP â€” color/size availability, video when URL set, accordions; JSON-LD in view-source.
- Notes/debt: Medusa-backed `CommerceClient` must implement `getShopListingCatalog` when swapping off mock data. **Type alignment:** optional meta/Twitter/robots fields on `LandingSeoContent` and `DropSeo`, spread-based `applySeoPatch` in the mock CMS, and a single `AccordionDisclosure` export (removed duplicate `Accordion.tsx`) keep `pnpm typecheck` green with `seoMeta` and PDP accordions. **Admin glue:** dashboard cards derive from `adminNavGroups`; `DropEditorRoute` imports the `Check` icon for save confirmation and uses `useSaveSuccessFlash` for the save button state.

## 2026-05-14 â€” Admin dashboard declutter (Prompt 17)- Summary: Flattened admin navigation into `adminNavItems` with cluster grouping in the sidebar, added `/admin/media` (contextual media guide) and `/admin/settings` (session + local CMS reset danger zone), decluttered the dashboard to card CTAs only, added `useSaveSuccessFlash` for drop/product save buttons, improved drop list and catalog empty states, confirmed product archive via modal, kept drop editor preview prominent (mobile-first column order + sticky card on large screens), and wired `scripts/repatch-admin-route-tree.mjs` into `pnpm dev`, `pnpm build`, and `pnpm typecheck` so `/admin/media` and `/admin/settings` stay registered after TanStack regenerates `routeTree.gen.ts`.- Files changed: `src/features/admin/components/adminNav.ts`, `AdminSidebar.tsx`, `src/features/admin/hooks/useSaveSuccessFlash.ts`, `src/routes/admin/index.tsx`, `src/routes/admin/media.tsx`, `src/routes/admin/settings.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `DropsAdminList.tsx`, `src/features/admin/products/ProductEditorRoute.tsx`, `src/routes/admin/products/index.tsx`, `src/shared/components/ui/Modal.tsx`, `src/routeTree.gen.ts` (via repatch script), `scripts/repatch-admin-route-tree.mjs`, `package.json`, `docs/design-system.md`, `docs/features/drops-cms.md`, `docs/features/products-commerce.md`, `docs/features/seo.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck` (exit 0), `pnpm build` (exit 0); manual: `/admin` cards and sidebar clusters; `/admin/media` + `/admin/settings`; drops list empty + filtered empty; products catalog empty + filtered empty + archive modal; drop editor save flash + preview column; product editor save flash; archive dialog exposes `aria-labelledby` on the dialog surface.- Notes/debt: Router codegen should eventually emit `media`/`settings` without the repatch script; until then keep `scripts/repatch-admin-route-tree.mjs` aligned with `routeTree.gen.ts` anchors.## 2026-05-14 â€” Header/footer/navigation/socials CMS (Prompt 14)- Summary: Hardened global website layout CMS: `/drop/*` nav rows are documented as the active-campaign slot with read-only label/href in admin, save validation requires at least one desktop `/drop/` link, optional â€œAdd /drop/ campaign slotâ€ recovery control, and protection against removing the last header campaign row. Default layout omits `logoStackedSrc` so the public shell uses bundled `AnvlLogoImage`; merge/save normalizes empty logo strings. Added reserved `logoMediaAssetId` on header/footer types, `websiteLayout.nav.ts` helper, and public footer social list semantics (`ul`/`li`, external link `aria-label`) plus nav `aria-label`s on `StickyHeader`.- Files changed: `src/features/admin/website-layout/websiteLayout.nav.ts`, `websiteLayout.types.ts`, `websiteLayout.defaults.ts`, `websiteLayout.service.ts`, `src/features/admin/drops/drops.migrate.ts`, `src/routes/admin/website-layout.tsx`, `src/shared/components/layout/SiteFooter.tsx`, `StickyHeader.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass). Manual: `/admin/website-layout` â€” `/drop/` rows read-only, cannot delete last campaign slot, â€œAdd /drop/ campaign slotâ€ when invalid; save; `/` shows socials from CMS and bundled logo when logo fields empty.- Notes/debt: `saveWebsiteLayoutContent` throws if validation fails â€” admin route pre-validates with `getWebsiteLayoutSaveError`; programmatic callers must pass a layout that includes a `/drop/` header row.## 2026-05-14 â€” Customer auth, account, and orders UI (Prompt 15)- Summary: Added mock storefront `AccountClient` (`accountContracts`, `accountMock`, `accountSession` with sessionStorage-backed demo session pointer), `runtimeClients.account`, and the `storefront-account` feature (Zod + RHF forms, TanStack Query, Zustand session, Lebanon payment labels). Public routes: `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`, and `/account` layout with overview, personal info, addresses (field array), orders list, and order detail. Account/auth pages use `buildSeoMeta` with `noIndex`. Header CMS default includes an Account link. Fixed duplicate `defaultShopUrlSearch` import in `size-guide`, missing `ADMIN_PASSWORD` import in `AdminAuthProvider`, and shop mobile `Drawer` props to match the shared Drawer API.- Files changed: `src/app/config/accountContracts.ts`, `accountMock.ts`, `accountSession.ts`, `clients.ts`, `runtime.ts`, `src/app/seo/meta.ts`, `src/features/storefront-account/*`, `src/routes/account/**`, `src/routes/auth/*`, `src/features/admin/landing-cms/landingCms.defaults.ts`, `src/features/admin/auth/AdminAuthProvider.tsx`, `src/routes/shop/index.tsx`, `src/routes/size-guide.tsx`, `src/routeTree.gen.ts`, `docs/features/auth-accounts-orders.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: sign in with `demo@anvl.lb` / `demo1234`, session survives refresh, `/account` subnav, save personal + addresses, view orders and order detail, sign out; unauthenticated `/account/*` redirects to sign-in with return path; auth pages use `noindex` robots meta.- Notes/debt: Password check is demo-only; `mockAccountSignUp` does not persist passwords. Real auth must be server-side with httpOnly cookies or an IdP. `routeTree.gen.ts` is regenerated by the Vite build.## 2026-05-14 â€” Configurable Acts Builder in Drop Editor (Prompt 07)- Summary: Ship the Drop Editor acts builder (`DropActsBuilderPanel`) for add/remove/reorder, enable/disable, nature and preset selection, and shared copy fields on each act, wired to `Drop.acts` and `landingActSequence`. Added `landingActs.seed.ts` to bootstrap acts from legacy `DropLandingContent`, `landingActs.zod.ts` for per-nature `content` validation helpers, and extended `PublicLandingAct` with `slotKey` and `enabled` in the normalize pipeline. Drop preview uses `composeLandingPageFromDrop` with `PublicLandingActs`; the public homepage skips disabled acts and maps `storytelling` to the manifesto renderer.- Files changed: `src/features/admin/drops/DropActsBuilderPanel.tsx`, `DropLandingActsEditor.tsx`, `DropEditorRoute.tsx`, `acts/landingActs.types.ts`, `acts/landingActs.normalize.ts`, `acts/landingActs.seed.ts`, `acts/landingActs.zod.ts`, `src/features/marketing/public-landing/PublicLandingActs.tsx`, `src/features/cms/api/cmsClient.mock.ts`, `docs/features/drops-cms.md`, `docs/features/acts-builder.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass); manual: `/admin/drops/:id` â†’ Landing acts â€” reorder, disable an act, confirm preview; `/` still renders via `PublicLandingActs`.- Notes/debt: Act copy fields on `Drop.acts` are not yet merged into `DropLandingContent` for the existing marketing components (public copy still comes from the legacy landing object). Media pickers and deep `content` JSON editing are deferred.## 2026-05-14 â€” Shop + PDP refactor (Prompt 12)- Summary: Public `/shop` lists the full visible catalog with URL-driven filters (status, drop, source, color, in-stock size, price), debounced search, and a mobile bottom-sheet filter drawer plus desktop sidebar. PDP adds per-colorway galleries, optional YouTube embed and 3D link placeholder, disabled OOS sizes, accordions, smarter related products, and richer `productJsonLd`. `CommerceClient` gains `getShopListingCatalog`; mapper builds `ProductShopMeta` from admin inventory.- Files changed: `src/features/products/types/product.types.ts`, `products.mapper.ts`, `products.commerce.ts`, `src/app/config/clients.ts`, `commerceClient.mock.ts`, `src/features/cms/api/cmsClient.mock.ts`, `src/features/admin/landing-cms/landingCms.types.ts`, `src/features/admin/drops/drops.types.ts`, `src/features/products/shop/shopUrlSearch.ts`, `ShopFiltersForm.tsx`, `src/routes/shop/index.tsx`, `src/routes/shop/$slug.tsx`, `src/features/products/pdp/videoEmbed.ts`, `Drawer.tsx`, `AccordionDisclosure.tsx`, `src/shared/components/ui/index.ts`, `ProductCard.tsx`, `ProductGallery.tsx`, `ColorSwatch.tsx`, `SizeSelector.tsx`, `structuredData.ts`, `seoMeta.ts`, `src/routes/admin/index.tsx`, `DropEditorRoute.tsx`, `src/features/admin/hooks/useSaveSuccessFlash.ts`, storefront links (`about`, `size-guide`, `cart`, `checkout/success`, `DropActivePageView`), `docs/features/products-commerce.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: `/shop` â€” filters update URL, mobile Filters drawer, debounced search; PDP â€” color/size availability, video when URL set, accordions; JSON-LD in view-source.- Notes/debt: Medusa-backed `CommerceClient` must implement `getShopListingCatalog` when swapping off mock data. **Type alignment:** optional meta/Twitter/robots fields on `LandingSeoContent` and `DropSeo`, spread-based `applySeoPatch` in the mock CMS, and a single `AccordionDisclosure` export (removed duplicate `Accordion.tsx`) keep `pnpm typecheck` green with `seoMeta` and PDP accordions. **Admin glue:** dashboard cards derive from `adminNavGroups`; `DropEditorRoute` imports the `Check` icon for save confirmation and uses `useSaveSuccessFlash` for the save button state.## 2026-05-14 â€” Active drop page + dynamic nav (Prompt 10)- Summary: Finished wiring the public drop experience: root layout injects sanitized active-drop palette CSS on SSR for public routes, `/drop/:slug` uses `runtimeClients.cms.getActiveDrop()` with slug redirect, `DropActivePageView` (hero backdrop, release countdown, product cards to PDP), and route head passes `ogTitle` / `ogDescription` into `buildSeoMeta`. Drop editor adds optional release datetime and hero backdrop fields.- Files changed: `src/routes/__root.tsx`, `src/routes/drop/$slug.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `docs/features/drops-cms.md`, `docs/features/seo.md`, `docs/changelog.md` (plus existing Prompt 10 building blocks already on branch: `dropPaletteStyle.ts`, `DropActivePageView.tsx`, `DropReleaseSection.tsx`, `drops.compose.ts` nav labels, `meta.ts`, `ActiveDropThemeBridge.tsx`, `cms.types.ts`).- Tests/manual checks: `pnpm typecheck`, `pnpm build`; `pnpm test` (no spec files, Vitest exits 1). Manual: `/drop/the-oath` (active slug), nav label matches `drop.title`, view page source for `#anvl-active-drop-theme-ssr` outside `/admin`, product cards open PDPs.- Notes/debt: `getStorefrontProductsForDropSlug` remains synchronous; only the CMS active-drop read is awaited in the route loader.# ChangelogCursor agents must append every completed task here.## Format```md## YYYY-MM-DD ΓÇö Task title- Summary:- Files changed:- Tests/manual checks:- Notes/debt:```## 2026-05-14 — Drop Editor live preview (Prompt 08)- Summary: Added `DropEditorLivePreview` with mobile/tablet/desktop viewport toggles, scoped `DropPreviewThemeScope` for instant palette CSS variables, and `DropEditorPreviewErrorBoundary` so invalid draft renders surface CMS recovery instead of a blank panel. Preview composes with `useDraftActsPipeline` and `publicLandingActsFromDraftActs` so `Drop.acts` order and enable flags match `PublicLandingActs` immediately; unknown act natures use `cmsPreview` warnings. Moved preview memos before the missing-drop early return to satisfy React hook rules.- Files changed: `src/features/admin/drops/DropEditorLivePreview.tsx`, `DropEditorRoute.tsx`, `drops.compose.ts`, `acts/landingActs.normalize.ts`, `PublicLandingActs.tsx`, `docs/features/drops-cms.md`, `docs/features/acts-builder.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: `/admin/drops/:id` — theme + acts + viewport toggles; unsupported act shows amber CMS notice; Save still persists.- Notes/debt: Public homepage compose still uses `landingActSequence` only until the published pipeline opts into draft acts.## 2026-05-14 — Configurable Acts Builder in Drop Editor (Prompt 07)- Summary: Ship the Drop Editor acts builder (DropActsBuilderPanel) for add/remove/reorder, enable/disable, nature and preset selection, shared copy fields, **act-level media** (ActMedia on LandingAct), **animation controls**, expanded per-nature **content Zod schemas** with compact sub-forms (hero/manifesto/storytelling/drop-reveal/product/material/special-event/lookbook/newsletter/final-CTA), and **product-showcase SKU pickers** fed from the admin catalog. Wired to Drop.acts, landingActSequence, and catalogProducts from DropEditorRoute. Bootstrap rows in landingActs.seed.ts now include default nimation. Extended PublicLandingAct with slotKey and enabled in the normalize pipeline. Drop preview uses composeLandingPageFromDrop with PublicLandingActs; the public homepage skips disabled acts and maps storytelling to the manifesto renderer.- Files changed: src/features/admin/drops/DropActsBuilderPanel.tsx, DropLandingActsEditor.tsx, DropEditorRoute.tsx, cts/landingActs.types.ts, cts/landingActs.normalize.ts, cts/landingActs.seed.ts, cts/landingActs.zod.ts, src/features/marketing/public-landing/PublicLandingActs.tsx, docs/features/drops-cms.md, docs/features/acts-builder.md, docs/changelog.md- Tests/manual checks: pnpm typecheck (pass), pnpm build (pass); manual: /admin/drops/:id → Landing acts — edit hero countdown + CTAs in content panel, toggle animation, attach act media, pick SKUs on product showcase, reorder/disable acts, confirm preview; / still renders via PublicLandingActs.- Notes/debt: Top-level act copy and content fields on Drop.acts are stored but **not yet merged** into DropLandingContent for existing marketing components (public copy still comes from the legacy landing object). productIds on a showcase act are persisted only; the live homepage grid still uses the full drop product list until compose consumes act-level SKUs.## 2026-05-14 ΓÇö Drop editor shell (prompt 06)- Summary: Sectioned `/admin/drops/:id` editor with basic info, theme and branding, acts/products/SEO placeholders, save and publish with validation, optional activate-after-save, and schedule fields; `landingActSequence` normalized via `drops.actSequence.ts`.- Files changed: `DropEditorRoute.tsx`, `drops.editor.validation.ts`, `drops.actSequence.ts`, `drops.types.ts`, `drops.service.ts`, `drops.defaults.ts`, `drops.migrate.ts`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: edit drop, validate slug errors, save with confirmation, schedule datetime.- Notes/debt: Acts builder, product pickers, SEO fields, and live preview remain placeholders until later prompts.## 2026-05-14 ΓÇö Drops admin list (CMS shell, prompt 05)- Summary: Implemented the simplified Drops CMS list at `/admin/drops` with responsive table and card layouts, search and status tabs, columns for release date, scheduled activation, product count, and last edited time, and actions wired through `CmsClient` and TanStack Query. Extended `Drop` with `scheduled` status plus `releaseDate` and `scheduledActivationAt`; the drops service supports duplicate, archive, schedule, and safer active selection when deleting or archiving.- Files changed: `src/features/admin/drops/drops.types.ts`, `drops.defaults.ts`, `drops.service.ts`, `DropsAdminList.tsx`, `dropsListUi.store.ts`, `useAdminDropsListQuery.ts`, `src/features/cms/types/adminDrops.types.ts`, `src/app/config/clients.ts`, `src/features/cms/api/cmsClient.localStorage.ts`, `src/features/cms/api/cmsClient.seed.ts`, `src/routes/admin/drops/index.tsx`, `DropEditorRoute.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `pnpm run typecheck`, `pnpm run build`; manual: `/admin/drops` search and tabs, activate with confirmation, schedule, archive, delete, duplicate, mobile card layout.- Notes/debt: Automatic activation at `scheduledActivationAt` is not implemented (storage and admin UI only). Admin drops APIs live on `CmsClient` (not `SeoClient`) alongside runtime SEO split from prompt 03.## 2026-05-14 ΓÇö Public layout active drop theme (prompt 04)- Summary: Added `ActiveDropThemeProvider`, shared `dropPaletteStyle` helpers, `CmsClient.getActiveDrop()`, SSR `<style>` injection on the root route for public pages, and client-side sync when drops change; admin routes skip global theme injection. Removed global `:root` mutation from `AppProviders` / `ActiveDropThemeBridge` in favor of the provider + head pipeline.- Files changed: `src/app/config/clients.ts`, `src/features/cms/api/cmsClient.localStorage.ts`, `src/features/cms/api/cmsClient.seed.ts`, `src/features/admin/drops/dropPaletteStyle.ts`, `src/app/providers/ActiveDropThemeProvider.tsx`, `src/app/providers/ActiveDropThemeBridge.tsx`, `src/app/providers/AppProviders.tsx`, `src/routes/__root.tsx`, `docs/design-system.md`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass), `pnpm test` (no test files in repo; exits 1). Manual: load `/` and confirm themed surfaces; open `/admin` and confirm default/base chrome without campaign `:root` override; change active drop in admin and return to storefront to confirm palette updates.- Notes/debt: Future CMS adapters must implement `getActiveDrop()` with the same SSR-safe semantics as seed/localStorage clients.## 2026-05-14 ΓÇö Runtime client interfaces and seed/localStorage adapters- Summary: Introduced `SeoClient` and `SiteSettingsClient`, moved SEO off `CmsClient`, and added `createRuntimeClients({ isServer })` so SSR uses deterministic seed adapters while the browser uses localStorage-backed admin services. Shop index route demonstrates `runtimeClients.seo` in the loader. Removed legacy `cmsClient.mock` / `commerceClient.mock` modules. Updated architecture, drops CMS, SEO docs, and README.- Files changed: `src/app/config/clients.ts`, `src/app/config/runtime.ts`, `src/features/cms/api/*` (seed snapshots, `resolveSeoByPath`, CMS/SEO/site-settings seed + localStorage adapters), `src/features/products/api/commerceClient.seed.ts`, `src/features/products/api/commerceClient.localStorage.ts`, `src/features/admin/drops/DropsAdminList.tsx` (build stub), `src/routes/shop/index.tsx`, removed mock commerce/CMS clients, `docs/architecture.md`, `docs/features/drops-cms.md`, `docs/features/seo.md`, `README.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`, `pnpm vitest run --passWithNoTests` (no unit tests in repo yet); manual: `/shop` document title and meta description align with `SeoClient` output on full page load and client navigation.- Notes/debt: Analytics and payment clients remain mocks; other routes can adopt `SeoClient` incrementally; `runtimeClients.siteSettings` is ready for future header/footer loader refactors. Minimal `DropsAdminList` stub added because `origin/cms` imported the module without shipping the implementation (unblocks `pnpm build`).## 2026-05-14 ΓÇö Core CMS/catalog Zod schemas and Drop 01 seed- Summary: Added canonical Zod 4 schemas and inferred TypeScript types for drops, landing acts, catalog commerce products, SEO documents, money/media, navigation, and site settings; added validated seed for Drop 01 ΓÇö The Oath and three catalog placeholders (Oversized Tee, Stringer, Compression Tee) using ANVL brand tokens.- Files changed: `src/features/drops/**`, `src/features/landing/**`, `src/features/seo/**`, `src/features/products/schemas/commerce.schema.ts`, `src/features/products/types/commerce.types.ts`, `src/shared/schemas/**`, `src/shared/types/**`, `src/content/seed/drop-01-the-oath.seed.ts`, `docs/architecture.md`, `docs/changelog.md`, `docs/features/drops-cms.md`, `docs/features/acts-builder.md`, `docs/features/products-commerce.md`, `docs/features/seo.md`- Tests/manual checks: `pnpm exec tsc --noEmit` (pass); `pnpm build` (pass). `pnpm test` reports no test files in the repository.- Notes/debt: Storefront `Product` in `src/features/products/types/product.types.ts` remains the shop presentation model; canonical commerce document is `CatalogProduct` until adapters unify the two.## 2026-05-14 ΓÇö Prompt 01: Audit current app (architecture map)- Summary: Documented the as-built folder layout, all public and admin routes, CMS vs hard-coded surfaces, SSR/hydration risks, browser-only touchpoints, GSAP/Lenis/Framer usage, cart-to-checkout flow, a small-task refactor order, and high-risk files. Linked the inventory from `docs/architecture.md`.- Files changed: `docs/technical-debt.md`, `docs/architecture.md`, `docs/changelog.md`- Tests/manual checks: `pnpm build` (see task verification).- Notes/debt: No application code changes; audit reflects TanStack Router tree and `src/` layout at audit time.## 2026-05-14 ΓÇö Add project documentation and agent prompts- Summary: Added `AGENTS.md` at the repository root, populated `docs/` with core and feature documentation, and added the numbered Cursor prompt library under `docs/prompts/` per the documentation index.- Files changed: `AGENTS.md`, `docs/README.md`, `docs/*.md` (core docs), `docs/features/*.md`, `docs/prompts/*.md`, `README.md`, `docs/changelog.md`- Tests/manual checks: Verified file tree under `docs/` and `AGENTS.md` presence; no application code changes.- Notes/debt: Brand PDF/DOCX assets were already present under `docs/`; new markdown files sit alongside them.## 2026-05-14 ΓÇö Runtime client interfaces + seed / browser adapters (prompt 03)- Summary: Added `SeoClient` and `SiteSettingsClient`, extended `CmsClient` with `getActiveDrop()`, and introduced `createRuntimeClients({ isServer })` so SSR uses deterministic seed adapters while the browser uses localStorage-aligned services. `/shop` now loads SEO via `runtimeClients.seo`. Removed legacy `cmsClient.mock` / `commerceClient.mock` in favor of `*.seed.ts` and `*.localStorage.ts` modules.- Files changed: `src/app/config/clients.ts`, `src/app/config/runtime.ts`, `src/features/cms/api/*`, `src/features/products/api/commerceClient.*.ts`, `src/routes/shop/index.tsx`, `README.md`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `pnpm typecheck`, `pnpm build`, `pnpm test`; manual: open `/shop`, view page source or devtools for meta title/description/canonical from `getSeoByPath('/shop')`.- Notes/debt: Analytics and payment remain mocks; `runtimeClients.siteSettings` is ready for future header/footer loader refactors.## 2026-05-14 ΓÇö Drop editor shell (prompt 06)- Summary: Scrollable drop editor shell with Basic info, Theme & branding, Acts/Products/SEO placeholders, Save & publish (validation, schedule, activate-after-save, modal, success flash), and preview placeholder. Added `scheduled` status and `scheduledActivationAt` on `Drop` with merge persistence. Added `drops.actSequence` and default `landingActSequence` on seeded/migrated drops so storage merges stay type-safe.- Files changed: `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/drops/drops.editor.validation.ts`, `src/features/admin/drops/drops.types.ts`, `src/features/admin/drops/drops.service.ts`, `src/features/admin/drops/drops.actSequence.ts`, `src/features/admin/drops/drops.defaults.ts`, `src/features/admin/drops/drops.migrate.ts`, `docs/features/drops-cms.md`, `docs/changelog.md`- Tests/manual checks: `npm run typecheck` (no errors in drop editor paths); manual: `/admin/drops/$id` ΓÇö invalid save shows errors; confirm save shows toast; schedule persists ISO in localStorage.- Notes/debt: Acts builder, product assignment, and SEO forms are placeholders per prompt.