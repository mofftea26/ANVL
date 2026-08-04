import { useCallback, useRef, type KeyboardEvent } from 'react'

/**
 * Roving tabindex + arrow keys for a single-selection group — `role="tablist"`
 * or `role="radiogroup"`, which want the identical interaction.
 *
 * Such a group is ONE tab stop: Tab moves past the whole control, arrows move
 * the selection inside it. Without this a keyboard user tabs through every
 * format and then every preset one at a time, which is exactly what the format
 * switch used to do. All THREE groups in the sheet — the top-level tablist, the
 * format switch and the preset filmstrip — run on this, so three
 * identical-looking interactions cannot drift apart. (It lives at the feature
 * root rather than under `image-tab/` for that reason: the tablist is the
 * sheet's, not the image tab's.)
 */
export function useRovingRadio<K extends string>(
  keys: readonly K[],
  value: K,
  onChange: (next: K) => void,
): {
  register: (key: K) => (node: HTMLElement | null) => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  /** The registered element, for callers that also need to scroll it into view. */
  getNode: (key: K) => HTMLElement | null
} {
  const nodes = useRef(new Map<K, HTMLElement>())

  const register = useCallback(
    (key: K) => (node: HTMLElement | null) => {
      if (node) nodes.current.set(key, node)
      else nodes.current.delete(key)
    },
    [],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const index = keys.indexOf(value)
      if (index < 0) return

      const last = keys.length - 1
      let target: number | null = null
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = index === last ? 0 : index + 1
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = index === 0 ? last : index - 1
      else if (event.key === 'Home') target = 0
      else if (event.key === 'End') target = last
      if (target === null) return

      const next = keys[target]
      if (!next) return
      event.preventDefault()
      onChange(next)
      // Selection follows focus, so focus has to follow selection.
      nodes.current.get(next)?.focus()
    },
    [keys, onChange, value],
  )

  const getNode = useCallback((key: K) => nodes.current.get(key) ?? null, [])

  return { register, onKeyDown, getNode }
}
