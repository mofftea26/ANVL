import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { AppNotFound } from './app/components/AppNotFound'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30_000,
    // Below this, a navigation never shows a pending state at all — most
    // route transitions resolve well inside 120ms. Past it, `isLoading`
    // (driving `RouteProgressBar`) stays true for at least 200ms so the bar
    // doesn't flash in and immediately vanish on a borderline-fast load.
    defaultPendingMs: 120,
    defaultPendingMinMs: 200,
    // Branded 404 for any unmatched route / thrown notFound() — without this
    // TanStack logs a warning on every render that no notFoundComponent is set.
    defaultNotFoundComponent: AppNotFound,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
