/** Drag payload contract for "drag a library card onto a slot" assignment. */
export const MEDIA_DRAG_MIME = 'application/x-anvl-media-id'

export function hasDraggedMedia(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes(MEDIA_DRAG_MIME)
}

/** Only readable inside a `drop` handler (types-only during dragover). */
export function readDraggedMediaId(dataTransfer: DataTransfer): string | null {
  const id = dataTransfer.getData(MEDIA_DRAG_MIME).trim()
  return id.length > 0 ? id : null
}
