import type { BannerConfig } from '@/features/cms/banner/bannerConfig.zod'

/**
 * Whether the announcement banner should render right now.
 *
 * Rule: `enabled` AND (no startAt OR now >= startAt) AND (no endAt OR now < endAt).
 * The schedule is optional — a manual enable with both bounds blank is always
 * live. Unparseable datetimes are treated as "no constraint" so a typo can
 * never permanently hide (or pin) the banner. `datetime-local` values carry no
 * timezone, so `Date.parse` interprets them in the viewer's local time — the
 * same clock the admin previews with; minor drift is acceptable by design.
 */
export function isBannerLive(config: BannerConfig, now: number = Date.now()): boolean {
  if (!config.enabled) return false

  const startAt = config.schedule.startAt.trim()
  if (startAt) {
    const startMs = Date.parse(startAt)
    if (Number.isFinite(startMs) && now < startMs) return false
  }

  const endAt = config.schedule.endAt.trim()
  if (endAt) {
    const endMs = Date.parse(endAt)
    if (Number.isFinite(endMs) && now >= endMs) return false
  }

  return true
}
