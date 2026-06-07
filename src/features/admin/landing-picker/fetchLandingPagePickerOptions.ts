import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { listLandingPages } from '@/features/landingPages/registry'
import type { LandingPageMeta } from '@/features/landingPages/types'

export type LandingPagePickerOption = LandingPageMeta

/**
 * Fetch landing page picker options from Supabase, intersected with the code registry.
 * Falls back to registry-only when Supabase is unavailable.
 */
export async function fetchLandingPagePickerOptions(): Promise<
  LandingPagePickerOption[]
> {
  const registry = listLandingPages()
  const client = getAdminSupabaseBrowserClient()
  if (!client) return registry

  const { data, error } = await client
    .from('landing_pages')
    .select('key, name, description, preview_image, is_available')
    .eq('is_available', true)
    .order('name')

  if (error || !data?.length) return registry

  const registryByKey = new Map(registry.map((p) => [p.key, p]))
  const out: LandingPagePickerOption[] = []

  for (const row of data) {
    const key = typeof row.key === 'string' ? row.key : ''
    const reg = registryByKey.get(key)
    if (!reg) continue
    out.push({
      key,
      name: typeof row.name === 'string' ? row.name : reg.name,
      description:
        typeof row.description === 'string' ? row.description : reg.description,
      previewImage:
        typeof row.preview_image === 'string' && row.preview_image.length > 0
          ? row.preview_image
          : reg.previewImage,
      isAvailable: true,
    })
  }

  return out.length > 0 ? out : registry
}
