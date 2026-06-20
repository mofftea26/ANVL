import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { AppNotFound } from './app/components/AppNotFound'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30_000,
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
