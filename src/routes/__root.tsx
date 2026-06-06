import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { ReactNode } from "react";
import { AppProviders } from "@/app/providers/AppProviders";
import { ActiveDropThemeProvider } from "@/app/providers/ActiveDropThemeProvider";
import { RouteAnalytics } from "@/app/providers/RouteAnalytics";
import { AppErrorBoundary } from "@/app/components/AppErrorBoundary";
import { runtimeClients } from "@/app/config/runtime";
import { useWebsiteNavigation } from "@/features/cms/hooks/useWebsiteNavigation";
import { buildWebsiteNavigation } from "@/features/cms/navigation/websiteNavigation";
import { SiteFooter } from "@/shared/components/layout/SiteFooter";
import { PremiumNav } from "@/shared/components/layout/PremiumNav";
import { MarketingToolsHead } from "@/shared/components/seo/MarketingToolsHead";
import appCss from "@/styles.css?url";
import soraLatinWoff2 from "@fontsource/sora/files/sora-latin-400-normal.woff2?url";
import antonLatinWoff2 from "@fontsource/anton/files/anton-latin-400-normal.woff2?url";
import cinzelLatinWoff2 from "@fontsource/cinzel/files/cinzel-latin-600-normal.woff2?url";

import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { fetchPublishedStorefrontProjection } from '@/features/cms/api/publicStorefrontPublication'
import { createDefaultGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.defaults'

const IS_DEV = import.meta.env.DEV;

export const Route = createRootRoute({
  loader: async () => {
    const env = getSupabasePublicEnv();
    if (env) {
      try {
        const p = await fetchPublishedStorefrontProjection(env);
        if (p) {
          return {
            navigation: buildWebsiteNavigation(p.layout, {
              emblemSrc: p.globalBrand.emblemFallbackUrl,
              emblemAlt: "ANVL",
            }),
            globalBrand: p.globalBrand,
            siteHomepage: p.siteHomepage,
          };
        }
      } catch {
        /* missing project / network */
      }
    }
    const layout = await runtimeClients.siteSettings.getWebsiteLayout();
    const globalBrand = createDefaultGlobalBrandSettings();
    return {
      navigation: buildWebsiteNavigation(layout, {
        emblemSrc: globalBrand.emblemFallbackUrl,
        emblemAlt: "ANVL",
      }),
      globalBrand,
      siteHomepage: { mode: 'custom' as const, updatedAt: new Date().toISOString() },
    };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0B0B0C" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preload",
        href: soraLatinWoff2,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: antonLatinWoff2,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: cinzelLatinWoff2,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "icon", href: "/brand/mark.svg", type: "image/svg+xml" },
      { rel: "shortcut icon", href: "/brand/mark.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/brand/mark.svg" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="oath-dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  const { navigation: ssrNavigation, globalBrand } = Route.useLoaderData();
  const navigation = useWebsiteNavigation(ssrNavigation);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isAdminRoute = pathname.startsWith("/admin");

  const devtools =
    IS_DEV ? (
      <TanStackDevtools
        config={{ position: "bottom-right" }}
        plugins={[
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    ) : null;

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
    );
  }

  return (
    <>
      <MarketingToolsHead />
      <ActiveDropThemeProvider initialGlobalBrand={globalBrand}>
        <RouteAnalytics />
        <PremiumNav navigation={navigation} />
        <main className="pt-[var(--anvl-header-h)]">
          <AppErrorBoundary resetKey={pathname}>
            <Outlet />
          </AppErrorBoundary>
        </main>
        <SiteFooter navigation={navigation} />
      </ActiveDropThemeProvider>
      {devtools}
    </>
  );
}
