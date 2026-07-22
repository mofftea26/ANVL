import type { PreviewTarget } from './previewBridge.types'
import { PREVIEW_TARGET_ATTR, setPreviewHoverTarget } from './previewHighlight'

/** Scenes the Oath emits via its existing `data-scene` DOM contract. */
const OATH_SCENES = new Set(['hero', 'manifesto', 'tenets', 'products', 'finale'])

/**
 * Resolve the nearest editable preview target for a DOM node: the closest
 * `[data-anvl-preview-target]` ancestor, falling back to the Oath's
 * `[data-scene]` contract (mapped back to `the-oath:<scene>` ids). The DOM
 * attr carries only the id, so inspect reports use the `content-field` kind —
 * the admin registry resolves by id alone.
 */
export function resolveInspectTarget(node: EventTarget | null): PreviewTarget | null {
  if (!(node instanceof Element)) return null
  const direct = node.closest(`[${PREVIEW_TARGET_ATTR}]`)
  const id = direct?.getAttribute(PREVIEW_TARGET_ATTR)
  if (id) return { kind: 'content-field', id }
  const scene = node.closest('[data-scene]')?.getAttribute('data-scene')
  if (scene && OATH_SCENES.has(scene)) {
    return { kind: 'content-field', id: `the-oath:${scene}` }
  }
  return null
}

export interface PreviewInspectHandlers {
  /** Nearest mapped target under the cursor changed (null = none). */
  onHover: (target: PreviewTarget | null) => void
  /** A mapped element was clicked (unmapped clicks are swallowed silently). */
  onClick: (target: PreviewTarget) => void
  /** Escape pressed inside the iframe — the caller tears inspect mode down. */
  onExit: () => void
}

/**
 * Storefront inspector mode: document-level capture-phase listeners that
 * highlight the hovered mapped element locally (outline + overlay, no
 * scrolling — the element is already under the cursor), report hover/click
 * targets to the admin, and suppress ALL clicks (inspecting must never
 * trigger storefront navigation — mapped or not). Returns a teardown that
 * removes every listener and clears the local highlight.
 */
export function startPreviewInspect(handlers: PreviewInspectHandlers): () => void {
  let lastId: string | null = null

  const applyHover = (target: PreviewTarget | null) => {
    if ((target?.id ?? null) === lastId) return
    lastId = target?.id ?? null
    setPreviewHoverTarget(target, { scroll: false })
    handlers.onHover(target)
  }

  const onPointerOver = (event: Event) => {
    applyHover(resolveInspectTarget(event.target))
  }

  const onPointerOut = (event: Event) => {
    // Only clears when the pointer leaves the document entirely; moves between
    // elements are handled by the next pointerover.
    if ((event as PointerEvent).relatedTarget === null) applyHover(null)
  }

  const onClick = (event: Event) => {
    // Inspect mode must not trigger storefront navigation — even unmapped.
    event.preventDefault()
    event.stopPropagation()
    const target = resolveInspectTarget(event.target)
    if (target) handlers.onClick(target)
    // Unmapped: swallow silently — the admin hover state already reads null.
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    applyHover(null)
    handlers.onExit()
  }

  document.addEventListener('pointerover', onPointerOver, true)
  document.addEventListener('pointerout', onPointerOut, true)
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKeyDown, true)

  return () => {
    document.removeEventListener('pointerover', onPointerOver, true)
    document.removeEventListener('pointerout', onPointerOut, true)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('keydown', onKeyDown, true)
    lastId = null
    setPreviewHoverTarget(null)
  }
}
