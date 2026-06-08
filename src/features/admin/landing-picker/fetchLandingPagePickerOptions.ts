import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { listLandingPages } from '@/features/landingPages/registry'
import type { LandingPageMeta } from '@/features/landingPages/types'

export type LandingPagePickerOption = LandingPageMeta

/**
 * Fetch landing page picker options from Supabase, intersected with the code registry.
 * Supabase is the source of truth for labels; registry metadata is offline fallback only.
 */
export async function fetchLandingPagePickerOptions(): Promise<
  LandingPagePickerOption[]
> {
  const registryFallback = listLandingPages()
  const client = getAdminSupabaseBrowserClient()
  if (!client) return registryFallback

  const { data, error } = await client
    .from('landing_pages')
    .select('key, name, description, preview_image, is_available')
    .eq('is_available', true)
    .order('name')

  if (error || !data?.length) return registryFallback

  const registryByKey = new Map(registryFallback.map((p) => [p.key, p]))
  const out: LandingPagePickerOption[] = []

  for (const row of data) {
    const key = typeof row.key === 'string' ? row.key : ''
    const reg = registryByKey.get(key)
    if (!reg) continue

    const dbName = typeof row.name === 'string' ? row.name.trim() : ''
    const dbDescription =
      typeof row.description === 'string' ? row.description : ''
    const dbPreview =
      typeof row.preview_image === 'string' ? row.preview_image.trim() : ''

    out.push({
      key,
      name: dbName || reg.name,
      description: dbDescription || reg.description,
      previewImage: dbPreview || reg.previewImage,
      isAvailable: true,
    })
  }

  return out.length > 0 ? out : registryFallback
}
