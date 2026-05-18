import type { SupabaseClient } from '@supabase/supabase-js'
import type { Drop } from '@/features/admin/drops/drops.types'
import {
  ensureDropSystemHydrated,
  mergeDropPartial,
  resetDropSystemHydrationGate,
} from '@/features/admin/drops/drops.service'
import { persistedDropSchema } from '@/features/admin/drops/drops.persistence.zod'
import { writeActiveDropId, writeDropsRaw } from '@/features/admin/drops/drops.storage'
import { writeProductsRaw } from '@/features/admin/products/products.storage'
import type { AdminProduct } from '@/features/admin/products/products.types'
import { persistedProductSchema } from '@/features/admin/products/products.persistence.zod'
import { hydrateAdminProductFromStorage } from '@/features/admin/products/products.service'
import { saveWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'
import { persistedWebsiteLayoutSchema } from '@/features/admin/website-layout/websiteLayout.persistence.zod'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import { saveSiteSeoContent, parseSiteSeoUnknown } from '@/features/cms/siteSeo.local'
import { saveGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.service'
import { persistedGlobalBrandSchema } from '@/features/admin/global-brand/globalBrand.persistence.zod'
import { createDefaultGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.defaults'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'
import {
  beginAdminCmsRemoteHydration,
  endAdminCmsRemoteHydration,
} from '@/features/admin/cmsRemote/adminCmsRemoteGate'

type AnvlDropRow = {
  draft_body: unknown
  status: string
  slug: string
  client_drop_id?: string | null
  release_date?: string | null
  scheduled_activation_at?: string | null
}

function mapDbDropRow(row: AnvlDropRow): Drop | null {
  const parsed = persistedDropSchema.safeParse(row.draft_body)
  if (!parsed.success) return null
  const clientId =
    typeof row.client_drop_id === 'string' && row.client_drop_id.trim()
      ? row.client_drop_id.trim()
      : parsed.data.id
  const status = row.status as Drop['status']
  return mergeDropPartial({
    ...(parsed.data as Partial<Drop>),
    id: clientId,
    slug: row.slug,
    status,
    releaseDate: row.release_date ?? undefined,
    scheduledActivationAt: row.scheduled_activation_at ?? undefined,
  })
}

/**
 * Pull canonical CMS rows from Supabase into the same localStorage keys the
 * admin editors already use, then re-run drop hydration.
 */
export async function hydrateAdminCmsFromSupabase(
  client: SupabaseClient,
): Promise<void> {
  beginAdminCmsRemoteHydration()
  try {
    const { data: dropRows, error: dropErr } = await client
      .from('anvl_drops')
      .select(
        'draft_body, status, slug, client_drop_id, release_date, scheduled_activation_at',
      )
      .order('slug')

    if (dropErr) {
      throw new Error(dropErr.message)
    }

    const drops: Drop[] = []
    for (const row of (dropRows ?? []) as AnvlDropRow[]) {
      const d = mapDbDropRow(row)
      if (d) drops.push(d)
    }

    if (drops.length === 0) {
      const oath = createDefaultTheOathDrop()
      resetDropSystemHydrationGate()
      writeDropsRaw(JSON.stringify({ drops: [oath] }))
      writeActiveDropId(oath.id)
    } else {
      const activeId =
        drops.find((d) => d.isActive)?.id ??
        drops.find((d) => d.status === 'active')?.id ??
        drops[0]?.id ??
        null
      resetDropSystemHydrationGate()
      writeDropsRaw(JSON.stringify({ drops }))
      writeActiveDropId(activeId)
    }

    const { data: prodRows, error: prodErr } = await client
      .from('cms_admin_products')
      .select('body')
      .order('slug')

    if (prodErr) {
      throw new Error(prodErr.message)
    }

    const products: AdminProduct[] = []
    for (const row of prodRows ?? []) {
      const parsed = persistedProductSchema.safeParse(row.body)
      if (!parsed.success) continue
      products.push(
        hydrateAdminProductFromStorage(parsed.data as AdminProduct),
      )
    }
    writeProductsRaw(JSON.stringify({ products }))

    const { data: pub, error: pubErr } = await client
      .from('storefront_publication')
      .select('website_layout, site_seo, global_brand')
      .eq('id', 1)
      .maybeSingle()

    if (pubErr) {
      throw new Error(pubErr.message)
    }

    if (pub?.website_layout != null) {
      const layoutParse = persistedWebsiteLayoutSchema.safeParse(
        pub.website_layout,
      )
      if (layoutParse.success) {
        try {
          saveWebsiteLayoutContent(
            layoutParse.data as Parameters<typeof saveWebsiteLayoutContent>[0],
          )
        } catch {
          saveWebsiteLayoutContent(
            createDefaultWebsiteLayout(new Date().toISOString()),
          )
        }
      }
    }

    if (pub?.site_seo != null) {
      saveSiteSeoContent(parseSiteSeoUnknown(pub.site_seo))
    }

    if (pub != null && 'global_brand' in pub && pub.global_brand != null) {
      const gb = persistedGlobalBrandSchema.safeParse(pub.global_brand)
      if (gb.success) {
        saveGlobalBrandSettings({
          ...createDefaultGlobalBrandSettings(),
          ...gb.data,
        })
      }
    }

    ensureDropSystemHydrated()
  } finally {
    endAdminCmsRemoteHydration()
  }
}
