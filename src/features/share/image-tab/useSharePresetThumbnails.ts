import { useEffect, useMemo, useRef, useState } from 'react'
import type { ShareContext, SharePresetKey } from '../types'
import { shareContentKey } from './shareContentKey'
import { drawPresetThumbnail, loadShareAssets } from './shareThumbnails'

/**
 * Live preset thumbnails for the filmstrip.
 *
 * The cost model is the whole design. Seven canvas renders per content change
 * would visibly jank the sheet if they ran as one blocking loop, so:
 *
 *  - assets are decoded ONCE and shared by all seven draws (see
 *    {@link loadShareAssets});
 *  - the loop yields a frame between presets, so the tap that triggered it
 *    still paints;
 *  - a generation counter cancels an in-flight batch the moment the inputs
 *    change, instead of letting two batches interleave;
 *  - finished thumbnails live in a ref-held Map and only a small revision
 *    counter goes through state — the same reason `useImagePick` keeps pixels
 *    out of React;
 *  - `enabled: false` (the sheet is not on the Image tab) does no work at all.
 */

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'function') {
      resolve()
      return
    }
    requestAnimationFrame(() => resolve())
  })
}

export function useSharePresetThumbnails(input: {
  presetKeys: readonly SharePresetKey[]
  content: ShareContext
  photo: CanvasImageSource | null
  photoVersion: number
  enabled: boolean
}): Partial<Record<SharePresetKey, string>> {
  const { presetKeys, content, photo, photoVersion, enabled } = input

  const identity = shareContentKey(content, photoVersion)
  const keysKey = presetKeys.join(',')

  const cacheRef = useRef<{ identity: string; thumbs: Map<SharePresetKey, string> }>({
    identity: '',
    thumbs: new Map(),
  })
  const generationRef = useRef(0)
  const [revision, setRevision] = useState(0)

  // Declared FIRST so it runs before the worker effect below on the render that
  // changes `identity` — the worker then reads fresh values without listing an
  // object that is rebuilt every render.
  const latestRef = useRef({ content, photo })
  useEffect(() => {
    latestRef.current = { content, photo }
  })

  useEffect(() => {
    if (!enabled) return

    const generation = generationRef.current + 1
    generationRef.current = generation

    // A new identity invalidates every cached thumbnail; keeping the Map
    // scoped to one identity is also what stops it growing without bound.
    if (cacheRef.current.identity !== identity) {
      cacheRef.current = { identity, thumbs: new Map() }
      setRevision((value) => value + 1)
    }

    const keys = keysKey ? (keysKey.split(',') as SharePresetKey[]) : []
    let cancelled = false

    void (async () => {
      const assets = await loadShareAssets(latestRef.current.content)
      for (const key of keys) {
        if (cancelled || generationRef.current !== generation) return
        if (cacheRef.current.thumbs.has(key)) continue

        const dataUrl = drawPresetThumbnail({
          preset: key,
          content: latestRef.current.content,
          photo: latestRef.current.photo,
          assets,
        })
        if (cancelled || generationRef.current !== generation) return
        if (dataUrl) {
          cacheRef.current.thumbs.set(key, dataUrl)
          setRevision((value) => value + 1)
        }
        await nextFrame()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, identity, keysKey])

  return useMemo(() => {
    const out: Partial<Record<SharePresetKey, string>> = {}
    for (const [key, dataUrl] of cacheRef.current.thumbs) out[key] = dataUrl
    return out
    // `revision` is the signal that the ref-held Map changed; the Map itself is
    // deliberately not reactive.
  }, [revision])
}
