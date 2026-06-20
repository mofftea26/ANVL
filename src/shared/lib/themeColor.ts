/**
 * Read a resolved theme CSS custom property (e.g. `--color-highlight`) as a concrete
 * color string, for non-CSS consumers like three.js materials/lights that cannot
 * reference `var(...)`. SSR-safe: returns the fallback on the server.
 *
 * Values are read at call time (typically material/light build), so the WebGL
 * scene picks up the active CMS theme on mount.
 */
export function readThemeCssColor(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  return value || fallback
}
