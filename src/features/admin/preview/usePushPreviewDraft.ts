import { useEffect } from 'react'

import type { PreviewDraftField, PreviewDraftPayload } from '@/features/cms/preview'

import { clearPreviewDraft, pushPreviewDraft } from './adminPreviewStore'

const PUSH_DEBOUNCE_MS = 200

/**
 * One-liner for editors: mirrors the editor's in-memory working copy into the
 * preview channel (debounced) so the live-preview iframe tracks unsaved edits.
 * The field's draft is dropped on unmount — leaving the editor discards it.
 */
export function usePushPreviewDraft<K extends PreviewDraftField>(
  field: K,
  value: PreviewDraftPayload[K],
): void {
  useEffect(() => {
    const timer = setTimeout(() => pushPreviewDraft(field, value), PUSH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [field, value])

  useEffect(() => () => clearPreviewDraft(field), [field])
}
