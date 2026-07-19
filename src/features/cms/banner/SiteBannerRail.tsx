import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import { resolveMediaUrl } from '@/features/cms/assets/resolvePublishedAssets'
import { usePreviewTargetProps } from '@/features/cms/preview'
import { useBannerConfig } from '@/features/cms/banner/useBannerConfig'
import { isBannerLive } from '@/features/cms/banner/isBannerLive'
import type { BannerConfig } from '@/features/cms/banner/bannerConfig.zod'
import { sanitizeHref } from '@/shared/lib/url'

/** Schedule re-evaluation cadence — the banner appears/expires without reload. */
const BANNER_CLOCK_MS = 60_000

/**
 * CSS var carrying the live banner height. `PremiumNav`'s fixed header is
 * shifted down by it (see the injected rule below) and everything else flows
 * naturally because the rail itself is sticky IN FLOW — content below needs no
 * extra offset, on SSR or after hydration.
 */
const BANNER_HEIGHT_VAR = '--anvl-banner-h'

/**
 * Offsets the storefront's fixed header below the banner without touching
 * `PremiumNav` internals — keyed on its stable `data-premium-nav-position`
 * attribute. Only rendered while the banner is live, so the rule costs nothing
 * otherwise. The var defaults to 0px until the ResizeObserver measures.
 */
const NAV_OFFSET_CSS = `header[data-premium-nav-position="overlay"]{top:var(${BANNER_HEIGHT_VAR},0px);}`

/**
 * Site-wide announcement banner — a CMS-controlled strip at the very top of
 * the storefront, above the topbar. Rendered in `__root.tsx`'s
 * StorefrontLayout before `<PremiumNav>`. SSR renders it whenever the config
 * is live so the first paint is correct (the rail is in normal flow); a 60s
 * client clock re-evaluates the optional schedule so it appears/expires
 * without a reload. Inside the admin live-preview iframe, unsaved banner
 * edits win via `useBannerConfig`.
 */
export function SiteBannerRail({
  initial,
  mediaIndex,
}: {
  initial: BannerConfig
  mediaIndex: MediaIndexEntry[]
}) {
  const config = useBannerConfig(initial)
  const previewTarget = usePreviewTargetProps('content-field', 'banner:rail')

  // Server and client both compute liveness from config + Date.now(); the
  // interval (client-only, cleared on unmount) keeps schedules honest in
  // long-lived tabs. Minor SSR/CSR clock drift is acceptable by design.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), BANNER_CLOCK_MS)
    return () => clearInterval(id)
  }, [])

  const message = config.message.trim()
  const imageUrl = resolveMediaUrl(config.imageMediaId.trim() || undefined, mediaIndex)
  const live = isBannerLive(config, now) && (message.length > 0 || Boolean(imageUrl))

  // Publish the measured height on :root so the fixed header can offset by it.
  const railRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const root = document.documentElement
    const el = railRef.current
    if (!live || !el) {
      root.style.setProperty(BANNER_HEIGHT_VAR, '0px')
      return
    }
    const apply = () =>
      root.style.setProperty(BANNER_HEIGHT_VAR, `${el.offsetHeight}px`)
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => {
      observer.disconnect()
      root.style.setProperty(BANNER_HEIGHT_VAR, '0px')
    }
  }, [live])

  if (!live) return null

  const safeHref = sanitizeHref(config.href)
  const linkLabel = config.linkLabel.trim()

  const railStyle: CSSProperties = {
    backgroundColor: config.colors.background.trim() || 'var(--color-accent)',
    color: config.colors.text.trim() || 'var(--color-on-highlight)',
  }

  const image = imageUrl ? (
    <img
      src={imageUrl}
      alt=""
      className="h-5 w-auto shrink-0 object-contain"
      loading="lazy"
      decoding="async"
      aria-hidden="true"
    />
  ) : null

  return (
    <div
      ref={railRef}
      data-anvl-banner
      className="sticky top-0 z-50 w-full"
      style={railStyle}
      {...previewTarget}
    >
      <style>{NAV_OFFSET_CSS}</style>
      <div className="mx-auto flex min-h-9 max-w-[var(--anvl-content-max)] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-center text-xs font-medium tracking-[0.04em] sm:text-sm">
        {image}
        {safeHref && !linkLabel ? (
          <a
            href={safeHref}
            className="focus-ring underline-offset-4 hover:underline"
            style={{ color: 'inherit' }}
          >
            {message}
          </a>
        ) : (
          <span>{message}</span>
        )}
        {safeHref && linkLabel ? (
          <a
            href={safeHref}
            className="focus-ring shrink-0 font-semibold underline underline-offset-4"
            style={{ color: 'inherit' }}
          >
            {linkLabel}
          </a>
        ) : null}
      </div>
    </div>
  )
}
