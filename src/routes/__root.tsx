import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useEffect, type ReactNode } from 'react'
import { AppProviders } from '@/app/providers/AppProviders'
import { SiteThemeProvider } from '@/app/providers/SiteThemeProvider'
import { RouteAnalytics } from '@/app/providers/RouteAnalytics'
import { AppErrorBoundary } from '@/app/components/AppErrorBoundary'
import { useWebsiteNavigation } from '@/features/cms/hooks/useWebsiteNavigation'
import { buildStaticWebsiteNavigation } from '@/features/cms/navigation/staticWebsiteNavigation'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import {
  buildPublishedFontPreloadLinks,
  publishedProjectionInlineCss,
  publishedThemeColor,
} from '@/features/cms/api/storefrontProjectionHead'
import { resolvePublishedAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { SiteFooter } from '@/shared/components/layout/SiteFooter'
import { PremiumNav } from '@/shared/components/layout/PremiumNav'
import { MarketingToolsHead } from '@/shared/components/seo/MarketingToolsHead'
import { DEFAULT_EMBLEM_SRC } from '@/shared/constants/brandAssets'
import {
  LANDING_ENTRY_LOCK_SCRIPT,
  LandingEntryProvider,
  releaseLandingEntryLock,
  useLandingEntry,
} from '@/features/landingPages/LandingEntryContext'
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
      theme: projection.theme,
      fonts: projection.fonts,
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

  return (
    <html lang="en" data-theme={theme.dataTheme}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANDING_ENTRY_LOCK_SCRIPT }} />
        <style
          id="anvl-published-projection"
          dangerouslySetInnerHTML={{ __html: inlineCss }}
        />
        <HeadContent />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: LANDING_ENTRY_LOCK_SCRIPT }} />
        <AppProviders>{children}</AppProviders>
        <Scripts />
      </body>
    </html>
  )
}

function StorefrontLayout() {
  const { navigation: ssrNavigation, theme, fonts } = Route.useLoaderData()
  const navigation = useWebsiteNavigation(ssrNavigation)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isHome = pathname === '/'
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
      <MarketingToolsHead />
      <RouteAnalytics />
      {showChrome ? <PremiumNav navigation={navigation} /> : null}
      <main
        className={
          showChrome
            ? 'pt-[var(--anvl-header-h)]'
            : 'fixed inset-0 z-0 h-[100dvh] overflow-hidden overscroll-none'
        }
      >
        <AppErrorBoundary resetKey={pathname}>
          <Outlet />
        </AppErrorBoundary>
      </main>
      {showChrome ? (
        <SiteFooter navigation={navigation} className={isHome ? 'mt-0' : undefined} />
      ) : null}
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
      <>
        <RouteAnalytics />
        <main>
          <AppErrorBoundary resetKey={pathname}>
            <Outlet />
          </AppErrorBoundary>
        </main>
        {devtools}
      </>
    )
  }

  return (
    <LandingEntryProvider>
      <StorefrontLayout />
      {devtools}
    </LandingEntryProvider>
  )
}
