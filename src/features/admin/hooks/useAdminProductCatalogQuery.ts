import { useQuery } from '@tanstack/react-query'
import { runtimeClients } from '@/app/config/runtime'

/**
 * Query-key factory, matching the `accountQueryKeys` pattern
 * (`publicAccount.core.ts`) — a single namespaced source of truth rather than
 * inline arrays repeated per call site (REU-14).
 */
export const adminProductCatalogQueryKeys = {
  all: ['admin', 'product-catalog'] as const,
}

/**
 * Shared admin-side product catalog query. Previously `ChapterForm.tsx` and
 * `AdminPdpContentEditor.tsx` each ran their own `useQuery` for the identical
 * `getShopListingCatalog()` call under different, unrelated cache keys
 * (`['admin', 'story-products']` vs `['admin', 'pdp-products']`) — same data,
 * fetched twice, cached twice. Consolidated onto one key so both editors
 * share a single cache entry and a single network request.
 */
export function useAdminProductCatalogQuery() {
  return useQuery({
    queryKey: adminProductCatalogQueryKeys.all,
    queryFn: () => runtimeClients.commerce.getShopListingCatalog(),
    staleTime: 30_000,
  })
}
