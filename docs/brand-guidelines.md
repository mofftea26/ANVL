# Brand Guidelines

## Identity

| | |
|---|---|
| **Brand name** | ANVL Athletics |
| **Tagline** | Forged Under Pressure |
| **Drop 01** | The Oath |
| **Origin** | Lebanon-first premium bodybuilding gymwear |
| **Brand meaning** | A body built through pressure, repetition, discipline, and heat — like metal forged in a forge |

## Brand Personality

- **Premium** — not budget, not mid-tier. High-end product presentation.
- **Industrial** — forge-inspired textures, steel tones, heavy materials aesthetic.
- **Cinematic** — storytelling through motion, sequence, and visual drama.
- **Warrior-inspired** — discipline, sacrifice, oath-taking. Not fantasy, not costume.
- **Disciplined** — clean, structured, controlled. Not chaotic or playful.
- **Dark** — predominantly dark with bone/steel light accents.

**Avoid:**
- Cheap gaming or neon aesthetics (unless campaign explicitly calls for it)
- Generic gym-template design (stock fitness photography feel)
- Childish or playful energy
- Over-decorative ornamentation without purpose
- Aggressive military/military-surplus look — keep it disciplined, not militaristic

## Color Palette

### Base (always preserved)

| Name | Value | Usage |
|---|---|---|
| `--anvl-black` | `#0B0B0C` | Page background |
| `--anvl-dark-steel-grey` | `#1D1F21` | Surfaces, cards |
| `--anvl-washed-charcoal` | `#34373A` | Muted surfaces, borders |
| `--anvl-graphite` | `#5B5E61` | Disabled states, subtle text |
| `--anvl-bone` | `#E7E4DF` | Primary light accent, headings |

### Semantic tokens (theme-switchable)

These are emitted from the **15-token normalized palette** by the active CMS theme (`oath-dark` or `bone-light`). The palette is the single source of truth for CMS + storefront + WebGL — there is **no per-drop palette override**. See `docs/design-system.md` → "Theme palette — one normalized token set" for the full token list and derivation.

| Token | Purpose |
|---|---|
| `--color-bg` | Page background |
| `--color-surface` | Card/panel background |
| `--color-surface-elevated` | Elevated surface |
| `--color-line` | Dividers, subtle borders |
| `--color-text` | Body text |
| `--color-text-muted` | Secondary text |
| `--color-heading` | Heading color |
| `--color-accent` | Primary accent (CTA emphasis, highlights) |
| `--color-hero-glow` | Ambient glow effects |

### Themes

- `oath-dark` — default. Deep black background, bone/steel text. The primary ANVL storefront experience.
- `bone-light` — future editorial/lookbook mode. Light bone background, dark text.

The active theme is chosen site-wide in `/admin/theme`; it is not overridden per drop.

## Typography

| Role | Font | Style |
|---|---|---|
| Headings | Anton | Heavy condensed uppercase |
| Body | Sora | Clean modern sans (400, 500, 600, 700) |
| Display accent | Cinzel | Heraldic inscriptional caps — accent moments only |

**Font tokens** (self-hosted via `@fontsource/*`, preloaded in `__root.tsx`):
- `--font-heading: "Anton", "Oswald", "Impact", sans-serif`
- `--font-sans: "Sora", ui-sans-serif, system-ui, sans-serif`
- `--font-display: "Cinzel", "Trajan Pro", "Anton", serif`

**Typography scale (responsive, mobile-first):**
- Hero / page titles: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl`
- Section titles: `text-3xl sm:text-4xl md:text-5xl`
- Subsection: `text-2xl sm:text-3xl`
- Body: `text-base` (16px minimum, especially on mobile — prevents iOS zoom)
- Caption/muted: `text-sm`

**Rules:**
- Headings should feel heavy, condensed, powerful
- Never use light font weights for headings
- Keep body text clean and readable — Sora is chosen for legibility at all sizes
- Avoid more than 3 font weight variations on a single page

## Logo System

The ANVL logo system has multiple variants, all as inline SVG components driven by `currentColor` (so they respect the active theme):

| Component | Use case |
|---|---|
| `AnvlWordmark` | Primary header wordmark |
| `AnvlFullLockup` | Wordmark + tagline combination |
| `AnvlCrest` | Icon mark / emblem |
| `AnvlCompactMark` | Small format mark |
| `AnvlOathShape` | Drop 01 Oath campaign graphic |
| `AnvlStacked` | Stacked lockup (mark above wordmark) |

**Rules:**
- The global ANVL logo in the header and footer must **never** change per drop or campaign.
- Campaign logos/emblems are drop-section-only visuals. They appear inside act sections, not in the navigation.
- Use the appropriate variant for the context — wordmark for nav, crest for icon use, full lockup for large format.
- Never distort, recolor arbitrarily, or apply effects to the base ANVL logo.

Raster exports live in `public/brand/` for use in OG images, emails, and downloadables.

## Design Language

### Spacing rhythm

- Sections use `--anvl-section-py: 4rem` vertical padding
- Content gaps use `--anvl-content-gap: 1.5rem`
- Standard content column max-width: `--anvl-content-max: 80rem`
- Wide content (full-bleed sections): `--anvl-content-max-wide: 96rem`

### Surface hierarchy

- Page background (`--color-bg`) — darkest
- Surface (`--color-surface`) — cards, panels, slightly lighter
- Elevated surface (`--color-surface-elevated`) — modals, tooltips, dropdowns
- Lines/borders (`--color-line`) — subtle, semi-transparent

### Interaction language

- CTAs: decisive, clear, heavy. Primary buttons use bone/accent color fill.
- Hover states: subtle glows, opacity shifts, scale micro-animations
- Focus rings: visible, clearly branded (not default browser blue)

### Industrial details

Used sparingly and purposefully:
- Grain overlays (`GrainOverlay` component) for texture
- `IndustrialDivider` for section separators
- Metal-inspired border treatments
- Forging/stamping motion metaphors in animations

### Layout patterns

- **Cinematic hero** — full-viewport, GSAP ScrollTrigger, desktop storytelling
- **Editorial grid** — curated asymmetric product/content grids
- **Ledger / stamp** — structured oath/manifesto layouts with heavy typography
- **Narrative scroll** — chapter-by-chapter brand storytelling
- **Product rail** — clean horizontal product presentation

## Photography / Visual Direction

- Products shot on dark industrial backgrounds
- Hard lighting, shadows, forged metal aesthetics
- Athletes should look disciplined and powerful, not happy-go-lucky or casual gym-bro
- No stock fitness photography — everything should feel owned and on-brand
- Placeholder: `public/brand/placeholder-product.svg`

## Campaign / Drop Identity

Each drop has its own visual identity that **extends** the core brand without replacing it:

| Element | Per drop? | Rule |
|---|---|---|
| Global nav logo | No | Always the base ANVL mark |
| Theme palette | No | One global CMS theme (15-token palette) set in `/admin/theme` |
| Campaign emblem | Yes | Used in section visuals / asset slots only |
| Font system | No | Anton + Sora + Cinzel are site-wide; set in `/admin/fonts`, not per drop |
| Background image/video | Yes | Per-landing-key asset slots (`/admin/assets`) |
