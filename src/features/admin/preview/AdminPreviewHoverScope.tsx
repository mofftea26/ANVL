import type { PropsWithChildren } from 'react'

import type { PreviewTarget } from '@/features/cms/preview'

import { usePreviewHoverProps } from './usePreviewHoverProps'

/**
 * Page-level hover scope for an editor: while the mouse/focus is anywhere in
 * the wrapped editor, the live preview rings `target` — unless a more specific
 * nested scope (a `ContentSection`, an orb fieldset, a slot row) claims the
 * hover via `stopPropagation`. Gives EVERY editor baseline "what am I
 * changing?" feedback with one wrapper; the nested scopes add precision.
 */
export function AdminPreviewHoverScope({
  target,
  anchorId,
  children,
}: PropsWithChildren<{
  target: PreviewTarget
  /**
   * Optional inspector anchor (`previewFieldAnchorId(...)`) for page-level
   * editors whose whole scope IS the target (e.g. coming-soon) — an
   * inspect-click on their storefront element lands here.
   */
  anchorId?: string
}>) {
  const hoverProps = usePreviewHoverProps(target)
  return (
    <div id={anchorId} {...hoverProps}>
      {children}
    </div>
  )
}
