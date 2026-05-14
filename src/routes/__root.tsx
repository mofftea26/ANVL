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
import { RouteAnalytics } from "@/app/providers/RouteAnalytics";
import { runtimeClients } from "@/app/config/runtime";
import { useLandingCms } from "@/features/admin/landing-cms/useLandingCms";
import { SiteFooter } from "@/shared/components/layout/SiteFooter";
import { StickyHeader } from "@/shared/components/layout/StickyHeader";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  loader: async () => {
    const [landing, activeDrop] = await Promise.all([
      runtimeClients.cms.getLandingCmsContent(),
      runtimeClients.cms.getActiveDrop(),
    ]);
    return { landing, activeDrop };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0B0B0C" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
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
  const { landing: ssrLanding } = Route.useLoaderData();
  const landing = useLandingCms(ssrLanding);
  const navigation = landing.navigation;
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      <RouteAnalytics />
      {!isAdminRoute ? <StickyHeader navigation={navigation} /> : null}
      <main>
        <Outlet />
      </main>
      {!isAdminRoute ? <SiteFooter navigation={navigation} /> : null}
      <TanStackDevtools
        config={{ position: "bottom-right" }}
        plugins={[
          { name: "TanStack Router", render: <TanStackRouterDevtoolsPanel /> },
        ]}
      />
    </>
  );
}
