import { useEffect, useState } from 'react'
import { getCountdownParts, type CountdownParts } from './actPresetUtils'

export function useLiveCountdown(targetIso: string | undefined): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(() =>
    targetIso ? getCountdownParts(targetIso) : null,
  )

  useEffect(() => {
    if (!targetIso?.trim()) {
      setParts(null)
      return
    }
    const tick = () => setParts(getCountdownParts(targetIso))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetIso])

  return parts
}

export function CountdownTiles({
  parts,
  className = 'grid grid-cols-2 gap-3 sm:grid-cols-4',
}: {
  parts: CountdownParts | null
  className?: string
}) {
  if (!parts) return null
  const tiles = [
    ['Days', parts.days],
    ['Hours', parts.hours],
    ['Min', parts.minutes],
    ['Sec', parts.seconds],
  ] as const

  return (
    <div className={className}>
      {tiles.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]/60 px-3 py-4 text-center backdrop-blur-sm"
        >
          <p className="anvl-display text-2xl tabular-nums text-[var(--color-heading)] md:text-3xl">
            {String(value).padStart(2, '0')}
          </p>
          <p className="anvl-micro mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}
