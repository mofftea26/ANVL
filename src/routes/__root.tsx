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
import { useLandingCms } from "@/features/cms/hooks/useLandingCms";
import { SiteFooter } from "@/shared/components/layout/SiteFooter";
import { StickyHeader } from "@/shared/components/layout/StickyHeader";
import appCss from "@/styles.css?url";
import manropeLatinWoff2 from "@fontsource/manrope/files/manrope-latin-400-normal.woff2?url";
import bebasLatinWoff2 from "@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2?url";

import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
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
            landing: composeLandingPageFromDrop(
              structuredClone(p.drop),
              structuredClone(p.layout),
            ),
            activeDrop: p.drop,
            globalBrand: p.globalBrand,
          };
        }
      } catch {
        /* missing project / network */
      }
    }
    const [landing, activeDrop] = await Promise.all([
      runtimeClients.cms.getLandingCmsContent(),
      runtimeClients.cms.getActiveDrop(),
    ]);
    return {
      landing,
      activeDrop,
      globalBrand: createDefaultGlobalBrandSettings(),
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
        href: manropeLatinWoff2,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: bebasLatinWoff2,
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
  const { landing: ssrLanding, activeDrop, globalBrand } = Route.useLoaderData();
  const landing = useLandingCms(ssrLanding);
  const navigation = landing.navigation;
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
      <ActiveDropThemeProvider initialDrop={activeDrop} initialGlobalBrand={globalBrand}>
        <RouteAnalytics />
        <StickyHeader navigation={navigation} />
        <main>
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
