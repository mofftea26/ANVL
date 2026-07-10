# Design-sync notes — ANVL Design System

## [GENERAL] Storybook build vs. TanStack Start
Storybook's Vite builder auto-merges the app's root `vite.config.ts`. ANVL's `tanstackStart()`
plugin expects a full SSR build and crashes Storybook ("multiple entries detected" /
"Cannot get config before root is resolved"). Fixed in `.storybook/main.ts`'s `viteFinal` by
filtering `viteConfig.plugins` for anything matching `/tanstack|devtools|visualizer/i` —
note `tanstackStart()` returns an *array* of sub-plugins, so plugins must be flattened
(`Promise.all(...).flat(Infinity)`) before the name-based filter runs, or nested entries slip
through.

## [GENERAL] Component export detection needs a real `.d.ts` + `publishConfig.types`
The converter's `exportedNames()`/`findTypesRoot()` (`.ds-sync/lib/dts.mjs`) read
`package.json`'s `types`/`typings`/`publishConfig.types` field to locate the compiled
declarations for the export scan — NOT the `--entry` CLI flag. A repo with no such field
(true for ANVL's `anvl-store`, a full app, not a published package) scans zero exports even
though the JS bundle builds fine. Fix: generate real declarations for the UI kit only
(`tsconfig.lib.json` scoped to `src/shared/components/ui/**`, excluding `__tests__` and
`*.stories.tsx`), set `publishConfig.types` to the emitted `index.d.ts`, and make sure the
compiled `.js` entry sits adjacent to that `.d.ts` (same output directory) — the converter
correlates them by path, so pointing `--entry` at raw TS source with declarations emitted to a
different tree does not work.

## [GENERAL] ANVL's tokens/router are runtime-injected, not static
Two things are missing from a bare Storybook/static render of ANVL components:
- CSS custom properties (`--color-*`, `--shop-*`, etc.) are injected at runtime by
  `SiteThemeProvider` (Supabase/localStorage-backed), not present in static `styles.css`.
- `ProductCard`/`SafeLink` render `<Link>`, which needs TanStack Router context.

Fixed by `src/shared/devPreview/DesignSystemPreviewProvider.tsx` — wraps preview children in a
minimal in-memory TanStack Router (`createMemoryHistory`) and, in a `useEffect`, computes
`themeConfigToCssVars(DEFAULT_THEME_CONFIG)` + font vars and sets them directly on
`document.documentElement`. Wired via `.design-sync/config.json`'s `cfg.provider.component` +
`cfg.extraEntries`. The SAME component is used as a Storybook decorator in
`.storybook/preview.tsx` so the reference Storybook doesn't crash on `<Link>` either — decorator
auto-bundling is skipped for the design-sync build itself since `cfg.provider` is explicit, so
this is safe/non-duplicative.

Passing children through the router's root route required real React Context
(`createContext`/`useContext`) — a first attempt used a mutable module-level variable to smuggle
children into the route component, which is not reactive across multiple provider instances and
silently rendered nothing.

## [GENERAL] Preview background must match Storybook's configured background
`.storybook/preview.tsx` sets an `oath-dark` background parameter, but the design-sync preview
harness renders on the page's default (white) background — no explicit bg was ever set. Several
components read as broken purely from missing contrast: ghost-variant button text, accent-tone
badges, and translucent input fills are effectively invisible on white but correct on
`--color-bg`. Fixed globally (not per-component) inside `DesignSystemPreviewProvider`'s effect:
set `document.documentElement.style.backgroundColor`, `document.body.style.backgroundColor` to
`var(--color-bg)`, plus `color-scheme: dark` and `min-height: 100vh` on body. Any future
"washed out" or "invisible" grading finding should be checked against page background before
assuming a component bug.

## Accepted, non-blocking warnings
- `[FONT_MISSING]` for fallback font names in the CSS `font-family` stack that are never
  actually selected (Anton/Sora/Cinzel do ship and are the ones used).
- `[RENDER_THIN]` on Drawer's `cardMode: single` wrapper — the wrapper's own capture height is
  short, but the actual drawer panel renders correctly (screenshot-verified); specific to the
  compare harness's card sizing for that override, not a real component issue.

## Known component-level overrides (see `.design-sync/config.json`)
- `AccordionDisclosure`: `cardMode: column` — its stories stack vertically better than the
  default grid.
- `Drawer`: `cardMode: single`, `primaryStory: Right`, `viewport: 480x520` — drawer panels need
  a viewport tall/narrow enough to show the panel without a huge empty backdrop.
- `Modal`: `cardMode: single`, `primaryStory: Default`, `skip: ["components-modal--default"]` —
  `Modal` uses `createPortal` to `document.body`, which escapes Storybook's `#storybook-root`
  content-detection and reads as an sb-error ("no storybook root content"). This is a known
  Storybook/portal limitation, not a real bug — accepted via `skip`.
