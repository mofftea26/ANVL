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
  children,
}: PropsWithChildren<{ target: PreviewTarget }>) {
  const hoverProps = usePreviewHoverProps(target)
  return <div {...hoverProps}>{children}</div>
}
