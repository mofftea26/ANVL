/**
 * Cheap, SSR-safe WebGL capability probe. Returns `false` on the server and on
 * browsers/devices where a WebGL context cannot be created — callers fall back
 * to flat (CSS) rendering so no page is ever blank.
 */
export function isWebglAvailable(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl')
    return Boolean(gl)
  } catch {
    return false
  }
}
