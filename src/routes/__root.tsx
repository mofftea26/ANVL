import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { AppProviders } from '@/app/providers/AppProviders'
import { AdminAuthProvider } from '@/features/admin/auth/AdminAuthProvider'
import { SiteThemeProvider } from '@/app/providers/SiteThemeProvider'
import { RouteAnalytics } from '@/app/providers/RouteAnalytics'
import { AppErrorBoundary } from '@/app/components/AppErrorBoundary'
import { useWebsiteNavigation } from '@/features/cms/hooks/useWebsiteNavigation'
import { buildStaticWebsiteNavigation } from '@/features/cms/navigation/staticWebsiteNavigation'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import {
  buildPublishedFontPreloadLinks,
  publishedProjectionInlineCss,
  publishedProjectionStyleVars,
  publishedThemeColor,
} from '@/features/cms/api/storefrontProjectionHead'
import { resolvePublishedAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { SiteFooter } from '@/shared/components/layout/SiteFooter'
import { PremiumNav } from '@/shared/components/layout/PremiumNav'
import {
  ExperienceProvider,
  ExperiencePageTransition,
  resolveExperienceKey,
} from '@/features/experience'
import { MarketingToolsHead } from '@/shared/components/seo/MarketingToolsHead'
import { DEFAULT_EMBLEM_SRC } from '@/shared/constants/brandAssets'
import {
  LANDING_ENTRY_LOCK_SCRIPT,
  LandingEntryProvider,
  releaseLandingEntryLock,
  useLandingEntry,
} from '@/features/landingPages/LandingEntryContext'
import {
  FULL_BLEED_STOREFRONT_PATHS,
  getStorefrontMainClassName,
} from '@/routes/storefrontMainLayout'
import { PageBackdrop } from '@/shared/components/layout/PageBackdrop'
import { SiteDustGate } from '@/shared/webgl/SiteDustGate'
import { resolvePageBackdropSrc } from '@/features/cms/assets/pageBackdrop'
import { cn } from '@/shared/lib/cn'
import appCss from '@/styles.css?url'

const IS_DEV = import.meta.env.DEV

export const Route = createRootRoute({
  loader: async () => {
    const projection = await loadStorefrontProjection()
    const resolved = resolvePublishedAssets(
      projection.assets,
      projection.activeLandingPageKey,
      projection.mediaIndex,
    )
    const emblemSrc = resolved.emblemFallback?.trim() || DEFAULT_EMBLEM_SRC

    return {
      navigation: buildStaticWebsiteNavigation({
        emblemSrc,
        emblemAlt: 'ANVL',
      }),
      // A single global CMS theme drives the whole storefront.
      theme: projection.theme,
      fonts: projection.fonts,
      // Active landing key → site-wide experience (structure/variants). Theme
      // stays independent; see `features/experience`.
      activeLandingPageKey: projection.activeLandingPageKey,
      experienceKey: resolveExperienceKey(projection.activeLandingPageKey),
      assets: projection.assets,
      mediaIndex: projection.mediaIndex,
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'theme-color',
        content: loaderData?.theme
          ? publishedThemeColor(loaderData.theme)
          : '#0B0B0C',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      ...(loaderData?.fonts
        ? buildPublishedFontPreloadLinks(loaderData.fonts)
        : []),
      { rel: 'icon', href: '/brand/mark.svg', type: 'image/svg+xml' },
      { rel: 'shortcut icon', href: '/brand/mark.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/brand/mark.svg' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootDocument({ children }: { children: ReactNode }) {
  const { theme, fonts } = Route.useLoaderData()
  const inlineCss = publishedProjectionInlineCss(theme, fonts)
  // Element-level style beats the stylesheet's `:root` defaults, so the
  // published palette paints on the first frame (no ember→theme flash).
  const themeVars = publishedProjectionStyleVars(theme, fonts) as CSSProperties

  return (
    <html
      lang="en"
      data-theme={theme.dataTheme}
      style={themeVars}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANDING_ENTRY_LOCK_SCRIPT }} />
        <style
          id="anvl-published-projection"
          dangerouslySetInnerHTML={{ __html: inlineCss }}
        />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
        <Scripts />
      </body>
    </html>
  )
}

function StorefrontLayout() {
  const {
    navigation: ssrNavigation,
    theme,
    fonts,
    activeLandingPageKey,
    assets,
    mediaIndex,
  } = Route.useLoaderData()
  const navigation = useWebsiteNavigation(ssrNavigation)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isHome = pathname === '/'
  const isFullBleed = FULL_BLEED_STOREFRONT_PATHS.has(pathname)
  const backdropSrc =
    !isFullBleed ? resolvePageBackdropSrc(pathname, assets, mediaIndex) : null
  const { homeEntryComplete, resetHomeEntry } = useLandingEntry()
  const showChrome = !isHome || homeEntryComplete

  useEffect(() => {
    if (isHome) {
      resetHomeEntry()
      return
    }
    releaseLandingEntryLock()
  }, [isHome, resetHomeEntry])

  return (
    <SiteThemeProvider theme={theme} fonts={fonts}>
      <ExperienceProvider activeLandingPageKey={activeLandingPageKey}>
        <ExperiencePageTransition />
        <MarketingToolsHead />
        <RouteAnalytics />
        {showChrome ? (
          <a
            href="#anvl-main"
            className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:border focus:border-[var(--color-line)] focus:bg-[var(--color-surface)] focus:px-4 focus:py-2 focus:text-sm focus:text-[color:var(--color-text)]"
          >
            Skip to content
          </a>
        ) : null}
        {showChrome ? (
          <PremiumNav navigation={navigation} alwaysTransparent={isFullBleed} />
        ) : null}
        {showChrome && backdropSrc ? <PageBackdrop src={backdropSrc} /> : null}
        {/* Site-wide cursor dust — full-bleed routes integrate the same
            DustField inside their own scene canvas, so they are excluded
            here (one field, never two). */}
        {showChrome && !isFullBleed ? <SiteDustGate /> : null}
        <main
          id="anvl-main"
          className={cn('relative z-10', getStorefrontMainClassName({ showChrome, isFullBleed }))}
        >
          <AppErrorBoundary resetKey={pathname}>
            <Outlet />
          </AppErrorBoundary>
        </main>
        {showChrome ? (
          <div className={cn('relative z-10', pathname === '/about' ? 'xl:hidden' : undefined)}>
            <SiteFooter navigation={navigation} />
          </div>
        ) : null}
      </ExperienceProvider>
    </SiteThemeProvider>
  )
}

function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isAdminRoute = pathname.startsWith('/admin')

  const devtools = IS_DEV ? (
    <TanStackDevtools
      config={{ position: 'bottom-right' }}
      plugins={[
        {
          name: 'TanStack Router',
          render: <TanStackRouterDevtoolsPanel />,
        },
      ]}
    />
  ) : null

  if (isAdminRoute) {
    return (
      <AdminAuthProvider>
        <RouteAnalytics />
        <main>
          <AppErrorBoundary resetKey={pathname}>
            <Outlet />
          </AppErrorBoundary>
        </main>
        {devtools}
      </AdminAuthProvider>
    )
  }

  return (
    <LandingEntryProvider>
      <StorefrontLayout />
      {devtools}
    </LandingEntryProvider>
  )
}
