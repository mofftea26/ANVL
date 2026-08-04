import { useEffect, type RefObject } from 'react'

/** Height of the travelling heat blob, in px. Mirrored into the element's inline style. */
export const FAQ_RAIL_HEAT_HEIGHT = 132

/**
 * Drives the molten conduit down the left spine of the FAQ stack: a fixed-size
 * heat blob that travels to the centre of whichever plate is open.
 *
 * Transform-only by design — the blob never resizes, so its glow never smears
 * (a `scaleY`'d box-shadow does). Positions are written straight to the node
 * rather than through React state because the observer fires on every frame of
 * the plate's expand transition, and re-rendering the whole stack that often
 * would be wasteful.
 *
 * `openIndex` is the index into the *rendered* (post-filter) row list, or -1.
 */
export function useFaqRailHeat({
  listRef,
  heatRef,
  openIndex,
}: {
  listRef: RefObject<HTMLUListElement | null>
  heatRef: RefObject<HTMLSpanElement | null>
  openIndex: number
}) {
  useEffect(() => {
    const heat = heatRef.current
    if (!heat) return

    // The list itself unmounts when a search filters everything out — the blob
    // has to go dark for that too, not just for "no plate is open".
    const list = listRef.current
    const row =
      list && openIndex >= 0 ? (list.children[openIndex] as HTMLElement | undefined) : undefined
    if (!list || !row) {
      heat.style.opacity = '0'
      return
    }

    const sync = () => {
      const y = row.offsetTop + row.offsetHeight / 2 - FAQ_RAIL_HEAT_HEIGHT / 2
      heat.style.transform = `translate3d(0, ${y}px, 0)`
      heat.style.opacity = '1'
    }
    sync()

    // jsdom and very old browsers have no ResizeObserver — the blob still lands
    // in the right place, it just won't track the expand animation.
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(sync)
    observer.observe(row)
    observer.observe(list)
    return () => observer.disconnect()
  }, [listRef, heatRef, openIndex])
}
