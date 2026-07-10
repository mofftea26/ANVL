import { useEffect, useRef } from 'react'
import { gsap } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { useCountdown } from '@/features/comingSoon/hooks/useCountdown'
import { COMING_SOON_STRIKE_EVENT } from '@/features/comingSoon/scene/ComingSoonScene'
import type { ResolvedComingSoonContent } from '@/features/comingSoon/content/resolveComingSoonContent'

const SEGMENTS = [
  ['days', 'Days'],
  ['hours', 'Hours'],
  ['minutes', 'Min'],
  ['seconds', 'Sec'],
] as const

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** One digit that rolls vertically whenever its character changes. */
function RollingDigit({ char, animate }: { char: string; animate: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(char)

  useEffect(() => {
    if (!animate || prev.current === char) {
      prev.current = char
      return
    }
    prev.current = char
    const el = ref.current
    if (!el) return
    gsap.fromTo(
      el,
      { yPercent: -62, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out', overwrite: true },
    )
  }, [char, animate])

  return (
    <span className="inline-block overflow-hidden">
      <span ref={ref} className="inline-block will-change-transform">
        {char}
      </span>
    </span>
  )
}

/**
 * The launch clock — oversized rolling numerals divided by gold hairlines,
 * built to read as monumental signage rather than a widget. Digits roll on
 * every change; a hammer strike on the forge behind it makes the whole clock
 * flare and kick. Renders nothing without a valid enabled target, and the
 * composition stays complete without it.
 */
export function ComingSoonCountdown({
  countdown,
}: {
  countdown: ResolvedComingSoonContent['countdown']
}) {
  const remaining = useCountdown(countdown.targetMs)
  const reducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)

  // Hammer-strike sympathy: the clock flares with the shockwave.
  useEffect(() => {
    if (reducedMotion) return
    const onStrike = () => {
      const el = rootRef.current
      if (!el) return
      gsap.fromTo(
        el,
        { scale: 1.045, filter: 'brightness(1.6)' },
        {
          scale: 1,
          filter: 'brightness(1)',
          duration: 0.9,
          ease: 'elastic.out(1, 0.5)',
          overwrite: true,
        },
      )
    }
    window.addEventListener(COMING_SOON_STRIKE_EVENT, onStrike)
    return () => window.removeEventListener(COMING_SOON_STRIKE_EVENT, onStrike)
  }, [reducedMotion])

  if (!countdown.enabled || countdown.targetMs == null) return null

  return (
    <div data-cs-reveal="countdown" className="flex flex-col items-center gap-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-[color:color-mix(in_oklab,var(--cs-accent)_80%,white)] [text-shadow:0_1px_10px_rgba(0,0,0,0.9)] sm:text-[11px]">
        {remaining.complete ? 'The Oath has begun' : countdown.label}
      </p>
      <div
        ref={rootRef}
        role="timer"
        aria-live="off"
        aria-label={`${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes remaining`}
        className="flex items-stretch will-change-transform"
      >
        {SEGMENTS.map(([key, label], i) => {
          const value = pad(remaining[key])
          return (
            <div key={key} className="flex items-stretch">
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className="mx-3 w-px bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--cs-accent)_45%,transparent),transparent)] sm:mx-6"
                />
              ) : null}
              <div className="flex min-w-[2.6ch] flex-col items-center gap-1.5 sm:min-w-[3ch]">
                <span className="font-[family-name:var(--font-heading)] text-[clamp(1.6rem,min(6.5vw,5.6vh),4rem)] leading-none tracking-[0.02em] text-[color:var(--color-text)] tabular-nums [text-shadow:0_2px_16px_rgba(0,0,0,0.9),0_0_28px_color-mix(in_oklab,var(--cs-accent)_38%,transparent)]">
                  <RollingDigit char={value[0]} animate={!reducedMotion} />
                  <RollingDigit char={value[1]} animate={!reducedMotion} />
                </span>
                <span className="text-[9px] uppercase tracking-[0.34em] text-[color:color-mix(in_oklab,var(--color-text)_68%,transparent)] [text-shadow:0_1px_8px_rgba(0,0,0,0.9)] sm:text-[10px]">
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
