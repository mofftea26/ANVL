import type { AdminProduct } from '@/features/admin/products/products.types'
import { ALL_ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'
import type { Drop, DropLandingContent, DropStatus, DropsPersistedState } from './drops.types'
import { normalizeLandingActSequence } from './drops.actSequence'
import {
  readActiveDropIdRaw,
  readDropsRaw,
  writeActiveDropId,
  writeDropsRaw,
  isBrowser,
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
import { landingContentToSimpleActs } from '@/features/admin/drops/acts/landingActs.seed'
import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import {
  dropsPersistedPayloadSchema,
  persistedDropSchema,
} from './drops.persistence.zod'
import { bumpDropsPersistGeneration } from './drops.persistGeneration'

let hydrationRan = false

/** Reset so the next `ensureDropSystemHydrated()` re-reads storage (used after Supabase pull). */
export function resetDropSystemHydrationGate(): void {
  hydrationRan = false
}

/** Resolves `acts` when merging a persisted or partial drop row (Vitest covers edge cases). */
export function resolveActsForMergedDrop(
  partial: Partial<Drop>,
  mergedLanding: DropLandingContent,
): Drop['acts'] {
  if (Object.hasOwn(partial, 'acts') && Array.isArray(partial.acts)) {
    return [...partial.acts]
  }
  return landingContentToSimpleActs(mergedLanding)
}

export function mergeDropPartial(partial: Partial<Drop> | Drop): Drop {
  const base = createDefaultTheOathDrop([...DEFAULT_OATH_PRODUCT_IDS])
  const lc = partial.landingContent ?? base.landingContent
  const mergedLanding = {
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
  }
  return {
    ...base,
    ...partial,
    landingContent: mergedLanding,
    acts: resolveActsForMergedDrop(partial, mergedLanding),
    landingActSequence: normalizeLandingActSequence(
      partial.landingActSequence ?? base.landingActSequence,
    ),
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
    releaseDate: Object.hasOwn(partial, 'releaseDate')
      ? partial.releaseDate
      : base.releaseDate,
    scheduledActivationAt: Object.hasOwn(partial, 'scheduledActivationAt')
      ? partial.scheduledActivationAt
      : base.scheduledActivationAt,
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
    const validated = dropsPersistedPayloadSchema.safeParse(parsed)
    if (!validated.success) return null
    const merged: Drop[] = []
    for (const row of validated.data.drops) {
      const rowOk = persistedDropSchema.safeParse(row)
      if (!rowOk.success) continue
      merged.push(mergeDropPartial(rowOk.data as Partial<Drop>))
    }
    if (merged.length === 0) return null
    return { drops: merged }
  } catch {
    return null
  }
}

function normalizeDropForPersist(drop: Drop, activeDropId: string | null): Drop {
  const isActiveRow = activeDropId !== null && drop.id === activeDropId
  if (isActiveRow) {
    return {
      ...drop,
      isActive: true,
      status: 'active',
      scheduledActivationAt: undefined,
    }
  }
  let nextStatus: DropStatus = drop.status
  if (nextStatus === 'active') nextStatus = 'inactive'
  return { ...drop, isActive: false, status: nextStatus }
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
  bumpDropsPersistGeneration()
  const synced = drops.map((d) => normalizeDropForPersist(d, activeDropId))
  const body: DropsPersistedState = { drops: synced }
  writeDropsRaw(JSON.stringify(body))
  writeActiveDropId(activeDropId)
  synced.forEach(syncProductsWithDrop)
  if (typeof window !== 'undefined' && import.meta.env.MODE !== 'test') {
    void import('@/features/admin/cmsRemote/adminCmsRemoteSync').then((m) =>
      m.scheduleAdminCmsRemoteSync(),
    )
  }
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
  const target = drops.find((d) => d.id === dropId)
  if (!target) return
  persistDropsState(drops, dropId)
}

/** Clears the active campaign when `dropId` is the current active drop. */
export function deactivateDrop(dropId: string): void {
  ensureDropSystemHydrated()
  const activeId = readActiveDropIdRaw()
  if (activeId !== dropId) return
  const drops = readDropsArray()
  persistDropsState(drops, null)
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
  if (active === dropId) {
    active = drops.find((d) => d.id !== dropId)?.id ?? drops[0]?.id ?? null
  }
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

export function createNewDrop(): Drop {
  ensureDropSystemHydrated()
  const base = createEmptyDrop()
  saveDrop(base)
  return base
}

export type CreateNewDropResult =
  | { ok: true; drop: Drop }
  | { ok: false; error: string }

/**
 * Creates a drop in local storage only. Supabase row is inserted on first save.
 */
export async function createNewDropAsync(): Promise<CreateNewDropResult> {
  const drop = createNewDrop()
  if (!getDropById(drop.id)) {
    return {
      ok: false,
      error:
        'The new drop did not appear in storage. Try again or return to the list.',
    }
  }
  return { ok: true, drop }
}

/** @deprecated use createNewDrop */
export const createDraftDrop = createNewDrop

/** @deprecated use createNewDropAsync */
export const createDraftDropAsync = createNewDropAsync

export function duplicateDrop(sourceId: string): Drop | null {
  ensureDropSystemHydrated()
  const drops = readDropsArray()
  const source = drops.find((d) => d.id === sourceId)
  if (!source) return null
  const takenSlugs = new Set(drops.map((d) => d.slug))
  let nextSlug = `${source.slug}-copy`
  let n = 2
  while (takenSlugs.has(nextSlug)) {
    nextSlug = `${source.slug}-copy-${n}`
    n += 1
  }
  const now = new Date().toISOString()
  const dup: Drop = {
    ...source,
    id: createCmsId('drop'),
    slug: nextSlug,
    name: `${source.name} (copy)`,
    title: `${source.title} (copy)`,
    status: 'inactive',
    isActive: false,
    productIds: [],
    scheduledActivationAt: undefined,
    createdAt: now,
    updatedAt: now,
  }
  return saveDrop(dup)
}

export function scheduleDropActivation(id: string, activationIso: string): void {
  ensureDropSystemHydrated()
  const drops = readDropsArray()
  const existing = drops.find((d) => d.id === id)
  if (!existing) return

  let activeId = readActiveDropIdRaw()
  if (activeId === id) {
    activeId = drops.find((d) => d.id !== id)?.id ?? null
  }

  const now = new Date().toISOString()
  const next = drops.map((d) =>
    d.id === id
      ? {
          ...d,
          status: 'scheduled' as const,
          scheduledActivationAt: activationIso,
          isActive: false,
          updatedAt: now,
        }
      : d,
  )
  persistDropsState(next, activeId)
}
/**
 * Dangerous — clears every admin localStorage key (drops + layout +
 * products + brand + legacy landing + site SEO). Sources the key list
 * from src/features/admin/storageKeys.ts so adding a new persisted key
 * automatically includes it in this reset (Phase C3 / MAINT-08).
 */
export function resetAllLocalCmsKeys(): void {
  if (!isBrowser()) return
  try {
    for (const key of ALL_ADMIN_STORAGE_KEYS) {
      window.localStorage.removeItem(key)
    }
  } catch {
    /* */
  }
  hydrationRan = false
  ensureDropSystemHydrated()
}

export { DEFAULT_OATH_DROP_ID }
