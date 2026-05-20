import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { canWriteCmsDraftsToSupabase } from '@/features/cms/api/cmsPersistenceMode'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { fetchCmsProfileRole } from '@/features/admin/auth/adminCmsProfileRole'
import { readDropsArray } from '@/features/admin/drops/drops.service'
import { readActiveDropIdRaw } from '@/features/admin/drops/drops.storage'
import { getAdminProducts } from '@/features/admin/products/products.service'
import { getWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'
import { getSiteSeoContent } from '@/features/cms/siteSeo.local'
import { getGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.service'
import { isAdminCmsRemoteHydrationLocked } from '@/features/admin/cmsRemote/adminCmsRemoteGate'
import {
  demoteDropDraftBody,
  orderDropsForRemoteSync,
} from '@/features/admin/cmsRemote/adminCmsRemoteSyncOrder'
import { buildAnvlDropRemoteRow } from '@/features/admin/cmsRemote/adminCmsDropRemoteRow'
import {
  buildMediaIndex,
  listMediaAssets,
} from '@/features/admin/media/mediaAssets.service'

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
  const products = getAdminProducts()

  const { data: dbActiveRows, error: activeListErr } = await client
    .from('anvl_drops')
    .select('id, client_drop_id, draft_body')
    .eq('status', 'active')

  if (activeListErr) {
    return { ok: false, error: activeListErr.message }
  }

  for (const row of dbActiveRows ?? []) {
    const cid =
      typeof row.client_drop_id === 'string' ? row.client_drop_id.trim() : ''
    const shouldStayActive =
      activeClientId !== null && cid === activeClientId
    if (shouldStayActive) continue

    const draftRaw = row.draft_body
    const draft =
      typeof draftRaw === 'object' && draftRaw !== null
        ? (draftRaw as Record<string, unknown>)
        : {}

    const { error: demoteErr } = await client
      .from('anvl_drops')
      .update({
        status: 'inactive',
        draft_body: demoteDropDraftBody(draft),
      })
      .eq('id', row.id)

    if (demoteErr) return { ok: false, error: demoteErr.message }
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

  const { data: remoteDropRows, error: listErr } = await client
    .from('anvl_drops')
    .select('id, client_drop_id')

  if (listErr) {
    return { ok: false, error: listErr.message }
  }

  const localIds = new Set(drops.map((d) => d.id))
  for (const r of remoteDropRows ?? []) {
    const cid =
      typeof r.client_drop_id === 'string' ? r.client_drop_id.trim() : ''
    if (cid && !localIds.has(cid)) {
      const { error: delErr } = await client
        .from('anvl_drops')
        .delete()
        .eq('id', r.id)
      if (delErr) return { ok: false, error: delErr.message }
    }
  }

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

  const layout = getWebsiteLayoutContent()
  const siteSeo = getSiteSeoContent()
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
    if (/global_brand|column/i.test(pubErr.message)) {
      const { error: pubErr2 } = await client
        .from('storefront_publication')
        .update({ website_layout: layout, site_seo: siteSeo })
        .eq('id', 1)
      if (pubErr2) return { ok: false, error: pubErr2.message }
    } else {
      return { ok: false, error: pubErr.message }
    }
  }

  return { ok: true }
}
