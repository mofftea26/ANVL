import type { ResolvedDropAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { BRAND } from '@/shared/constants/brand'
import { DEFAULT_EMBLEM_SRC } from '@/shared/constants/brandAssets'
import defaultOathShapeSvg from '@/shared/assets/brand/the-oath-shape.svg?raw'
import { isSvgEmblemUrl, themeSvgMarkupForTint } from '@/shared/lib/themeSvgMarkup'

const DEFAULT_THEMED_EMBLEM_MARKUP = themeSvgMarkupForTint(defaultOathShapeSvg)

export function resolveLoadingEmblemUrl(assets: ResolvedDropAssets): string {
  return (
    assets.loadingEmblem?.trim() ||
    assets.dropLogo?.trim() ||
    assets.emblemFallback?.trim() ||
    DEFAULT_EMBLEM_SRC
  )
}

/** Critical above-the-fold URLs to warm before revealing the landing page. */
export function criticalLandingAssetUrls(assets: ResolvedDropAssets): string[] {
  const urls = new Set<string>()
  const emblem = resolveLoadingEmblemUrl(assets)
  if (emblem) urls.add(emblem)
  const heroMode = assets.heroMediaMode === 'image' ? 'image' : 'video'

  if (heroMode === 'image') {
    const heroImage =
      assets.heroImage?.trim() ||
      (assets.heroMedia?.trim() && !isVideoUrl(assets.heroMedia.trim())
        ? assets.heroMedia.trim()
        : undefined)
    if (heroImage) urls.add(heroImage)
  } else {
    if (assets.heroPoster?.trim()) urls.add(assets.heroPoster.trim())
    const desktop =
      assets.heroDesktopVideo?.trim() || assets.heroMedia?.trim()
    const mobile =
      assets.heroMobileVideo?.trim() || desktop
    if (desktop) urls.add(desktop)
    if (mobile && mobile !== desktop) urls.add(mobile)
  }
  return [...urls]
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm)(\?|#|$)/i.test(url)
}

const PRELOAD_TIMEOUT_MS = 6_000

function withTimeout(promise: Promise<void>, ms: number): Promise<void> {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms)
    }),
  ])
}

// Keyed by URL so repeated calls (e.g. the ready-gate effect re-running)
// never spin up a second shadow <video>/<img> and re-download the same
// asset — each URL is only ever fetched once per page session.
const preloadedUrls = new Map<string, Promise<void>>()

function preloadUrl(url: string): Promise<void> {
  const inFlight = preloadedUrls.get(url)
  if (inFlight) return inFlight

  const promise = withTimeout(
    new Promise<void>((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        resolve()
      }

      if (isVideoUrl(url)) {
        // Only warm metadata (duration/dimensions) here — the real <video>
        // element rendered by the hero (preload="auto") is what streams the
        // full file for playback. Preloading with preload="auto" here would
        // download the entire video a second time.
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.muted = true
        video.playsInline = true
        video.addEventListener('loadedmetadata', finish, { once: true })
        video.addEventListener('error', finish, { once: true })
        video.src = url
        video.load()
        return
      }

      const img = new Image()
      img.decoding = 'async'
      img.addEventListener('load', finish, { once: true })
      img.addEventListener('error', finish, { once: true })
      img.src = url
    }),
    PRELOAD_TIMEOUT_MS,
  )

  preloadedUrls.set(url, promise)
  return promise
}

const CHUNK_READY_PROGRESS = 0.22

/**
 * Preload the landing JS chunk (already done when this runs) plus critical media.
 * Progress is normalized 0–1: chunk ready ≈ 22%, assets fill the rest.
 */
export async function preloadLandingEntryAssets(
  assets: ResolvedDropAssets,
  onProgress: (progress: number) => void,
): Promise<void> {
  onProgress(CHUNK_READY_PROGRESS)

  const urls = criticalLandingAssetUrls(assets)
  if (urls.length === 0) {
    onProgress(1)
    return
  }

  let done = 0
  const assetSpan = 1 - CHUNK_READY_PROGRESS

  await Promise.all(
    urls.map(async (url) => {
      await preloadUrl(url)
      done += 1
      onProgress(CHUNK_READY_PROGRESS + (done / urls.length) * assetSpan)
    }),
  )

  onProgress(1)
}

export const LANDING_ENTRY_CHUNK_CREEP_MAX = 0.18

/** Hard cap so the overlay never traps the page if preload or Suspense stalls. */
export const LANDING_ENTRY_OVERLAY_MAX_MS = 12_000

function absoluteEmblemFetchUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${url}`
    }
    const base =
      import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') ||
      BRAND.canonicalBaseUrl.replace(/\/$/, '')
    return `${base}${url}`
  }
  return url
}

function isDefaultEmblemUrl(url: string): boolean {
  const trimmed = url.trim()
  return (
    trimmed === DEFAULT_EMBLEM_SRC ||
    trimmed.endsWith('/brand/the-oath-shape.svg')
  )
}

/** SSR-safe themed SVG markup — no client fetch delay on first paint. */
export async function resolveThemedSvgMarkup(
  url: string,
): Promise<string | null> {
  const trimmed = url.trim()
  if (!trimmed || !isSvgEmblemUrl(trimmed)) return null
  if (isDefaultEmblemUrl(trimmed)) return DEFAULT_THEMED_EMBLEM_MARKUP

  try {
    const res = await fetch(absoluteEmblemFetchUrl(trimmed), {
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) return null
    return themeSvgMarkupForTint(await res.text())
  } catch {
    return null
  }
}

/** SSR-safe themed SVG markup for the loading emblem — no client fetch delay. */
export async function resolveThemedLoadingEmblemMarkup(
  emblemUrl: string,
): Promise<string | null> {
  return resolveThemedSvgMarkup(emblemUrl)
}
