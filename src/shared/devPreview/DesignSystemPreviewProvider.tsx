import { createContext, useContext, useEffect, type PropsWithChildren, type ReactNode } from 'react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { DEFAULT_THEME_CONFIG, themeConfigToCssVars } from '@/features/cms/config/cmsSiteConfig.zod'
import { DEFAULT_FONT_LIBRARY_CONFIG, fontLibraryToCssVars, parseFontLibrary } from '@/features/cms/config/fontLibrary'

/**
 * design-sync preview-only wrapper (never used by the real app — see
 * SiteThemeProvider for that). Two things every component preview needs and
 * neither Storybook's own decorators nor a static stylesheet can supply:
 *
 * 1. Theme + font CSS custom properties — the real app derives ~70 `--color-*`
 *    /`--shop-*`/`--font-*` vars from a 15-token palette at runtime via
 *    `themeConfigToCssVars`/`fontLibraryToCssVars` (SiteThemeProvider). This
 *    injects the same derivation from the default palette, synchronously, with
 *    no Supabase/localStorage dependency.
 * 2. A minimal TanStack Router context — several components (ProductCard,
 *    SafeLink's internal-link branch) render `<Link>`, which throws outside a
 *    RouterProvider. A single catch-all route is enough for `<Link to="...">`
 *    to resolve without needing the app's real route tree.
 */
const PreviewChildrenContext = createContext<ReactNode>(null)

function RouteContent() {
  const children = useContext(PreviewChildrenContext)

  useEffect(() => {
    const root = document.documentElement
    const fonts = parseFontLibrary(DEFAULT_FONT_LIBRARY_CONFIG)
    const vars = { ...themeConfigToCssVars(DEFAULT_THEME_CONFIG), ...fontLibraryToCssVars(fonts) }
    for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value)
    root.setAttribute('data-theme', DEFAULT_THEME_CONFIG.dataTheme)
    // ANVL is a dark-only brand — most tokens (translucent surfaces, ghost
    // button text, gradient badges) are only legible over the real dark
    // page background, matching Storybook's own 'oath-dark' backgrounds
    // parameter. Without this the preview page defaults to white and several
    // components render invisible/washed-out text against it.
    root.style.setProperty('color-scheme', 'dark')
    root.style.backgroundColor = 'var(--color-bg)'
    document.body.style.backgroundColor = 'var(--color-bg)'
    document.body.style.minHeight = '100vh'
  }, [])

  return <>{children}</>
}

const rootRoute = createRootRoute({ component: RouteContent })
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: () => null,
})
const routeTree = rootRoute.addChildren([catchAllRoute])

const router = createRouter({
  routeTree,
  history: createMemoryHistory({ initialEntries: ['/design-sync-preview'] }),
})

export function DesignSystemPreviewProvider({ children }: PropsWithChildren) {
  return (
    <PreviewChildrenContext.Provider value={children}>
      <RouterProvider router={router} />
    </PreviewChildrenContext.Provider>
  )
}
