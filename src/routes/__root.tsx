import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { ReactNode } from "react";
import { AppProviders } from "@/app/providers/AppProviders";
import { RouteAnalytics } from "@/app/providers/RouteAnalytics";
import { runtimeClients } from "@/app/config/runtime";
import { SiteFooter } from "@/shared/components/layout/SiteFooter";
import { StickyHeader } from "@/shared/components/layout/StickyHeader";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  loader: async () => {
    const navigation = await runtimeClients.cms.getNavigation();
    return { navigation };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0B0B0C" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/brand/favicon.png" },
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
  const { navigation } = Route.useLoaderData();
  return (
    <>
      <RouteAnalytics />
      <StickyHeader navigation={navigation} />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
      <TanStackDevtools
        config={{ position: "bottom-right" }}
        plugins={[
          { name: "TanStack Router", render: <TanStackRouterDevtoolsPanel /> },
        ]}
      />
    </>
  );
}
