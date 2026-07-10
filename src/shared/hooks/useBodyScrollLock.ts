import { useEffect } from 'react'

/**
 * Locks `<html>`/`<body>` scroll for the lifetime of the calling component —
 * for full-screen dialogs/overlays that must prevent the page underneath
 * from scrolling (global search overlay, the story book).
 */
export function useBodyScrollLock(): void {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])
}
