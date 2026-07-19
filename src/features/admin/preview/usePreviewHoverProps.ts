import { useMemo, type MouseEvent, type FocusEvent } from 'react'

import type { PreviewTarget } from '@/features/cms/preview'

import { setPreviewHover } from './adminPreviewStore'

export interface PreviewHoverProps {
  onMouseOver?: (event: MouseEvent) => void
  onMouseLeave?: () => void
  onFocusCapture?: (event: FocusEvent) => void
  onBlurCapture?: () => void
}

/**
 * Inspection-style hover wiring: spread onto an editor field/section wrapper
 * and the live preview highlights the matching storefront element while the
 * mouse (or keyboard focus) is on it — like hovering a node in devtools.
 *
 * Uses bubbling `mouseover` with `stopPropagation`, so scopes NEST: a
 * page-level scope (whole editor → whole page) can wrap section/field scopes,
 * and the innermost hovered scope always wins — moving off an inner section
 * back onto the editor body restores the page-level highlight on the next
 * mouse move (the store dedupes same-target reports).
 *
 * No-op when the preview panel is closed. Pass `null` to disable (spreads {}).
 */
export function usePreviewHoverProps(target: PreviewTarget | null): PreviewHoverProps {
  return useMemo(() => {
    if (!target) return {}
    return {
      onMouseOver: (event: MouseEvent) => {
        event.stopPropagation()
        setPreviewHover(target)
      },
      onMouseLeave: () => setPreviewHover(null),
      onFocusCapture: () => setPreviewHover(target),
      onBlurCapture: () => setPreviewHover(null),
    }
    // Identity by value — callers pass fresh object literals every render.
  }, [target?.kind, target?.id])
}
