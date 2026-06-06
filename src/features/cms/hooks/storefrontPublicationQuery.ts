import {
  fetchPublishedStorefrontProjection,
  type PublishedStorefrontProjection,
} from '@/features/cms/api/publicStorefrontPublication'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

export const STOREFRONT_PUBLICATION_QUERY_KEY = [
  'storefront',
  'publication',
] as const

export type StorefrontPublicationView = {
  projection: PublishedStorefrontProjection
}

export async function fetchStorefrontPublicationView(): Promise<StorefrontPublicationView | null> {
  const env = getSupabasePublicEnv()
  if (!env) return null
  const projection = await fetchPublishedStorefrontProjection(env)
  if (!projection) return null
  return { projection }
}
