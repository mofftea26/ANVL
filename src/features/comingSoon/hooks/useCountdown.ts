import { useEffect, useState } from 'react'
import {
  countdownRemaining,
  type CountdownRemaining,
} from '@/features/comingSoon/lib/countdownTarget'

const ZERO: CountdownRemaining = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  complete: false,
}

/**
 * Ticking distance to `targetMs` (UTC epoch). SSR and the first client render
 * return a stable zero state so hydration never mismatches; the real remaining
 * time appears on the first client tick. Interval is cleaned up on unmount and
 * stops once the target passes.
 */
export function useCountdown(targetMs: number | null): CountdownRemaining {
  const [remaining, setRemaining] = useState<CountdownRemaining>(ZERO)

  useEffect(() => {
    if (targetMs == null) {
      setRemaining(ZERO)
      return
    }
    const tick = () => {
      const next = countdownRemaining(targetMs, Date.now())
      setRemaining(next)
      return next.complete
    }
    if (tick()) return
    const interval = window.setInterval(() => {
      if (tick()) window.clearInterval(interval)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [targetMs])

  return remaining
}
