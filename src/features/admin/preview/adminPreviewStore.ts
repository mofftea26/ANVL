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
let hoverTarget: PreviewTarget | null = null
let pendingRoute: string | null = null

const draftListeners = new Set<() => void>()
const focusListeners = new Set<() => void>()
const hoverListeners = new Set<() => void>()
const routeListeners = new Set<() => void>()

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

/**
 * Open the preview panel WITHOUT highlighting anything: emits on the focus
 * channel with no pending target — the shell's "a locate request opens the
 * panel" subscription fires (opening it), while the panel's own consumer
 * finds no target and posts nothing. Used by the setup wizards' docked
 * side-by-side mode.
 */
export function openAdminPreview(): void {
  emit(focusListeners)
}

/**
 * Ask the (possibly not-yet-mounted) preview panel to show a storefront
 * route. Pending semantics mirror focus requests: the panel consumes the
 * latest request on mount and on every emission; same-route requests are a
 * no-op there (the iframe only remounts when the route actually changes).
 */
export function requestPreviewRoute(route: string): void {
  pendingRoute = route
  emit(routeListeners)
}

export function consumePreviewRoute(): string | null {
  const route = pendingRoute
  pendingRoute = null
  return route
}

export function subscribePreviewRoute(listener: () => void): () => void {
  routeListeners.add(listener)
  return () => routeListeners.delete(listener)
}

/**
 * Inspection-style hover: editors report which field the mouse/focus is on
 * (null on leave); the open preview panel mirrors it as a live highlight.
 * Unlike focus requests, hovering never opens the panel. Same-target calls
 * are dropped (page-level hover scopes re-report on every mouseover).
 */
export function setPreviewHover(target: PreviewTarget | null): void {
  if (
    (target === null && hoverTarget === null) ||
    (target !== null &&
      hoverTarget !== null &&
      target.kind === hoverTarget.kind &&
      target.id === hoverTarget.id)
  ) {
    return
  }
  hoverTarget = target
  emit(hoverListeners)
}

export function readPreviewHover(): PreviewTarget | null {
  return hoverTarget
}

export function subscribePreviewHover(listener: () => void): () => void {
  hoverListeners.add(listener)
  return () => hoverListeners.delete(listener)
}
