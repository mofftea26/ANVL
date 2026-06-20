/**
 * CMS color utilities.
 *
 * CMS palette tokens are stored as CSS strings. They may be:
 *  - `#rrggbb` or `#rgb` hex
 *  - `rgb(r,g,b)` / `rgba(r,g,b,a)`
 *  - any other valid CSS value (kept verbatim so we never destroy author intent)
 *
 * The helpers below parse stored strings into `{ r, g, b, a }` for editing, and
 * serialize edits back to the most compact representation possible (hex when
 * alpha is 1, otherwise `rgba(...)`).
 */

export type RgbaColor = {
  r: number
  g: number
  b: number
  a: number
}

const HEX3_RE = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i
const HEX6_RE = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
const HEX8_RE = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
const RGB_RE =
  /^rgba?\(\s*([0-9.]+)\s*[, ]\s*([0-9.]+)\s*[, ]\s*([0-9.]+)\s*(?:[,/ ]\s*([0-9.]+%?))?\s*\)$/i

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

function parseAlphaToken(token: string | undefined): number {
  if (!token) return 1
  const trimmed = token.trim()
  if (!trimmed) return 1
  if (trimmed.endsWith('%')) {
    return clamp(Number(trimmed.slice(0, -1)) / 100, 0, 1)
  }
  return clamp(Number(trimmed), 0, 1)
}

/** Parse any supported CSS color string. Returns `null` when unrecognized. */
export function parseColor(value: string | undefined | null): RgbaColor | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null

  const hex8 = HEX8_RE.exec(raw)
  if (hex8) {
    return {
      r: parseInt(hex8[1], 16),
      g: parseInt(hex8[2], 16),
      b: parseInt(hex8[3], 16),
      a: parseInt(hex8[4], 16) / 255,
    }
  }

  const hex6 = HEX6_RE.exec(raw)
  if (hex6) {
    return {
      r: parseInt(hex6[1], 16),
      g: parseInt(hex6[2], 16),
      b: parseInt(hex6[3], 16),
      a: 1,
    }
  }

  const hex3 = HEX3_RE.exec(raw)
  if (hex3) {
    return {
      r: parseInt(hex3[1] + hex3[1], 16),
      g: parseInt(hex3[2] + hex3[2], 16),
      b: parseInt(hex3[3] + hex3[3], 16),
      a: 1,
    }
  }

  const rgb = RGB_RE.exec(raw)
  if (rgb) {
    return {
      r: clamp(Math.round(Number(rgb[1])), 0, 255),
      g: clamp(Math.round(Number(rgb[2])), 0, 255),
      b: clamp(Math.round(Number(rgb[3])), 0, 255),
      a: parseAlphaToken(rgb[4]),
    }
  }

  return null
}

export function isValidColor(value: string | undefined | null): boolean {
  return parseColor(value) !== null
}

function to2Hex(n: number): string {
  return clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
}

/** Hex with alpha is supported but not all CSS targets accept it; prefer `rgba`. */
export function rgbaToHex(color: RgbaColor): string {
  return `#${to2Hex(color.r)}${to2Hex(color.g)}${to2Hex(color.b)}`
}

/** `#RRGGBB` when opaque; `#RRGGBBAA` with alpha channel when semi-transparent (clipboard / display). */
export function rgbaToClipboardHex(color: RgbaColor): string {
  const r = to2Hex(color.r)
  const g = to2Hex(color.g)
  const b = to2Hex(color.b)
  if (color.a >= 0.999) {
    return `#${r}${g}${b}`.toUpperCase()
  }
  const aByte = to2Hex(Math.round(clamp(color.a * 255, 0, 255)))
  return `#${r}${g}${b}${aByte}`.toUpperCase()
}

export function rgbaToCss(color: RgbaColor): string {
  if (color.a >= 0.999) return rgbaToHex(color)
  const a = Math.round(color.a * 1000) / 1000
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${a})`
}

/** Strip alpha so the value can drive a native `<input type="color">`. */
export function rgbaToHexInputValue(color: RgbaColor): string {
  return rgbaToHex(color)
}

export const SAFE_FALLBACK_COLOR: RgbaColor = { r: 128, g: 128, b: 128, a: 1 }

/* -------------------------------------------------------------------------- *
 * Opacity-aware storage helpers (§14)
 *
 * Some tokens carry alpha (lines, glows, chips, overlays). We prefer storing a
 * solid base hex + a separate opacity number so values are easy to validate,
 * interpolate, and contrast-check. These helpers normalize legacy `rgba(...)`
 * strings into that split form and back.
 * -------------------------------------------------------------------------- */

export type HexWithOpacity = {
  /** Solid `#rrggbb` (alpha stripped). */
  hex: string
  /** 0–1 alpha extracted from the source value. */
  opacity: number
}

/** Split any stored color into a solid hex + opacity. Falls back to grey. */
export function toHexWithOpacity(
  value: string | undefined | null,
  fallbackOpacity = 1,
): HexWithOpacity {
  const parsed = parseColor(value) ?? SAFE_FALLBACK_COLOR
  return {
    hex: rgbaToHex(parsed).toLowerCase(),
    opacity: typeof value === 'string' && parseColor(value) ? parsed.a : fallbackOpacity,
  }
}

/** Recombine a solid hex + opacity into the most compact CSS string. */
export function fromHexWithOpacity(hex: string, opacity: number): string {
  const base = parseColor(hex) ?? SAFE_FALLBACK_COLOR
  return rgbaToCss({ ...base, a: clamp(opacity, 0, 1) })
}

/* -------------------------------------------------------------------------- *
 * Contrast utilities (§6, §13) — WCAG 2.x relative luminance + ratio.
 * Pure and deterministic so theme finalization and the CMS contrast report
 * can share one implementation.
 * -------------------------------------------------------------------------- */

function channelToLinear(channel: number): number {
  const c = clamp(channel, 0, 255) / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance (0 = black, 1 = white). Ignores alpha. */
export function relativeLuminance(color: RgbaColor): number {
  return (
    0.2126 * channelToLinear(color.r) +
    0.7152 * channelToLinear(color.g) +
    0.0722 * channelToLinear(color.b)
  )
}

/**
 * WCAG contrast ratio (1–21) between two colors. Accepts `RgbaColor` or any
 * parseable CSS string; unparseable inputs fall back to the safe grey so the
 * function never throws inside a render path.
 */
export function contrastRatio(
  a: RgbaColor | string,
  b: RgbaColor | string,
): number {
  const ca = typeof a === 'string' ? parseColor(a) ?? SAFE_FALLBACK_COLOR : a
  const cb = typeof b === 'string' ? parseColor(b) ?? SAFE_FALLBACK_COLOR : b
  const la = relativeLuminance(ca)
  const lb = relativeLuminance(cb)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

const NEAR_BLACK = '#111111'
const NEAR_WHITE = '#ffffff'

/**
 * Linearly blend two colors in sRGB (`t` = weight of `b`, 0–1). Returns a
 * concrete `#rrggbb` / `rgba(...)` string so derived theme tokens stay parseable
 * everywhere — including the SSR first-paint payload and three.js — without
 * depending on CSS `color-mix` support.
 */
export function mix(a: string, b: string, t: number): string {
  const ca = parseColor(a) ?? SAFE_FALLBACK_COLOR
  const cb = parseColor(b) ?? SAFE_FALLBACK_COLOR
  const w = clamp(t, 0, 1)
  return rgbaToCss({
    r: ca.r + (cb.r - ca.r) * w,
    g: ca.g + (cb.g - ca.g) * w,
    b: ca.b + (cb.b - ca.b) * w,
    a: ca.a + (cb.a - ca.a) * w,
  })
}

/** Same color at a fixed alpha — for glows/soft fills derived from a brand hue. */
export function withAlpha(color: string, alpha: number): string {
  const c = parseColor(color) ?? SAFE_FALLBACK_COLOR
  return rgbaToCss({ ...c, a: clamp(alpha, 0, 1) })
}

/**
 * Pick the foreground from `candidates` with the best contrast against `bg`.
 * Defaults to near-black vs. near-white — used to derive `--color-on-*` tokens
 * so we never assume white is correct on a branded surface (§6).
 */
export function bestForeground(
  bg: RgbaColor | string,
  candidates: string[] = [NEAR_BLACK, NEAR_WHITE],
): string {
  let best = candidates[0]
  let bestRatio = -1
  for (const candidate of candidates) {
    const ratio = contrastRatio(bg, candidate)
    if (ratio > bestRatio) {
      bestRatio = ratio
      best = candidate
    }
  }
  return best
}

/**
 * Nudge `fg`'s lightness toward black or white (whichever direction helps)
 * until it clears `target` contrast against `bg`, or return the best attempt.
 * Used by the CMS "suggest a fix" affordance — never applied silently (§13).
 */
export function suggestAccessibleColor(
  fg: string,
  bg: string,
  target = 4.5,
): string {
  const fgColor = parseColor(fg) ?? SAFE_FALLBACK_COLOR
  const bgColor = parseColor(bg) ?? SAFE_FALLBACK_COLOR
  if (contrastRatio(fgColor, bgColor) >= target) return rgbaToHex(fgColor)

  // Decide whether lightening or darkening the foreground moves us toward the
  // target faster, then step in that direction.
  const towardWhite = contrastRatio(bgColor, NEAR_WHITE)
  const towardBlack = contrastRatio(bgColor, NEAR_BLACK)
  const dir = towardWhite >= towardBlack ? 1 : -1

  let candidate = { ...fgColor }
  for (let step = 0; step < 24; step++) {
    candidate = {
      r: clamp(candidate.r + dir * 12, 0, 255),
      g: clamp(candidate.g + dir * 12, 0, 255),
      b: clamp(candidate.b + dir * 12, 0, 255),
      a: 1,
    }
    if (contrastRatio(candidate, bgColor) >= target) break
  }
  return rgbaToHex(candidate)
}
