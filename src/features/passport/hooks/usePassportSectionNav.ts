import { useEffect, useRef, useState } from 'react'
import type { PassportSectionGroup, PassportSectionKey } from '../components/console/passportSections'

/**
 * The passport's section navigation — shared by the desktop console and the
 * mobile passport so both surfaces behave identically (tab → group, card →
 * detail, back → grid).
 *
 * Structural rule (learned the hard way): the swap is React state + a timer.
 * Animation hooks in through `onOut`/`onIn` callbacks and is pure decoration —
 * if the animation clock ever stalls, the content still swaps and shows.
 */
export function usePassportSectionNav(options: {
  /** Fires immediately when a transition starts (dissolve the embers). */
  onOut?: () => void
  /** Fires right after the content swap (re-forge around the new layout). */
  onIn?: () => void
  /** Delay between the dissolve and the content swap. */
  swapDelayMs: number
}) {
  const { onOut, onIn, swapDelayMs } = options
  const [group, setGroup] = useState<PassportSectionGroup>('craft')
  const [active, setActive] = useState<PassportSectionKey | null>(null)
  const [panelVisible, setPanelVisible] = useState(true)
  const transitioning = useRef(false)
  const swapTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (swapTimer.current !== null) window.clearTimeout(swapTimer.current)
    },
    [],
  )

  const transitionTo = (next: {
    group?: PassportSectionGroup
    section: PassportSectionKey | null
  }) => {
    const nextGroup = next.group ?? group
    if (transitioning.current) return
    if (nextGroup === group && next.section === active) return
    transitioning.current = true

    onOut?.()
    setPanelVisible(false)

    swapTimer.current = window.setTimeout(() => {
      setGroup(nextGroup)
      setActive(next.section)
      setPanelVisible(true)
      onIn?.()
      transitioning.current = false
    }, swapDelayMs)
  }

  return { group, active, panelVisible, transitionTo }
}
