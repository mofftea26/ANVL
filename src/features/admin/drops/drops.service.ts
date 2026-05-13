import type { AdminProduct } from '@/features/admin/products/products.types'
import { GLOBAL_BRAND_STORAGE_KEY } from '@/features/admin/global-brand/globalBrand.storage'
import type { Drop, DropsPersistedState } from './drops.types'
import {
  readActiveDropIdRaw,
  readDropsRaw,
  writeActiveDropId,
  writeDropsRaw,
  isBrowser,
  DROPS_STORAGE_KEY,
  ACTIVE_DROP_ID_STORAGE_KEY,
} from './drops.storage'
import {
  DEFAULT_OATH_DROP_ID,
  DEFAULT_OATH_PRODUCT_IDS,
  createDefaultTheOathDrop,
  createEmptyDrop,
} from './drops.defaults'
import {
  landingPageToDrop,
  landingNavigationToWebsiteLayout,
} from './drops.migrate'
import { normalizeLandingCmsImport } from '@/features/admin/landing-cms/landingCms.merge'
import { readLandingCmsFromStorage } from '@/features/admin/landing-cms/landingCms.storage'
import {
  saveWebsiteLayoutContent,
} from '@/features/admin/website-layout/websiteLayout.service'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import {
  ensureProductsSeededWhenEmpty,
  getAdminProducts,
  saveAdminProducts,
} from '@/features/admin/products/products.service'

let hydrationRan = false

function mergeDropPartial(partial: Partial<Drop> | Drop): Drop {
  const base = createDefaultTheOathDrop([...DEFAULT_OATH_PRODUCT_IDS])
  const lc = partial.landingContent ?? base.landingContent
  return {
    ...base,
    ...partial,
    landingContent: {
      ...base.landingContent,
      ...lc,
      hero: { ...base.landingContent.hero, ...(lc.hero ?? {}) },
      manifesto: {
        ...base.landingContent.manifesto,
        ...(lc.manifesto ?? {}),
      },
      dropReveal: {
        ...base.landingContent.dropReveal,
        ...(lc.dropReveal ?? {}),
      },
      pieces: { ...base.landingContent.pieces, ...(lc.pieces ?? {}) },
      materials: {
        ...base.landingContent.materials,
        ...(lc.materials ?? {}),
      },
      waitlist: {
        ...base.landingContent.waitlist,
        ...(lc.waitlist ?? {}),
        form: {
          ...base.landingContent.waitlist.form,
          ...(lc.waitlist?.form ?? {}),
        },
      },
    },
    visuals: { ...base.visuals, ...(partial.visuals ?? {}) },
    theme: {
      ...base.theme,
      ...(partial.theme ?? {}),
      colors: {
        ...base.theme.colors,
        ...(partial.theme?.colors ?? {}),
      },
    },
    seo: { ...base.seo, ...(partial.seo ?? {}) },
    productIds:
      Array.isArray(partial.productIds) && partial.productIds.length > 0
        ? [...partial.productIds]
        : [...base.productIds],
  }
}

function parseDropsPayload(raw: string | null): DropsPersistedState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray((parsed as DropsPersistedState).drops)
    )
      return null
    const rawDrops = (parsed as DropsPersistedState).drops
    const merged = rawDrops.map((d) =>
      mergeDropPartial((d ?? {}) as Partial<Drop>),
    )
    if (merged.length === 0) return null
    return { drops: merged }
  } catch {
    return null
  }
}

/** Keep product.dropIds aligned with drop.productIds */
export function syncProductsWithDrop(drop: Drop): void {
  const products = getAdminProducts()
  const next = products.map((p) => {
    const inDrop = drop.productIds.includes(p.id)
    const had = p.dropIds.includes(drop.id)
    if (inDrop && !had) return { ...p, dropIds: [...p.dropIds, drop.id] }
    if (!inDrop && had)
      return { ...p, dropIds: p.dropIds.filter((x) => x !== drop.id) }
    return p
  })
  saveAdminProducts(next)
}

/** Align drop.productIds with product.dropIds after catalog edits. */
export function persistProductDropLinks(product: AdminProduct): void {
  ensureDropSystemHydrated()
  const drops = readDropsArray()
  const activeId = readActiveDropIdRaw()
  const next = drops.map((d) => {
    const shouldHave = product.dropIds.includes(d.id)
    const has = d.productIds.includes(product.id)
    if (shouldHave && !has)
      return { ...d, productIds: [...d.productIds, product.id] }
    if (!shouldHave && has)
      return {
        ...d,
        productIds: d.productIds.filter((pid) => pid !== product.id),
      }
    return d
  })
  persistDropsState(next, activeId)
}

export function detachProductFromAllDrops(productId: string): void {
  ensureDropSystemHydrated()
  const drops = readDropsArray().map((d) => ({
    ...d,
    productIds: d.productIds.filter((pid) => pid !== productId),
  }))
  persistDropsState(drops, readActiveDropIdRaw())
}

export function persistDropsState(
  drops: Drop[],
  activeDropId: string | null,
): void {
  const synced = drops.map((d) => ({
    ...d,
    isActive: activeDropId !== null && d.id === activeDropId,
  }))
  const body: DropsPersistedState = { drops: synced }
  writeDropsRaw(JSON.stringify(body))
  writeActiveDropId(activeDropId)
  synced.forEach(syncProductsWithDrop)
}

export function ensureDropSystemHydrated(): void {
  if (!isBrowser()) return
  if (hydrationRan) return
  hydrationRan = true

  const dropsPayload = parseDropsPayload(readDropsRaw())

  if (dropsPayload && dropsPayload.drops.length > 0) {
    ensureProductsSeededWhenEmpty()
    let activeRaw = readActiveDropIdRaw()
    if (
      !activeRaw ||
      !dropsPayload.drops.some((d) => d.id === activeRaw)
    ) {
      activeRaw =
        dropsPayload.drops.find((d) => d.isActive)?.id ??
        dropsPayload.drops[0]?.id ??
        null
      writeActiveDropId(activeRaw)
    }
    return
  }

  const legacyLandingRaw = readLandingCmsFromStorage()
  if (legacyLandingRaw) {
    const landing = normalizeLandingCmsImport(legacyLandingRaw)
    const drop = landingPageToDrop(landing)
    const layout = landingNavigationToWebsiteLayout(landing, drop.updatedAt)
    persistDropsState([drop], drop.id)
    saveWebsiteLayoutContent(layout)
    ensureProductsSeededWhenEmpty()
    return
  }

  const oath = createDefaultTheOathDrop()
  persistDropsState([oath], oath.id)
  saveWebsiteLayoutContent(createDefaultWebsiteLayout(oath.updatedAt))
  ensureProductsSeededWhenEmpty()
}

export function readDropsArray(): Drop[] {
  if (!isBrowser()) return [createDefaultTheOathDrop()]
  ensureDropSystemHydrated()
  const parsed = parseDropsPayload(readDropsRaw())
  return parsed?.drops?.length ? parsed.drops : [createDefaultTheOathDrop()]
}

export function getActiveDrop(): Drop | null {
  if (!isBrowser()) return createDefaultTheOathDrop()
  ensureDropSystemHydrated()
  const drops = readDropsArray()
  const id = readActiveDropIdRaw()
  const byId = id ? drops.find((d) => d.id === id) : undefined
  const byFlag = drops.find((d) => d.isActive)
  return byId ?? byFlag ?? drops[0] ?? null
}

export function getDropBySlug(slug: string): Drop | undefined {
  return readDropsArray().find((d) => d.slug === slug)
}

export function getDropById(id: string): Drop | undefined {
  return readDropsArray().find((d) => d.id === id)
}

export function saveDrop(
  nextDrop: Drop,
  opts?: { makeActive?: boolean },
): Drop {
  ensureDropSystemHydrated()
  const drops = readDropsArray()
  const idx = drops.findIndex((d) => d.id === nextDrop.id)
  const stamped: Drop = {
    ...nextDrop,
    updatedAt: new Date().toISOString(),
  }
  const mergedList =
    idx === -1
      ? [...drops, stamped]
      : drops.map((d, i) => (i === idx ? stamped : d))

  let activeId = readActiveDropIdRaw()
  if (opts?.makeActive) activeId = stamped.id
  else if (!activeId) activeId = stamped.id

  if (!mergedList.some((d) => d.id === activeId))
    activeId = mergedList[0]?.id ?? null

  persistDropsState(mergedList, activeId)
  syncProductsWithDrop(stamped)
  return mergedList.find((d) => d.id === stamped.id) ?? stamped
}

export function setActiveDrop(dropId: string): void {
  ensureDropSystemHydrated()
  const drops = readDropsArray()
  if (!drops.some((d) => d.id === dropId)) return
  persistDropsState(drops, dropId)
}

export function deleteDrop(dropId: string): void {
  ensureDropSystemHydrated()
  const drops = readDropsArray().filter((d) => d.id !== dropId)
  if (drops.length === 0) {
    const oath = createDefaultTheOathDrop()
    persistDropsState([oath], oath.id)
    return
  }
  let active = readActiveDropIdRaw()
  if (active === dropId) active = drops[0]?.id ?? null
  persistDropsState(drops, active)
}

export function resetDropToDefaults(dropId: string): Drop | null {
  ensureDropSystemHydrated()
  const drops = readDropsArray()
  const existing = drops.find((d) => d.id === dropId)
  if (!existing) return null
  const fresh = mergeDropPartial({
    ...createDefaultTheOathDrop([...DEFAULT_OATH_PRODUCT_IDS]),
    id: existing.id,
    slug: existing.slug,
    name: existing.name,
    createdAt: existing.createdAt,
  })
  return saveDrop(fresh)
}

export function createDraftDrop(): Drop {
  ensureDropSystemHydrated()
  const base = createEmptyDrop()
  saveDrop(base)
  return base
}

/** Dangerous — clears drops + layout + products keys (+ legacy landing). */
export function resetAllLocalCmsKeys(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(DROPS_STORAGE_KEY)
    window.localStorage.removeItem(ACTIVE_DROP_ID_STORAGE_KEY)
    window.localStorage.removeItem('ANVL_PRODUCTS')
    window.localStorage.removeItem('ANVL_WEBSITE_LAYOUT')
    window.localStorage.removeItem(GLOBAL_BRAND_STORAGE_KEY)
    window.localStorage.removeItem('anvl.landingCms.v1')
  } catch {
    /* */
  }
  hydrationRan = false
  ensureDropSystemHydrated()
}

export { DEFAULT_OATH_DROP_ID }
