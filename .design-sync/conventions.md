# ANVL Design System — conventions

## What this is

The real ANVL storefront + admin CMS component kit (`src/shared/components/ui/`), synced from
its live source — the same 22 components ANVL ships. This is not a demo library; every card
here is a real, reusable component with the same visual language, states, and behavior as
production.

## Wrapping requirement (read this before composing anything)

**Every component in this system depends on CSS custom properties set at runtime, not static
CSS.** The token values (`--color-*`, `--shop-*`, `--hero-*`, spacing, motion durations) come
from `themeConfigToCssVars()` and are applied to `document.documentElement` by
`SiteThemeProvider` — a React provider, not a stylesheet. Any real usage of this design system
in an app must be wrapped in it:

```tsx
import { SiteThemeProvider } from '@/app/providers/SiteThemeProvider'

<SiteThemeProvider theme={publishedTheme} fonts={publishedFonts}>
  <App />
</SiteThemeProvider>
```

Without it, components render with zero token values — no background, no accent color, no
border color. (The preview used to *build and verify this sync* uses a lightweight stand-in,
`DesignSystemPreviewProvider`, that hardcodes the default theme — that stand-in is
sync-tooling only, never copy it into a real app.)

Components that navigate (`SafeLink`, `ProductCard`) additionally expect a TanStack Router
context (`<RouterProvider>` / route tree) to resolve `<Link>` — they are not usable fully
standalone outside a routed app shell.

## Where the truth lives

- **Token source of truth**: `src/features/cms/config/cmsSiteConfig.zod.ts` — a 15-key editable
  palette (`background`, `foreground`, `card`, `cardForeground`, `muted`, `mutedForeground`,
  `border`, `primary`, `primaryForeground`, `accent`, `accentForeground`, `ring`, `destructive`,
  `success`, `warning`) run through `themeConfigToCssVars()`, which deterministically derives
  every `--color-*` / `--shop-*` / `--hero-*` / `--particle-*` / `--scrollbar-*` variable. There
  is no per-page or per-component palette override — one theme, one derivation, consumed
  everywhere (storefront, admin, and the WebGL/3D scenes).
- **Bootstrap fallback / theme scaffolding**: `src/styles.css` — `:root[data-theme="oath-dark"]`
  and `:root[data-theme="bone-light"]` blocks provide the first-paint values before
  `SiteThemeProvider`'s effect runs (SSR sets these inline already; this is the belt-and-braces
  fallback).
- **Shop-specific token bridge**: `/shop` and PDP surfaces theme from a separate `--shop-*`
  layer (same 15-key palette, different derivation) so the shop experience can re-skin
  independently. A `[data-surface="shop"]` CSS scope block bridges `--color-*` names to
  `--shop-*` values within that subtree — components never need a `surface` prop, they just
  read `--color-*` as normal and the DOM position determines which values they see.

## Styling idiom

- Never hardcode a color, spacing, or radius value in a component — always reference the CSS
  variable (`var(--color-accent)`, `var(--anvl-content-max)`, etc.) so a theme change repaints
  every component without a rebuild.
- `cn()` (clsx + tailwind-merge, `src/shared/lib/cn.ts`) for all conditional/merged class
  composition.
- `cva` (class-variance-authority) for every component with variants — the pattern used
  throughout this kit, not ad hoc ternaries in className strings.

## Prop conventions (consistent across the kit — don't invent new names)

- **`variant`** — the visual style branch (e.g. `Button`: `primary | secondary | ghost |
  destructive | success`; `IconButton`: `default | ghost | overlay`). Changes color/fill
  language, not size or spacing.
- **`size`** — the physical scale (`sm | md | lg`, plus component-specific extras like
  `Button`'s `icon`). Changes dimensions/touch target, not color.
- **`density`** — `comfortable | compact`. Comfortable is the storefront's roomier proportions
  (e.g. `Button`'s gradient pill); compact is the admin CMS's denser chip/form proportions
  (same tokens, tighter shape/sizing). Present on `Button`, `Input`, `Textarea`, `Select`. This
  is what lets one component serve both the storefront and the admin CMS without a parallel
  component tree.
- **`tone`** — status/semantic coloring on non-interactive elements (`Badge`: `neutral | live |
  scheduled | archived | success | danger | accent`).
- Every interactive control ships the `focus-ring` utility class and meets the ≥44×44px touch
  target at default size — do not shrink below that when composing new layouts.

## Build snippet (idiomatic real usage)

```tsx
import { Button, Input, FormField } from '@/shared/components/ui'

function ExampleForm() {
  return (
    <form className="flex flex-col gap-4">
      <FormField label="Email" hint="We'll never share it.">
        <Input type="email" placeholder="you@company.com" />
      </FormField>
      <Button type="submit" variant="primary" size="md">
        Continue
      </Button>
    </form>
  )
}
```

All of this renders correctly only inside a `<SiteThemeProvider>` — see "Wrapping requirement"
above.
