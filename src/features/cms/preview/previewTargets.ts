import { usePreviewDraft } from './PreviewDraftProvider'
import { PREVIEW_TARGET_ATTR, previewTargetValue } from './previewHighlight'
import type { PreviewTargetKind } from './previewBridge.types'

/**
 * Marks an element as a preview locate target (`context:slot`-style id).
 * Returns `{}` when preview is inactive, so real visitors pay zero DOM cost.
 * Spread onto the element: `<section {...usePreviewTargetProps('asset-slot', 'about:heroImage')}>`.
 */
export function usePreviewTargetProps(
  kind: PreviewTargetKind,
  id: string,
): Record<string, string> {
  const draft = usePreviewDraft()
  if (draft === null) return {}
  return { [PREVIEW_TARGET_ATTR]: previewTargetValue({ kind, id }) }
}
