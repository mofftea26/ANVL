import type { QueryClient } from '@tanstack/react-query'
import { STOREFRONT_PUBLICATION_QUERY_KEY } from '@/features/cms/hooks/storefrontPublicationQuery'

/** Refetch landing + theme + catalog snapshots after CMS publish. */
export function invalidateStorefrontPublication(
  queryClient: QueryClient,
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: STOREFRONT_PUBLICATION_QUERY_KEY })
}

type StorefrontPublicationInvalidator = () => void | Promise<void>

let registeredInvalidator: StorefrontPublicationInvalidator | null = null

/** Wired once in `AppProviders` so non-React CMS code can bust the publication cache. */
export function registerStorefrontPublicationInvalidator(
  fn: StorefrontPublicationInvalidator,
): () => void {
  registeredInvalidator = fn
  return () => {
    if (registeredInvalidator === fn) registeredInvalidator = null
  }
}

export async function notifyStorefrontPublicationChanged(): Promise<void> {
  await registeredInvalidator?.()
}
