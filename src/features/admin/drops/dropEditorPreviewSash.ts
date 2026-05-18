/** Live preview column width when resizing the drop editor (xl). */
export const DROP_EDITOR_PREVIEW_MIN_PX = 320

/** Upper bound as a fraction of the split container width. */
export const DROP_EDITOR_PREVIEW_MAX_VIEWPORT_RATIO = 0.7

/** Drag gutter width (visual + hit target lives in padding on the control). */
export const DROP_EDITOR_PREVIEW_SASH_PX = 10

/**
 * Keeps the preview column within [min px, 70% of container], collapsing the
 * range when the container is too narrow (see tests).
 */
export function clampDropEditorPreviewWidthPx(
  previewWidthPx: number,
  containerWidthPx: number,
): number {
  if (!(Number.isFinite(previewWidthPx) && Number.isFinite(containerWidthPx))) {
    return DROP_EDITOR_PREVIEW_MIN_PX
  }
  if (containerWidthPx <= 0) {
    return DROP_EDITOR_PREVIEW_MIN_PX
  }

  const maxPreview = Math.floor(
    containerWidthPx * DROP_EDITOR_PREVIEW_MAX_VIEWPORT_RATIO,
  )
  const minPreview = DROP_EDITOR_PREVIEW_MIN_PX
  const lo = Math.min(minPreview, maxPreview)
  const hi = Math.max(lo, maxPreview)
  return Math.round(Math.min(hi, Math.max(lo, previewWidthPx)))
}
