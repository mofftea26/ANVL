import { useEffect, useState } from 'react'

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function formatLongDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00:00:00'
  const sec = Math.floor(ms / 1000)
  const days = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${days}d ${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

type Props = {
  releaseDateIso?: string
  className?: string
}

/**
 * Shows a fixed long-form date on SSR and first paint, then hydrates to a
 * live countdown until the release instant (client only).
 */
export function DropReleaseSection({ releaseDateIso, className }: Props) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    if (!releaseDateIso) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [releaseDateIso])

  if (!releaseDateIso?.trim()) return null

  const target = new Date(releaseDateIso).getTime()
  const invalid = Number.isNaN(target)

  if (invalid) {
    return (
      <section className={className} aria-label="Release">
        <p className="anvl-micro text-[var(--color-text-muted)]">Release date unavailable.</p>
      </section>
    )
  }

  const staticLabel = formatLongDate(releaseDateIso)
  const remaining = now === null ? null : target - now
  const released = remaining !== null && remaining <= 0

  return (
    <section
      className={className}
      aria-label="Campaign release"
    >
      <p className="anvl-micro text-[var(--color-text-muted)]">Release</p>
      <p className="mt-1 font-mono text-lg tracking-tight text-[var(--color-heading)] md:text-xl">
        {now === null ? (
          <time dateTime={releaseDateIso}>{staticLabel}</time>
        ) : released ? (
          <span>Live — campaign released</span>
        ) : remaining !== null ? (
          <span suppressHydrationWarning>{formatCountdown(remaining)}</span>
        ) : (
          <time dateTime={releaseDateIso}>{staticLabel}</time>
        )}
      </p>
      {now !== null && !released ? (
        <p className="mt-1 text-xs text-[var(--color-text-muted)] md:text-sm">
          <time dateTime={releaseDateIso}>{staticLabel}</time>
        </p>
      ) : null}
    </section>
  )
}
