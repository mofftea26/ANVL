import { useEffect, useState } from 'react'

/**
 * Site-wide WebGL canvas teardown coordination.
 *
 * `@react-three/fiber`'s `<Canvas>` defers its actual WebGL context release
 * (`gl.forceContextLoss()`) by 500ms after unmount (see
 * `unmountComponentAtNode` in `@react-three/fiber`'s source). The storefront
 * mounts several independent `<Canvas>` layers across routes — the Oath
 * landing's monolith/dust, the site-wide cursor dust, the Story shelf/open
 * book, the About Forge Altar — and a fast route change can unmount one of
 * them and mount another within that 500ms window. The old, not-yet-released
 * context and the new one then briefly coexist and can push the browser over
 * its live WebGL context budget, which loses/evicts a context
 * (`THREE.WebGLRenderer: Context Lost`) and leaves a scene blank until a full
 * page reload.
 *
 * Every component that owns a `<Canvas>` should call {@link useCanvasTeardownMark}
 * so its unmount is recorded here; any gate that decides whether it's safe to
 * mount a *new* canvas should call {@link useCanvasMountGate} to wait out the
 * window instead of racing it.
 */
const CANVAS_TEARDOWN_MS = 550
let lastTeardownAt = 0

export function markCanvasTeardown(): void {
  lastTeardownAt = performance.now()
}

/** Call in a component that owns a `<Canvas>` — marks the shared timestamp on unmount. */
export function useCanvasTeardownMark(): void {
  useEffect(() => {
    return () => {
      markCanvasTeardown()
    }
  }, [])
}

/**
 * Returns whether it's safe to mount a `<Canvas>` right now: `false` while
 * waiting out the teardown window from the most recent WebGL canvas unmount
 * anywhere on the site, `true` once clear. `active` gates entry — pass the
 * mount gate's own capability/media-query condition.
 */
export function useCanvasMountGate(active: boolean): boolean {
  const [mountable, setMountable] = useState(false)

  useEffect(() => {
    if (!active) {
      setMountable(false)
      return
    }
    const elapsed = performance.now() - lastTeardownAt
    if (elapsed >= CANVAS_TEARDOWN_MS) {
      setMountable(true)
      return
    }
    const id = window.setTimeout(() => setMountable(true), CANVAS_TEARDOWN_MS - elapsed)
    return () => window.clearTimeout(id)
  }, [active])

  return mountable
}
