import type { SupabaseClient } from '@supabase/supabase-js'
import type { Drop } from '@/features/admin/drops/drops.types'
import {
  ensureDropSystemHydrated,
  persistDropsState,
  readDropsArray,
  resetDropSystemHydrationGate,
} from '@/features/admin/drops/drops.service'
import {
  parseRemoteDropRecord,
  resolveRemoteClientDropId,
} from '@/features/admin/cmsRemote/adminCmsDropRemoteParse'
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
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'

type AnvlDropRow = {
  id: string
  body: unknown
  status: string
  slug: string
  client_drop_id?: string | null
  release_date?: string | null
  scheduled_activation_at?: string | null
}

function resolveActiveClientDropId(
  rows: AnvlDropRow[],
  activeDbDropId: string | null,
): string | null {
  if (activeDbDropId) {
    const activeRow = rows.find((r) => r.id === activeDbDropId)
    if (activeRow) {
      const cid = resolveRemoteClientDropId(activeRow.body, activeRow)
      if (cid) return cid
    }
  }
  const byStatus = rows.find((r) => r.status === 'active')
  if (byStatus) {
    const cid = resolveRemoteClientDropId(byStatus.body, byStatus)
    if (cid) return cid
  }
  return null
}

function mapDbDropRow(row: AnvlDropRow): Drop | null {
  return parseRemoteDropRecord(row.body, row)
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
    const [dropsRes, pubRes] = await Promise.all([
      client
        .from('anvl_drops')
        .select(
          'id, body, status, slug, client_drop_id, release_date, scheduled_activation_at',
        )
        .order('slug'),
      client
        .from('storefront_publication')
        .select('website_layout, site_seo, global_brand, active_drop_id')
        .eq('id', 1)
        .maybeSingle(),
    ])

    if (dropsRes.error) {
      throw new Error(dropsRes.error.message)
    }

    const dropRows = (dropsRes.data ?? []) as AnvlDropRow[]
    const activeDbDropId =
      typeof pubRes.data?.active_drop_id === 'string'
        ? pubRes.data.active_drop_id
        : null

    ensureDropSystemHydrated()
    const localDrops = readDropsArray()
    const remoteClientIds = new Set(
      dropRows
        .map((row) => resolveRemoteClientDropId(row.body, row))
        .filter((id): id is string => Boolean(id)),
    )
    const localOnlyDrops = localDrops.filter((d) => !remoteClientIds.has(d.id))

    const drops: Drop[] = []
    for (const row of dropRows) {
      const d = mapDbDropRow(row)
      if (d) drops.push(d)
    }
    for (const local of localOnlyDrops) {
      if (!drops.some((d) => d.id === local.id)) drops.push(local)
    }

    resetDropSystemHydrationGate()

    if (drops.length === 0) {
      const oath = createDefaultTheOathDrop()
      persistDropsState([oath], oath.id)
    } else {
      const activeClientId = resolveActiveClientDropId(dropRows, activeDbDropId)
      persistDropsState(drops, activeClientId ?? drops[0]?.id ?? null)
    }

    if (pubRes.error) {
      throw new Error(pubRes.error.message)
    }

    if (!getShopifyPublicEnv()) {
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
    }

    const pub = pubRes.data

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
