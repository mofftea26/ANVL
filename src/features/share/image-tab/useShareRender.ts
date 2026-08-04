import { useCallback, useEffect, useRef, useState } from 'react'
import { generateShareImage } from '../image/shareImage'
import type { ShareContext, ShareFormatKey, SharePresetKey } from '../types'
import { shareContentKey } from './shareContentKey'

/**
 * The live preview render, and the small cache the Send tiles share with it.
 *
 * Two things beyond "debounce a canvas call" earn this hook its own file:
 *
 * **Per-format cache.** A Send tile carries the canvas its destination wants
 * (`ShareRoute.format` — an Instagram Story is 9:16 whatever the user is
 * previewing), so a tap may need a DIFFERENT render than the one on screen.
 * Caching by format means the common case — tapping a tile whose format is
 * already on screen — is a synchronous hit, which matters because a launch has
 * to happen inside the gesture (see `openTarget.ts`: `window.open` is popup-
 * blocked and Chrome refuses a gesture-less `intent://`). A miss costs one
 * render; handing Instagram a 4:5 image for a 9:16 story is the worse failure.
 *
 * **`failed`.** A remote piece image without CORS headers taints the canvas and
 * `toDataURL` throws, which `generateShareImage` reports as an empty `dataUrl`.
 * Surfacing it as a flag is what lets the export bar say so instead of showing
 * a dead Download button and eight dead tiles.
 */

const DEBOUNCE_MS = 220

export interface ShareRenderRecord {
  dataUrl: string
  blob: Blob | null
}

export interface ShareRenderState {
  /** The frame to show. Survives a pending re-render on purpose. */
  current: ShareRenderRecord | null
  pending: boolean
  failed: boolean
  /** What the visible frame actually is — the live region reads this. */
  settled: { format: ShareFormatKey; preset: SharePresetKey } | null
  /** Cached render for a format, or null. Never renders; never awaits. */
  peek: (format: ShareFormatKey) => ShareRenderRecord | null
  /** Cached render for a format, rendering it if absent. */
  ensure: (format: ShareFormatKey) => Promise<ShareRenderRecord | null>
}

export function useShareRender(input: {
  format: ShareFormatKey
  preset: SharePresetKey
  content: ShareContext
  photo: CanvasImageSource | null
  photoVersion: number
}): ShareRenderState {
  const { format, preset, content, photo, photoVersion } = input
  const renderKey = `${preset}|${shareContentKey(content, photoVersion)}`

  const cacheRef = useRef<{ key: string; byFormat: Map<ShareFormatKey, ShareRenderRecord> }>({
    key: '',
    byFormat: new Map(),
  })
  const [record, setRecord] = useState<ShareRenderRecord | null>(null)
  const [failed, setFailed] = useState(false)
  const [settled, setSettled] = useState<ShareRenderState['settled']>(null)
  const [pending, setPending] = useState(true)

  // Declared before the render effect so it has already run when that effect
  // reads it — the alternative is listing a context object that is rebuilt on
  // every parent render.
  const latestRef = useRef({ content, photo, preset, renderKey })
  useEffect(() => {
    latestRef.current = { content, photo, preset, renderKey }
  })

  const ensure = useCallback(async (wanted: ShareFormatKey): Promise<ShareRenderRecord | null> => {
    const latest = latestRef.current
    if (cacheRef.current.key !== latest.renderKey) {
      cacheRef.current = { key: latest.renderKey, byFormat: new Map() }
    }
    const cached = cacheRef.current.byFormat.get(wanted)
    if (cached) return cached

    const rendered = await generateShareImage({
      format: wanted,
      preset: latest.preset,
      content: latest.content,
      photo: latest.photo,
    })
    const next: ShareRenderRecord = { dataUrl: rendered.dataUrl, blob: rendered.blob }
    // Only a usable render is worth caching — an empty one is the tainted-canvas
    // failure, and it should be retried rather than remembered.
    if (next.dataUrl && cacheRef.current.key === latest.renderKey) {
      cacheRef.current.byFormat.set(wanted, next)
    }
    return next
  }, [])

  const peek = useCallback((wanted: ShareFormatKey): ShareRenderRecord | null => {
    if (cacheRef.current.key !== latestRef.current.renderKey) return null
    return cacheRef.current.byFormat.get(wanted) ?? null
  }, [])

  useEffect(() => {
    let cancelled = false
    setPending(true)
    const timer = window.setTimeout(() => {
      void ensure(format)
        .then((next) => {
          if (cancelled || !next) return
          setRecord(next.dataUrl ? next : null)
          setFailed(!next.dataUrl)
          setSettled({ format, preset })
        })
        .finally(() => {
          if (!cancelled) setPending(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [ensure, format, preset, renderKey])

  return { current: record, pending, failed, settled, peek, ensure }
}
