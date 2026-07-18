import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  Suspense,
  lazy,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
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
  isFullBleedStorefrontPath,
  getStorefrontMainClassName,
} from '@/routes/storefrontMainLayout'
import { PageBackdrop } from '@/shared/components/layout/PageBackdrop'
import { SiteDustGate } from '@/shared/webgl/SiteDustGate'
import { resolvePageBackdropSrc } from '@/features/cms/assets/pageBackdrop'
import { useComingSoonConfig } from '@/features/cms/hooks/useComingSoonConfig'
import { PreviewDraftProvider, usePreviewDraft } from '@/features/cms/preview'
import {
  isComingSoonExemptPath,
  readComingSoonPreviewBypass,
} from '@/features/comingSoon/lib/comingSoonGate'
import { cn } from '@/shared/lib/cn'
import appCss from '@/styles.css?url'

/** Lazy so the reveal page (incl. its GSAP usage) costs nothing while disabled. */
const ComingSoonExperience = lazy(() =>
  import('@/features/comingSoon').then((m) => ({
    default: m.ComingSoonExperience,
  })),
)

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
      comingSoon: projection.comingSoon,
    }
  },
  head: ({ loaderData, matches }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // While Coming Soon mode is live, keep the un-revealed catalog out of
      // indexes: every public route except home is noindexed (home carries the
      // CMS-controlled reveal SEO — see `src/routes/index.tsx`).
      ...(loaderData?.comingSoon.enabled &&
      matches[matches.length - 1]?.pathname !== '/' &&
      !matches[matches.length - 1]?.pathname.startsWith('/admin')
        ? [{ name: 'robots', content: 'noindex, nofollow' }]
        : []),
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
  const isFullBleed = isFullBleedStorefrontPath(pathname)
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
        {showChrome && backdropSrc ? (
          <PageBackdrop src={backdropSrc} intensity={pathname === '/story' ? 'vivid' : 'default'} />
        ) : null}
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
        {/* Passports (/p/*) are a focused artifact surface — no footer. */}
        {showChrome && !pathname.startsWith('/p/') ? (
          <div className={cn('relative z-10', pathname === '/about' ? 'xl:hidden' : undefined)}>
            <SiteFooter navigation={navigation} />
          </div>
        ) : null}
      </ExperienceProvider>
    </SiteThemeProvider>
  )
}

function RootLayout() {
  return (
    <PreviewDraftProvider>
      <RootLayoutBody />
    </PreviewDraftProvider>
  )
}

function RootLayoutBody() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isAdminRoute = pathname.startsWith('/admin')
  const { theme, fonts, comingSoon: ssrComingSoon, mediaIndex } =
    Route.useLoaderData()

  // Coming Soon site-mode gate. Seeds from the SSR projection (correct first
  // paint), then tracks the published row so a CMS toggle updates open tabs.
  const comingSoon = useComingSoonConfig(ssrComingSoon)
  // Admin preview bypass (`?anvl-preview=live`) is sessionStorage-backed, so
  // it resolves after mount — SSR always renders the gated state.
  const [previewBypass, setPreviewBypass] = useState(false)
  useEffect(() => {
    setPreviewBypass(readComingSoonPreviewBypass())
  }, [pathname])

  // Inside the admin live-preview iframe, only home shows the reveal gate —
  // other routes stay editable/previewable while Coming Soon mode is on.
  const previewDraft = usePreviewDraft()
  const previewGateBypass = previewDraft !== null && pathname !== '/'

  const comingSoonActive =
    comingSoon.enabled &&
    !isComingSoonExemptPath(pathname) &&
    !previewBypass &&
    !previewGateBypass

  // The home head-script arms the landing-entry scroll lock before hydration;
  // the reveal page replaces that whole flow, so release it while gated.
  useEffect(() => {
    if (comingSoonActive) releaseLandingEntryLock()
  }, [comingSoonActive])

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
      <SiteThemeProvider theme={theme} fonts={fonts} respectLocalDraft={false}>
        <AdminAuthProvider>
          <RouteAnalytics />
          <main>
            <AppErrorBoundary resetKey={pathname}>
              <Outlet />
            </AppErrorBoundary>
          </main>
          {devtools}
        </AdminAuthProvider>
      </SiteThemeProvider>
    )
  }

  if (comingSoonActive) {
    return (
      <SiteThemeProvider theme={theme} fonts={fonts}>
        <RouteAnalytics />
        <Suspense
          // Theme-colored void while the lazy chunk streams — never a white flash.
          fallback={<div className="fixed inset-0 z-[80] bg-[var(--color-bg)]" />}
        >
          <ComingSoonExperience config={comingSoon} mediaIndex={mediaIndex} />
        </Suspense>
        {devtools}
      </SiteThemeProvider>
    )
  }

  return (
    <LandingEntryProvider>
      {comingSoon.enabled && previewBypass ? (
        <div className="fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-[color-mix(in_oklab,var(--color-warning)_85%,black)] px-4 py-1.5 text-center text-xs font-medium text-white">
          Previewing the live site — Coming Soon mode is still ON for visitors.
          <a href="?anvl-preview=off" className="underline underline-offset-2">
            Exit preview
          </a>
        </div>
      ) : null}
      <StorefrontLayout />
      {devtools}
    </LandingEntryProvider>
  )
}
