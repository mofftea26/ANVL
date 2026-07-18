import type {
  PreviewDraftField,
  PreviewDraftPayload,
  PreviewTarget,
} from '@/features/cms/preview'

/**
 * Admin-side preview channel — a module-level pub/sub (same pattern as the
 * motion-state bridges) connecting editors to the preview panel without prop
 * drilling across the shell:
 *  - editors push their UNSAVED in-memory config per field;
 *  - the panel subscribes and forwards drafts over postMessage;
 *  - locate buttons request a focus, which also opens the panel.
 */
let payload: PreviewDraftPayload = {}
let pendingFocus: PreviewTarget | null = null

const draftListeners = new Set<() => void>()
const focusListeners = new Set<() => void>()

function emit(listeners: Set<() => void>) {
  for (const listener of listeners) listener()
}

export function pushPreviewDraft<K extends PreviewDraftField>(
  field: K,
  value: PreviewDraftPayload[K],
): void {
  payload = { ...payload, [field]: value }
  emit(draftListeners)
}

export function readPreviewDraftPayload(): PreviewDraftPayload {
  return payload
}

/** Editors leave the route → their unsaved draft is gone; drop it here too. */
export function clearPreviewDraft(field: PreviewDraftField): void {
  if (!(field in payload)) return
  const next = { ...payload }
  delete next[field]
  payload = next
  emit(draftListeners)
}

export function subscribePreviewDraft(listener: () => void): () => void {
  draftListeners.add(listener)
  return () => draftListeners.delete(listener)
}

export function requestPreviewFocus(target: PreviewTarget): void {
  pendingFocus = target
  emit(focusListeners)
}

export function consumePreviewFocus(): PreviewTarget | null {
  const target = pendingFocus
  pendingFocus = null
  return target
}

export function hasPendingPreviewFocus(): boolean {
  return pendingFocus !== null
}

export function subscribePreviewFocus(listener: () => void): () => void {
  focusListeners.add(listener)
  return () => focusListeners.delete(listener)
}
