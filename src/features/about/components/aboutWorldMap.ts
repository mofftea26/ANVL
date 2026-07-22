/**
 * The About 'map' preset's world artwork — a hand-authored, code-owned
 * equirectangular continents outline (`public/brand/world-map.svg`, ~3KB,
 * currentColor strokes with a baked muted fallback for `<img>` usage).
 * Shared by the storefront orb renderer and the admin pin-placer so pins are
 * authored on exactly the artwork they render over.
 */
export const ABOUT_WORLD_MAP_SRC = '/brand/world-map.svg'

/** Intrinsic dimensions (the SVG viewBox is 360×180 — a 2:1 equirect). */
export const ABOUT_WORLD_MAP_WIDTH = 720
export const ABOUT_WORLD_MAP_HEIGHT = 360
