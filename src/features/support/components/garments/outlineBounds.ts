import type { SchematicViewBox } from './types'

/**
 * A tight viewBox around a schematic's OUTLINE path alone.
 *
 * `GarmentSchematic.viewBox` frames the whole spec sheet — dimension lines,
 * witness leaders and badge discs included — so it is deliberately much larger
 * than the garment. Anything that draws the silhouette on its own (the size
 * guide's garment-type tab strip) needs the garment's own bounds instead:
 * reusing the sheet box makes each silhouette land at a different scale and a
 * different centre, and a row of them reads ragged.
 *
 * Pure arithmetic over the path string — no DOM, no `getBBox`, so it is safe on
 * the server and computable once at module load.
 */

/** Breathing room around the garment, as a fraction of its larger dimension. */
export const OUTLINE_PADDING = 0.04

type Point = { x: number; y: number }

/**
 * The schematic outlines use absolute `M` / `L` / `C` / `Z` only (asserted by
 * test). Cubic segments contribute their true extrema, not their control hull,
 * so the box is genuinely tight.
 */
export function computeOutlineViewBox(
  outline: string,
  padding: number = OUTLINE_PADDING,
): SchematicViewBox {
  const points = outlinePoints(outline)
  if (points.length === 0) return { x: 0, y: 0, width: 1, height: 1 }

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const width = maxX - minX
  const height = maxY - minY
  const pad = Math.max(width, height) * padding

  return {
    x: minX - pad,
    y: minY - pad,
    width: width + pad * 2,
    height: height + pad * 2,
  }
}

/** Every point the path is guaranteed to touch: node points plus curve extrema. */
function outlinePoints(outline: string): Point[] {
  const points: Point[] = []
  let current: Point = { x: 0, y: 0 }
  let start: Point = { x: 0, y: 0 }

  for (const [, command, rawArgs] of outline.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    const args = (rawArgs ?? '')
      .split(/[\s,]+/)
      .filter((token) => token.length > 0)
      .map(Number)
      .filter((value) => Number.isFinite(value))

    switch (command) {
      case 'M':
      case 'L': {
        for (let i = 0; i + 1 < args.length; i += 2) {
          current = { x: args[i] as number, y: args[i + 1] as number }
          if (command === 'M' && i === 0) start = current
          points.push(current)
        }
        break
      }
      case 'C': {
        for (let i = 0; i + 5 < args.length; i += 6) {
          const c1 = { x: args[i] as number, y: args[i + 1] as number }
          const c2 = { x: args[i + 2] as number, y: args[i + 3] as number }
          const end = { x: args[i + 4] as number, y: args[i + 5] as number }
          points.push(end, ...cubicExtrema(current, c1, c2, end))
          current = end
        }
        break
      }
      case 'Z':
      case 'z': {
        current = start
        break
      }
      default:
        // Unreachable for the shipped schematics; ignoring an unknown command
        // is safer than guessing its arity and corrupting the box.
        break
    }
  }

  return points
}

/** Interior turning points of a cubic Bézier, per axis. */
function cubicExtrema(p0: Point, p1: Point, p2: Point, p3: Point): Point[] {
  const out: Point[] = []
  for (const t of [
    ...axisRoots(p0.x, p1.x, p2.x, p3.x),
    ...axisRoots(p0.y, p1.y, p2.y, p3.y),
  ]) {
    out.push({
      x: cubicAt(p0.x, p1.x, p2.x, p3.x, t),
      y: cubicAt(p0.y, p1.y, p2.y, p3.y, t),
    })
  }
  return out
}

/** Roots of B'(t) = 0 in the open interval (0, 1) for one axis. */
function axisRoots(v0: number, v1: number, v2: number, v3: number): number[] {
  const a = -v0 + 3 * v1 - 3 * v2 + v3
  const b = 2 * (v0 - 2 * v1 + v2)
  const c = v1 - v0

  const inRange = (t: number) => (t > 0 && t < 1 ? [t] : [])

  if (Math.abs(a) < 1e-9) {
    if (Math.abs(b) < 1e-9) return []
    return inRange(-c / b)
  }
  const discriminant = b * b - 4 * a * c
  if (discriminant < 0) return []
  const root = Math.sqrt(discriminant)
  return [...inRange((-b + root) / (2 * a)), ...inRange((-b - root) / (2 * a))]
}

function cubicAt(v0: number, v1: number, v2: number, v3: number, t: number): number {
  const u = 1 - t
  return u * u * u * v0 + 3 * u * u * t * v1 + 3 * u * t * t * v2 + t * t * t * v3
}
