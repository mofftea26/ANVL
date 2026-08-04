import { readAssetConfigFromStorage } from '@/features/cms/config/cmsSiteConfig.settings'
import type { AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import { readBannerConfigFromStorage } from '@/features/cms/banner/bannerConfig.settings'
import { readComingSoonConfigFromStorage } from '@/features/cms/comingSoon/comingSoon.settings'
import { readLandingContentFromStorage } from '@/features/cms/landingContent/landingContent.settings'
import { readPassportContentFromStorage } from '@/features/cms/passportContent/passportContent.settings'
import { readPdpContentFromStorage } from '@/features/cms/pdpContent/pdpContent.settings'

/**
 * Where every CMS blob keeps its media-id references (G4).
 *
 * The old implementation deep-collected EVERY string in every blob, so plain
 * copy ("Forged under pressure"), slugs, hrefs, and stale hidden-slot leftovers
 * all counted as "assignments" and the media library's Assigned badge could
 * never go back to Unassigned. This version walks each blob with an explicit
 * per-blob allowlist of the fields that actually hold media ids, and records a
 * human-readable label for each reference so the badge can say WHERE an asset
 * is used.
 *
 * Out of scope: Story media (relational Supabase tables, not a config blob)
 * and shop_config / legal_content / support_content, which define no media-id
 * fields.
 */

type Usage = Map<string, string[]>

function addUsage(usage: Usage, id: unknown, label: string): void {
  if (typeof id !== 'string') return
  const trimmed = id.trim()
  if (!trimmed) return
  const labels = usage.get(trimmed)
  if (labels) {
    if (!labels.includes(label)) labels.push(label)
  } else {
    usage.set(trimmed, [label])
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/** Slot maps: every value in general/drops/pages IS an assignment. Select-slot
 *  option values ('video', 'image', …) ride along harmlessly — they can never
 *  collide with a media id. */
function collectAssetConfig(config: AssetConfig, usage: Usage): void {
  for (const [key, value] of Object.entries(config.general)) {
    addUsage(usage, value, `Slot: general/${key}`)
  }
  for (const [dropKey, slots] of Object.entries(config.drops)) {
    for (const [key, value] of Object.entries(slots)) {
      addUsage(usage, value, `Slot: ${dropKey}/${key}`)
    }
  }
  for (const [pageKey, slots] of Object.entries(config.pages ?? {})) {
    for (const [key, value] of Object.entries(slots)) {
      addUsage(usage, value, `Slot: page ${pageKey}/${key}`)
    }
  }
}

/** Keys that hold a media id inside landing_content page slices (the-oath
 *  tenets/hotspots, About orbs). Enumerated from the page content schemas:
 *  `oathContent.schema.ts` (mediaId/modelId/bgId, hotspot bubbleId) and
 *  `aboutContent.schema.ts` (orb mediaId). */
const LANDING_MEDIA_ID_KEYS = new Set(['mediaId', 'modelId', 'bgId', 'bubbleId'])

function walkLandingSlice(value: unknown, usage: Usage, label: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => walkLandingSlice(item, usage, `${label} ${i + 1}`))
    return
  }
  const record = asRecord(value)
  if (!record) return
  for (const [key, child] of Object.entries(record)) {
    if (LANDING_MEDIA_ID_KEYS.has(key)) {
      addUsage(usage, child, label)
    } else if (child && typeof child === 'object') {
      const childLabel =
        key === 'orbs'
          ? `${label} orb`
          : key === 'items'
            ? `${label} item`
            : key === 'hotspots'
              ? `${label} hotspot`
              : `${label} ${key}`
      walkLandingSlice(child, usage, childLabel)
    }
  }
}

function collectLandingContent(usage: Usage): void {
  const envelope = asRecord(readLandingContentFromStorage())
  if (!envelope) return
  for (const [pageKey, slice] of Object.entries(envelope)) {
    const label = pageKey === 'about' ? 'About' : `Landing ${pageKey}`
    walkLandingSlice(slice, usage, label)
  }
}

/** pdp_content media-id fields (see `pdpContent.zod.ts`). */
const PDP_MEDIA_FIELDS: { key: string; label: string }[] = [
  { key: 'materialMacro', label: 'material macro' },
  { key: 'lifestyleImage', label: 'lifestyle' },
  { key: 'ambientBackdrop', label: 'ambient backdrop' },
  { key: 'sizeGuideDiagram', label: 'size-guide diagram' },
]

/**
 * Media ids hiding one level down, inside a LIST of cards.
 *
 * `materials[].image` and `details[].image` are real, rendered card backdrops
 * (`pdpMaterialSchema.image` / `pdpDetailSchema.image`), and the passport
 * reuses the material shape. They are not top-level keys, so the flat walk
 * above skipped them and the library reported them unassigned — offering to
 * delete an asset a live bento card is drawing.
 */
const CARD_LIST_MEDIA_FIELDS: { key: string; label: string }[] = [
  { key: 'materials', label: 'material card' },
  { key: 'details', label: 'detail card' },
]

function collectCardListImages(
  record: Record<string, unknown>,
  usage: Usage,
  prefix: string,
): void {
  for (const { key, label } of CARD_LIST_MEDIA_FIELDS) {
    const list = record[key]
    if (!Array.isArray(list)) continue
    list.forEach((item, i) =>
      addUsage(usage, asRecord(item)?.image, `${prefix} — ${label} ${i + 1}`),
    )
  }
}

function collectPdpContent(usage: Usage): void {
  const config = asRecord(readPdpContentFromStorage())
  if (!config) return
  for (const [slug, content] of Object.entries(config)) {
    const record = asRecord(content)
    if (!record) continue
    for (const { key, label } of PDP_MEDIA_FIELDS) {
      addUsage(usage, record[key], `PDP ${slug} — ${label}`)
    }
    collectCardListImages(record, usage, `PDP ${slug}`)
  }
}

/**
 * passport_content media-id fields per section (see `passportContent.zod.ts`).
 *
 * The placed markers (`blueprint/specs/fit.points`, `hotspots`) reference no
 * media at all — they are coordinates plus text, pinned to `piece.heroRender`,
 * which is already listed below. Adding a per-section image would mean adding
 * a row here, or the library would offer to delete an image the passport is
 * actively rendering.
 */
const PASSPORT_MEDIA_FIELDS: { section: string; key: string; label: string }[] = [
  { section: 'piece', key: 'heroRender', label: 'hero render' },
  { section: 'material', key: 'macroAsset', label: 'material macro' },
  { section: 'care', key: 'asset', label: 'care illustration' },
  { section: 'details', key: 'asset', label: 'detail shot' },
  { section: 'origin', key: 'asset', label: 'origin image' },
]

function collectPassportContent(usage: Usage): void {
  const config = asRecord(readPassportContentFromStorage())
  if (!config) return
  for (const [slug, content] of Object.entries(config)) {
    const record = asRecord(content)
    if (!record) continue
    for (const { section, key, label } of PASSPORT_MEDIA_FIELDS) {
      addUsage(usage, asRecord(record[section])?.[key], `Passport ${slug} — ${label}`)
    }
    const gallery = asRecord(record.piece)?.gallery
    if (Array.isArray(gallery)) {
      gallery.forEach((id, i) =>
        addUsage(usage, id, `Passport ${slug} — gallery ${i + 1}`),
      )
    }
    // The passport authors the same structured fabric cards the PDP does, and
    // resolves each `image` to a URL (`resolvePassportContent`), so they are
    // assignments too.
    const material = asRecord(record.material)
    if (material) collectCardListImages(material, usage, `Passport ${slug}`)
  }
}

/** coming_soon media-id fields (see `comingSoon.zod.ts`). */
function collectComingSoon(usage: Usage): void {
  const config = readComingSoonConfigFromStorage()
  addUsage(usage, config.backgroundMediaId, 'Coming Soon — background')
  addUsage(usage, config.ambientMediaId, 'Coming Soon — ambient video')
  addUsage(usage, config.logoMediaId, 'Coming Soon — logo')
  addUsage(usage, config.ogImageMediaId, 'Coming Soon — social share image')
}

/** banner_config media-id field (see `bannerConfig.zod.ts`). */
function collectBanner(usage: Usage): void {
  addUsage(usage, readBannerConfigFromStorage().imageMediaId, 'Banner — image')
}

/**
 * Per-source usage map: media id → human-readable labels of every place that
 * references it (asset slots, landing/About content, PDP, passport,
 * Coming Soon, banner). Pass the Assets editor's live working copy as
 * `assetConfigOverride` so in-panel slot edits reflect immediately, before they
 * are persisted. All other blobs are read from their persisted stores (they can
 * only change on their own editor routes, so a fresh read on mount is current).
 */
export function collectAssignedMediaUsage(assetConfigOverride?: AssetConfig): Usage {
  const usage: Usage = new Map()
  collectAssetConfig(assetConfigOverride ?? readAssetConfigFromStorage(), usage)
  collectLandingContent(usage)
  collectPdpContent(usage)
  collectPassportContent(usage)
  collectComingSoon(usage)
  collectBanner(usage)
  return usage
}

/**
 * Every media id referenced by a media-id field in any CMS content blob —
 * `set.has(asset.id)` answers "is this library item used by *any* editor?".
 */
export function collectAssignedMediaIds(
  assetConfigOverride?: AssetConfig,
): Set<string> {
  return new Set(collectAssignedMediaUsage(assetConfigOverride).keys())
}
