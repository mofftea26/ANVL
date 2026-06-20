# Design System

## Brand direction
ANVL is premium bodybuilding gymwear: dark, forged, disciplined, industrial, warrior-inspired, and refined.

## Warrior accent layer (2026-06-06)
An **additive** layer on top of the locked palette/fonts — it does not replace bone/steel/black or Bebas/Manrope.

- **Ember tokens** (both themes): `--color-ember` (forged bronze), `--color-ember-bright`, `--color-ember-soft`. Decorative only — banner hardware, ember glows, rules, small labels. Keep ember off long body copy (use it where AA contrast holds).
- **Heraldic display:** `--font-display` → Cinzel (self-hosted `@fontsource/cinzel`, preloaded in `__root.tsx`). Apply via `.anvl-display` — inscriptional caps for *accent moments only* (eyebrows, numerals, banner labels). Bebas (`.anvl-heading`) stays the workhorse. No blackletter (avoids costume).
- **Utilities:** `.anvl-ember-rule` (glowing hairline divider), `.anvl-ember` (drifting ember particle), `.anvl-banner-sway` (idle hang sway). All motion auto-disabled under `prefers-reduced-motion`.
- **Primitives** (`src/shared/components/premium/`): `WarBanner` — 3D medieval hanging banner (forged crossbar + gonfalon `clip-path` + ember frame) that wraps an image or a duotone + emblem placeholder; `ForgeAtmosphere` — persistent ember/grain backdrop (deterministic ember field, SSR-safe) used to make stacked scenes read as one continuous environment. `SectionEyebrow` has an `ember` variant.
- **`ProductCard`** (`src/shared/components/ui/`, 2026-06-12) is the `WarBanner` married to a fixed-structure info plate (role, name, price/compare, colorways, "View piece"); the status chip hangs on the crossbar as a heraldic label. The banner fabric is a fixed `aspect-[3/4]` and the name is `line-clamp-2` over a reserved `min-h`, so every card in a grid is exactly the same size. Used by `/shop` and PDP related products.
- **One global CMS theme** (per-page palette overrides removed 2026-06-27): the storefront wears a single published CMS theme — there is no per-landing-page palette. Components use the derived `--color-*` tokens (e.g. `--color-highlight*`); the Drop 01 landing's WebGL emblem + dust read the **same** CSS vars via `readOathBrandColors()`, so the 3D layer always matches the active theme.

## Theme model
Use CSS variables so the active drop can theme the full storefront without rewriting styles.

Base variables:
```css
:root {
  --color-bg: #0B0B0C;
  --color-surface: #1D1F21;
  --color-surface-muted: #34373A;
  --color-text: #E7E4DF;
  --color-text-muted: #A7A29A;
  --color-accent: #E7E4DF;
  --color-border: rgba(231, 228, 223, 0.16);
  --font-heading: 'Bebas Neue', Impact, sans-serif;
  --font-body: 'Manrope', system-ui, sans-serif;
}
```

Per active drop, update:
- background colors
- surface colors
- accent color
- glow color
- selection color
- campaign font override if needed
- campaign emblem/watermark references

Never change the official header/footer ANVL logo per drop. Campaign logos/emblems live inside drop sections only.

## Theme palette — one normalized token set (2026-06-20)
The theme is driven by **one small, conventional design-system palette** — the single editable/serialized source of truth that both the CMS editor and the storefront + WebGL landing page read, so they cannot diverge. Source of truth: `themePaletteSchema` (`THEME_PALETTE_KEYS`) in `src/features/cms/config/cmsSiteConfig.zod.ts`, emitted to `:root` by `themeConfigToCssVars` (the single map feeding SSR first-paint inline CSS, `SiteThemeProvider`, and the editor preview).

**The 15 editable tokens** (the only thing the CMS theme editor shows):
`background`, `foreground`, `card`, `cardForeground`, `muted`, `mutedForeground`, `border`, `primary`, `primaryForeground`, `accent`, `accentForeground`, `ring`, `destructive`, `success`, `warning`.

For Drop 01: `primary` is the champagne commerce accent, `accent` is the forge-copper storytelling highlight; the dark identity is preserved.

**Everything else is derived deterministically** from those tokens by `themeConfigToCssVars` — never edited or stored separately:
- **Brand aliases**: `--anvl-black/-dark-steel-grey/-washed-charcoal/-graphite/-bone/-signature` + `--color-graphite` (so brand graphics + the WebGL scene follow the theme).
- **Foundation/typography**: `--color-bg/-surface/-surface-soft/-surface-elevated/-line/-text/-fg/-text-muted/-heading` (headings share the foreground).
- **Accents/effects**: `--color-accent` (= primary), `--color-highlight/-highlight-bright/-highlight-soft` (= accent + derived), `--color-chip`, `--color-hero-glow`, `--hero-*`, `--particle-primary/-secondary/-highlight/-glow`, `--scrollbar-track/-thumb/-thumb-hover/-thumb-active`, `--nav-scrim`.
- **Foregrounds**: `--color-on-accent/-on-highlight/-on-highlight-bright/-on-surface` — contrast-chosen, never "white by default".
- **Status**: `--color-success/-warning/-danger/-info/-focus-ring/-disabled/-overlay` (+ `--color-on-success/-warning/-danger`).
- **Motion (§18)**: `--motion-duration-fast/-normal/-slow`, `--motion-ease-standard/-emphasized/-exit`.

The emitted `--color-*`/`--hero-*`/`--particle-*`/`--scrollbar-*` CSS-variable contract is unchanged from the previous (sprawling) model — only the *editable* palette shrank, so existing consumers keep working.

**Back-compat**: `themePaletteSchema`'s preprocess maps legacy keys (`colorBg→background`, `colorAccent→primary`, `colorHighlight→accent`, pre-rename `colorEmber*` too) and fills gaps from the dark identity, so historical `theme_config` keeps parsing with its custom colors.

**Ten brand presets** ship in `src/features/cms/config/themePresets.ts` (`ANVL_PRESETS`): `oath-obsidian` (recommended for Drop 01), `blackened-champagne`, `oxblood-covenant`, `burnished-bronze`, `cold-forged-steel`, `ashen-olive`, `midnight-cobalt`, `blackened-teal`, `iron-violet`, `bone-relic` (light). `parseThemeLibrary` always injects them (`withBuiltInPresets`); the live default is unchanged until switched in `/admin/theme`.

`finalizeThemePalette` fills the muted surface + foregrounds + ring from a preset's own colors (explicit values win), and `finalizeThemeParticles/Scrollbar` (`themeTokens.ts`) derive effect colors. Color math (`mix`, `withAlpha`, `bestForeground`, `contrastRatio`, `suggestAccessibleColor`) lives in `src/shared/lib/color.ts`.

Product media stays neutral (§21) — themes color the interface, not product photography.

## Active drop storefront theming
- **CSS variables**: `DropThemePalette` maps to shared custom properties (`--color-bg`, `--color-surface`, `--color-accent`, `--color-hero-glow`, etc.) via `dropPaletteToCssVarsRecord` / `serializeDropPaletteForRootStyle` in `src/features/cms/theme/dropPaletteStyle.ts`.
- **SSR + client**: The public shell wraps storefront routes in **`ActiveDropThemeProvider`**, which renders `<style id="anvl-active-drop-theme">` from the active drop (root loader on SSR) and keeps that tag updated when local CMS drop storage changes (**`anvl:drops:change`**). Admin routes are excluded so CMS chrome stays on base tokens.
- **Preview**: Admin-only previews use `DropPreviewThemeScope`, which applies palette variables on a scoped element, not the global brand header/footer mark.

## Scrollbars
- Global rails live in **`src/styles.css`**: **`scrollbar-width: thin`** + **`scrollbar-color`** (Firefox) and matching **`::-webkit-scrollbar-*`** rules (Chromium/WebKit, incl. a **`:active`** thumb). Colors come from the active theme via **`--scrollbar-track/-thumb/-thumb-hover/-thumb-active`** (emitted by `themeConfigToCssVars`, finalized per preset). The legacy **`--anvl-scrollbar-*`** names remain as aliases. The bootstrap `:root` derives them from `--color-*` via `color-mix` before the SSR projection paints concrete values.
- **`color-scheme`** on **`:root`** is **`dark`** by default and switches to **`light`** for **`data-theme="bone-light"`** so native controls match the active palette.
- Thumb hover uses a short **`background-color`** transition; **`prefers-reduced-motion: reduce`** tightens that duration.

## Mobile-first rules
- Mobile: minimal motion, no scroll-jacking, no heavy pinned GSAP sequences, compressed media, simple product cards, sticky bottom cart/CTA when useful.
- Tablet/Desktop: cinematic GSAP sections, layered visuals, scroll reveals, parallax, video backgrounds when optimized.
- Always support `prefers-reduced-motion`.

## Storefront chrome (`PremiumNav`)
- **`PremiumNav`** (`src/shared/components/layout/PremiumNav.tsx`) replaces `StickyHeader` on all storefront routes.
- **Cinematic phase:** transparent topbar + optional desktop side rail (section progress from `cinematicConfig.sections`).
- **Commerce phase:** solid blurred topbar with full CMS nav links, cart badge, and mobile drawer.
- **`AnnouncementRail`:** phase-aware styling for `navigation.announcement`.

## Premium layout primitives
- `src/shared/components/premium/` — `SectionShell`, `PageHero`, `ContentPanel`, `SectionEyebrow`, `CTAGroup`, `BrandBadge`.
- Static pages use `ContentPage` (wraps `PageHero` + `ContentPanel`).
- Spacing tokens: `--anvl-section-py`, `--anvl-content-gap`.

## Component style
- Premium spacing, fewer cramped panels.
- Large preview surfaces in CMS.
- Strong hierarchy: title, status, action.
- Use cards only where they help grouping; avoid dashboard clutter.
- The drop editor is **preview-centric**: the live preview claims the wider column on desktop while the editor lives in a compact tabbed side panel. Other admin pages may stay editor-only or two-column at their discretion.
- Admin navigation is grouped (Workspace, Campaigns, Catalog, Site) with compact badges; the dashboard mirrors the same destinations as cards.

## Shared CMS field components
- `ColorField` (`src/shared/components/ui/ColorField.tsx`) — full color picker with an in-panel **SV + hue** control (**`react-colorful`** `RgbColorPicker`: saturation/value square + hue slider; keyboard nudges on the library’s interactive surfaces), plus a HEX text input, three R/G/B numeric channels, and an opacity slider with numeric companion (no native color popover as the primary control). Emits `#rrggbb` when alpha is 1, `rgba(r, g, b, a)` otherwise. Parsing accepts hex (3/6/8), `rgb()`, `rgba()`, and percentage alpha tokens. **Default layout**: large swatch tile (checkerboard under alpha) with mono hex copy + **`IconButton`** opening a **non-modal** popover for precision controls; **`inline`** keeps the compact “all controls visible” layout (e.g. product swatch rows).
- `MediaPickerField` (`src/shared/components/ui/MediaPickerField.tsx`) — single picker for **images, SVGs, and videos**. Supports drag-and-drop on desktop plus the native file picker, and falls back to a paste-URL/public-path input. Validates MIME and size, embeds small files as data URLs. Empty values default-preview the bundled ANVL crest; pass `fallback="none"` for fields that should genuinely render nothing, or wire `onLeaveEmptyChange` to expose a "Leave empty (no fallback)" checkbox per field.
- `parseColor` / `rgbaToCss` / `rgbaToClipboardHex` (`src/shared/lib/color.ts`) — shared utilities used by `ColorField` so RGB/HEX/RGBA round-trips are lossless; clipboard format uses `#RRGGBB` or `#RRGGBBAA` when alpha is below 1.

## Media rules
- Use responsive images.
- Lazy-load below-the-fold media.
- Use poster images for videos.
- Avoid autoplay with sound.
- Use optimized formats where possible.
