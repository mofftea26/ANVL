import type { SupabaseClient } from '@supabase/supabase-js'
import { writeProductsRaw } from '@/features/admin/products/products.storage'
import type { AdminProduct } from '@/features/admin/products/products.types'
import { persistedProductSchema } from '@/features/admin/products/products.persistence.zod'
import { hydrateAdminProductFromStorage } from '@/features/admin/products/products.service'
import { saveWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'
import { persistedWebsiteLayoutSchema } from '@/features/admin/website-layout/websiteLayout.persistence.zod'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import { saveSiteSeoContent, parseSiteSeoUnknown } from '@/features/cms/siteSeo.local'
import {
  writeSiteHomepageToStorage,
  parseSiteHomepageUnknown,
} from '@/features/cms/siteHomepage.settings'
import { writeActiveLandingPageToStorage } from '@/features/cms/landingPageActiveKey.settings'
import { saveGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.service'
import { persistedGlobalBrandSchema } from '@/features/admin/global-brand/globalBrand.persistence.zod'
import { createDefaultGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.defaults'
import {
  beginAdminCmsRemoteHydration,
  endAdminCmsRemoteHydration,
} from '@/features/admin/cmsRemote/adminCmsRemoteGate'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'
import { isPostgrestMissingColumnError } from '@/features/cms/api/storefrontPublicationColumns'

/**
 * Pull canonical CMS rows from Supabase into the same localStorage keys the
 * admin editors use. The drop-builder was removed in the CMS teardown, so this
 * hydrates products, website layout, site SEO, homepage, global brand, and the
 * active landing-page key only.
 */
export async function hydrateAdminCmsFromSupabase(
  client: SupabaseClient,
): Promise<void> {
  beginAdminCmsRemoteHydration()
  try {
    let pubRes = await client
      .from('storefront_publication')
      .select('website_layout, site_seo, site_homepage, global_brand')
      .eq('id', 1)
      .maybeSingle()

    if (
      pubRes.error &&
      isPostgrestMissingColumnError(pubRes.error, 'site_homepage')
    ) {
      pubRes = await client
        .from('storefront_publication')
        .select('website_layout, site_seo, global_brand')
        .eq('id', 1)
        .maybeSingle()
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

    if (pub != null && 'site_homepage' in pub && pub.site_homepage != null) {
      writeSiteHomepageToStorage(parseSiteHomepageUnknown(pub.site_homepage))
    }

    // Canonical active landing-page key lives in cms_settings. Best-effort —
    // the table is absent on un-migrated DBs.
    try {
      const settingsRes = await client
        .from('cms_settings')
        .select('active_landing_page_key')
        .eq('id', 1)
        .maybeSingle()
      const key = settingsRes.data?.active_landing_page_key
      if (typeof key === 'string' && key.length > 0) {
        writeActiveLandingPageToStorage({
          key,
          updatedAt: new Date().toISOString(),
        })
      }
    } catch {
      /* cms_settings missing on un-migrated DB */
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
  } finally {
    endAdminCmsRemoteHydration()
  }
}
