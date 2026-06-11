/**
 * One-shot handoff of the clicked shelf card's screen rect so the opened book
 * can fly in *from that card*. Set synchronously on click, consumed once when
 * the book mounts (deep-links have no origin → the book just flies in centred).
 */
let pendingOrigin: DOMRect | null = null

export function setOpenOrigin(rect: DOMRect | null): void {
  pendingOrigin = rect
}

export function takeOpenOrigin(): DOMRect | null {
  const origin = pendingOrigin
  pendingOrigin = null
  return origin
}
