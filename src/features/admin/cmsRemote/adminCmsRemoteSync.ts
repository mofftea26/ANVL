import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { canWriteCmsDraftsToSupabase } from '@/features/cms/api/cmsPersistenceMode'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { fetchCmsProfileRole } from '@/features/admin/auth/adminCmsProfileRole'
import { readDropsArray } from '@/features/admin/drops/drops.service'
import { readActiveDropIdRaw } from '@/features/admin/drops/drops.storage'
import { getAdminProducts } from '@/features/admin/products/products.service'
import { getWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'
import { getSiteSeoContent } from '@/features/cms/siteSeo.local'
import { readSiteHomepageFromStorage } from '@/features/cms/siteHomepage.settings'
import { getGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.service'
import { isAdminCmsRemoteHydrationLocked } from '@/features/admin/cmsRemote/adminCmsRemoteGate'
import {
  activeDropRowIdsToDemote,
  demoteDropBody,
  orderDropsForRemoteSync,
  resolveIntendedActiveClientIdForSync,
} from '@/features/admin/cmsRemote/adminCmsRemoteSyncOrder'
import { buildAnvlDropRemoteRow } from '@/features/admin/cmsRemote/adminCmsDropRemoteRow'
import {
  readRemoteDropDeleteQueue,
  removeRemoteDropDeleteQueueIds,
} from '@/features/admin/drops/drops.storage'
import {
  buildMediaIndex,
  listMediaAssets,
} from '@/features/admin/media/mediaAssets.service'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'
import { isPostgrestMissingColumnError } from '@/features/cms/api/storefrontPublicationColumns'

const isTestRunner = import.meta.env.MODE === 'test'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleAdminCmsRemoteSync(): void {
  if (isTestRunner) return
  if (typeof window === 'undefined') return
  if (!getSupabasePublicEnv()) return
  if (isAdminCmsRemoteHydrationLocked()) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void flushAdminCmsRemoteSync()
  }, 850)
}

export async function flushAdminCmsRemoteSync(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (isTestRunner) return { ok: true }
  if (typeof window === 'undefined') return { ok: true }
  if (!getSupabasePublicEnv()) return { ok: true }
  if (isAdminCmsRemoteHydrationLocked()) return { ok: true }

  const client = getAdminSupabaseBrowserClient()
  if (!client) return { ok: true }

  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session) return { ok: true }

  const { role } = await fetchCmsProfileRole(client)
  if (!canWriteCmsDraftsToSupabase(role)) return { ok: true }

  const drops = readDropsArray()
  const activeClientId = readActiveDropIdRaw()
  const syncProductsToSupabase = !getShopifyPublicEnv()
  const products = syncProductsToSupabase ? getAdminProducts() : []

  const { data: dbActiveRows, error: activeListErr } = await client
    .from('anvl_drops')
    .select('id, client_drop_id, body')
    .eq('status', 'active')

  if (activeListErr) {
    return { ok: false, error: activeListErr.message }
  }

  const intendedActiveClientId = resolveIntendedActiveClientIdForSync(
    drops,
    activeClientId,
  )
  const remoteActiveRows = dbActiveRows ?? []
  const rowIdsToDemote = activeDropRowIdsToDemote(
    remoteActiveRows,
    intendedActiveClientId,
  )

  if (rowIdsToDemote.length > 0) {
    const demoteSet = new Set(rowIdsToDemote)
    for (const row of remoteActiveRows) {
      if (!demoteSet.has(row.id)) continue

      const bodyRaw = row.body
      const body =
        typeof bodyRaw === 'object' && bodyRaw !== null
          ? (bodyRaw as Record<string, unknown>)
          : {}

      const { error: demoteErr } = await client
        .from('anvl_drops')
        .update({
          status: 'inactive',
          body: demoteDropBody(body),
        })
        .eq('id', row.id)

      if (demoteErr) return { ok: false, error: demoteErr.message }
    }
  }

  const orderedDrops = orderDropsForRemoteSync(drops, activeClientId)

  for (const drop of orderedDrops) {
    const row = buildAnvlDropRemoteRow(drop)

    const { data: existing, error: selErr } = await client
      .from('anvl_drops')
      .select('id')
      .eq('client_drop_id', drop.id)
      .maybeSingle()

    if (selErr) {
      return { ok: false, error: selErr.message }
    }

    if (existing?.id) {
      const { data: current, error: curErr } = await client
        .from('anvl_drops')
        .select('status, updated_at')
        .eq('id', existing.id)
        .maybeSingle()

      if (curErr) return { ok: false, error: curErr.message }

      // Cron may have promoted this row while localStorage still says scheduled.
      if (current?.status === 'active' && drop.status === 'scheduled') {
        const serverMs = current.updated_at
          ? new Date(current.updated_at).getTime()
          : 0
        const localMs = drop.updatedAt
          ? new Date(drop.updatedAt).getTime()
          : 0
        if (
          Number.isFinite(serverMs) &&
          serverMs > 0 &&
          localMs <= serverMs
        ) {
          continue
        }
      }

      const { error: upErr } = await client
        .from('anvl_drops')
        .update(row)
        .eq('id', existing.id)
      if (upErr) return { ok: false, error: upErr.message }
    } else {
      const { error: insErr } = await client.from('anvl_drops').insert(row)
      if (insErr) return { ok: false, error: insErr.message }
    }
  }

  const deleteQueue = readRemoteDropDeleteQueue()
  const deletedClientIds: string[] = []

  for (const clientId of deleteQueue) {
    const { data: row, error: selDelErr } = await client
      .from('anvl_drops')
      .select('id')
      .eq('client_drop_id', clientId)
      .maybeSingle()

    if (selDelErr) return { ok: false, error: selDelErr.message }

    if (row?.id) {
      const { error: delErr } = await client
        .from('anvl_drops')
        .delete()
        .eq('id', row.id)
      if (delErr) return { ok: false, error: delErr.message }
    }

    deletedClientIds.push(clientId)
  }

  if (deletedClientIds.length > 0) {
    removeRemoteDropDeleteQueueIds(deletedClientIds)
  }

  if (syncProductsToSupabase) {
    for (const p of products) {
      const body = JSON.parse(JSON.stringify(p)) as Record<string, unknown>
      const { data: ex, error: pSelErr } = await client
        .from('cms_admin_products')
        .select('id')
        .eq('slug', p.slug)
        .maybeSingle()

      if (pSelErr) return { ok: false, error: pSelErr.message }

      if (ex?.id) {
        const { error: pUp } = await client
          .from('cms_admin_products')
          .update({ body, slug: p.slug })
          .eq('id', ex.id)
        if (pUp) return { ok: false, error: pUp.message }
      } else {
        const { error: pIn } = await client
          .from('cms_admin_products')
          .insert({ slug: p.slug, body })
        if (pIn) return { ok: false, error: pIn.message }
      }
    }
    const { data: remoteProd, error: rpErr } = await client
      .from('cms_admin_products')
      .select('id, slug')

    if (rpErr) return { ok: false, error: rpErr.message }

    const localSlugs = new Set(products.map((p) => p.slug))
    for (const r of remoteProd ?? []) {
      const slug = typeof r.slug === 'string' ? r.slug : ''
      if (slug && !localSlugs.has(slug)) {
        const { error: dErr } = await client
          .from('cms_admin_products')
          .delete()
          .eq('id', r.id)
        if (dErr) return { ok: false, error: dErr.message }
      }
    }
  }

  const layout = getWebsiteLayoutContent()
  const siteSeo = getSiteSeoContent()
  const siteHomepage = readSiteHomepageFromStorage()
  const globalBrand = getGlobalBrandSettings()
  const { getSiteHomeExtrasContent } = await import(
    '@/features/admin/site-home/siteHome.service'
  )
  const homeExtras = getSiteHomeExtrasContent()

  const mediaList = await listMediaAssets(client)
  const mediaIndex = mediaList.ok ? buildMediaIndex(mediaList.assets) : []

  const pubPatch: Record<string, unknown> = {
    website_layout: layout,
    site_seo: siteSeo,
    site_homepage: siteHomepage,
    global_brand: globalBrand,
    media_index: mediaIndex,
    campaigns: homeExtras.campaigns,
    lookbook: homeExtras.lookbook,
  }

  const { error: pubErr } = await client
    .from('storefront_publication')
    .update(pubPatch)
    .eq('id', 1)

  if (pubErr) {
    if (isPostgrestMissingColumnError(pubErr, 'site_homepage')) {
      const { site_homepage: _omit, ...withoutHomepage } = pubPatch
      const { error: pubErr2 } = await client
        .from('storefront_publication')
        .update(withoutHomepage)
        .eq('id', 1)
      if (pubErr2) return { ok: false, error: pubErr2.message }
      return { ok: true }
    }
    if (
      isPostgrestMissingColumnError(pubErr, 'global_brand') ||
      /global_brand|column/i.test(pubErr.message)
    ) {
      const { error: pubErr2 } = await client
        .from('storefront_publication')
        .update({
          website_layout: layout,
          site_seo: siteSeo,
          site_homepage: siteHomepage,
        })
        .eq('id', 1)
      if (pubErr2) {
        if (isPostgrestMissingColumnError(pubErr2, 'site_homepage')) {
          const { error: pubErr3 } = await client
            .from('storefront_publication')
            .update({ website_layout: layout, site_seo: siteSeo })
            .eq('id', 1)
          if (pubErr3) return { ok: false, error: pubErr3.message }
          return { ok: true }
        }
        return { ok: false, error: pubErr2.message }
      }
      return { ok: true }
    }
    return { ok: false, error: pubErr.message }
  }

  return { ok: true }
}
