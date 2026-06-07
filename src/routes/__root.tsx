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

import { SiteThemeProvider } from "@/app/providers/SiteThemeProvider";

import { RouteAnalytics } from "@/app/providers/RouteAnalytics";

import { AppErrorBoundary } from "@/app/components/AppErrorBoundary";

import { useWebsiteNavigation } from "@/features/cms/hooks/useWebsiteNavigation";

import { buildStaticWebsiteNavigation } from "@/features/cms/navigation/staticWebsiteNavigation";

import { loadStorefrontProjection } from "@/features/cms/api/loadStorefrontProjection";
import { resolvePublishedAssets } from "@/features/cms/assets/resolvePublishedAssets";

import { SiteFooter } from "@/shared/components/layout/SiteFooter";

import { PremiumNav } from "@/shared/components/layout/PremiumNav";

import { MarketingToolsHead } from "@/shared/components/seo/MarketingToolsHead";

import appCss from "@/styles.css?url";

import soraLatinWoff2 from "@fontsource/sora/files/sora-latin-400-normal.woff2?url";

import antonLatinWoff2 from "@fontsource/anton/files/anton-latin-400-normal.woff2?url";

import cinzelLatinWoff2 from "@fontsource/cinzel/files/cinzel-latin-600-normal.woff2?url";



const IS_DEV = import.meta.env.DEV;



export const Route = createRootRoute({

  loader: async () => {

    const projection = await loadStorefrontProjection();

    const resolved = resolvePublishedAssets(
      projection.assets,
      projection.activeLandingPageKey,
      projection.mediaIndex,
    );
    const emblemSrc =
      resolved.emblemFallback?.trim() || '/brand/the-oath-shape.svg';

    return {

      navigation: buildStaticWebsiteNavigation({

        emblemSrc,

        emblemAlt: "ANVL",

      }),

      theme: projection.theme,

      fonts: projection.fonts,

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

  const { navigation: ssrNavigation, theme, fonts } = Route.useLoaderData();

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

    <SiteThemeProvider theme={theme} fonts={fonts}>

      <MarketingToolsHead />

      <RouteAnalytics />

      <PremiumNav navigation={navigation} />

      <main className="pt-[var(--anvl-header-h)]">

        <AppErrorBoundary resetKey={pathname}>

          <Outlet />

        </AppErrorBoundary>

      </main>

      <SiteFooter navigation={navigation} />

      {devtools}

    </SiteThemeProvider>

  );

}


