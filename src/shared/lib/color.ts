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
