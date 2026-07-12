import * as THREE from 'three'

/**
 * Target-shape sampling for the Coming Soon ember anvil.
 *
 * Every shape resolves to a `count × 3` Float32Array of points, all centered on
 * the origin and normalized to the same {@link SHAPE_FIT} bounding box, so the
 * particle cloud can morph between any two of them 1:1 by index. Sources:
 *   - 3D meshes (anvil / hammer GLB) → area-weighted surface sampling
 *   - 2D brand marks (ANVL crest / The Oath SVG) → silhouette pixel sampling
 *   - procedural solids (barbell, compression shirt) → math / canvas paths
 */

/** World size every sampled shape is normalized to — oversized on purpose so
 *  its shoulders spill past the text column at full ember brightness. */
export const SHAPE_FIT = 4.3

/** Center points on the origin and scale so the largest box dim == `fit`. */
export function normalizeToFit(points: Float32Array, fit = SHAPE_FIT): Float32Array {
  const count = points.length / 3
  const box = new THREE.Box3()
  const v = new THREE.Vector3()
  for (let i = 0; i < count; i += 1) box.expandByPoint(v.fromArray(points, i * 3))
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const scale = fit / (Math.max(size.x, size.y, size.z) || 1)
  for (let i = 0; i < count; i += 1) {
    points[i * 3] = (points[i * 3] - center.x) * scale
    points[i * 3 + 1] = (points[i * 3 + 1] - center.y) * scale
    points[i * 3 + 2] = (points[i * 3 + 2] - center.z) * scale
  }
  return points
}

/* ------------------------------------------------------------------ *\
   3D mesh (GLB) surface sampling
\* ------------------------------------------------------------------ */

type Triangle = { ax: number; ay: number; az: number; bx: number; by: number; bz: number; cx: number; cy: number; cz: number; cumArea: number }

/**
 * Collect every finite, non-degenerate world-space triangle in the GLB. Reads
 * positions through the attribute getters so indexed, non-indexed, and
 * interleaved geometries all work (MeshSurfaceSampler chokes silently on some
 * exporter layouts — NaNs in, nothing on screen).
 */
function collectTriangles(scene: THREE.Object3D): Triangle[] {
  scene.updateMatrixWorld(true)
  const triangles: Triangle[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  let cumArea = 0

  scene.traverse((node) => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh) return
    const position = mesh.geometry?.getAttribute('position')
    if (!position) return
    const index = mesh.geometry.getIndex()
    const triCount = (index ? index.count : position.count) / 3
    const vertexAt = (tri: number, corner: number, out: THREE.Vector3) => {
      const i = index ? index.getX(tri * 3 + corner) : tri * 3 + corner
      out.set(position.getX(i), position.getY(i), position.getZ(i))
      out.applyMatrix4(mesh.matrixWorld)
    }
    for (let t = 0; t < triCount; t += 1) {
      vertexAt(t, 0, a)
      vertexAt(t, 1, b)
      vertexAt(t, 2, c)
      const area = ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2
      if (!Number.isFinite(area) || area <= 0) continue
      if (!Number.isFinite(a.x + a.y + a.z + b.x + b.y + b.z + c.x + c.y + c.z)) continue
      cumArea += area
      triangles.push({
        ax: a.x, ay: a.y, az: a.z,
        bx: b.x, by: b.y, bz: b.z,
        cx: c.x, cy: c.y, cz: c.z,
        cumArea,
      })
    }
  })
  return triangles
}

/** Area-weighted surface sampling of `count` points across a GLB, fit-normalized. */
export function sampleMeshSurface(scene: THREE.Object3D, count: number): Float32Array {
  const out = new Float32Array(count * 3)
  const triangles = collectTriangles(scene)

  if (triangles.length === 0) {
    // Defensive: an empty/atypical GLB degrades to a sphere, never a crash.
    const v = new THREE.Vector3()
    for (let i = 0; i < count; i += 1) {
      v.randomDirection().multiplyScalar(1.4 + Math.random() * 0.1)
      out.set([v.x, v.y, v.z], i * 3)
    }
    return normalizeToFit(out)
  }

  const totalArea = triangles[triangles.length - 1].cumArea
  const pickTriangle = (r: number): Triangle => {
    // Binary search the cumulative-area table.
    let lo = 0
    let hi = triangles.length - 1
    const needle = r * totalArea
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (triangles[mid].cumArea < needle) lo = mid + 1
      else hi = mid
    }
    return triangles[lo]
  }

  for (let i = 0; i < count; i += 1) {
    const tri = pickTriangle(Math.random())
    let u = Math.random()
    let v = Math.random()
    if (u + v > 1) {
      u = 1 - u
      v = 1 - v
    }
    const w = 1 - u - v
    out[i * 3] = tri.ax * w + tri.bx * u + tri.cx * v
    out[i * 3 + 1] = tri.ay * w + tri.by * u + tri.cy * v
    out[i * 3 + 2] = tri.az * w + tri.bz * u + tri.cz * v
  }

  return normalizeToFit(out)
}

/* ------------------------------------------------------------------ *\
   2D silhouette sampling (SVG marks + canvas paths)
\* ------------------------------------------------------------------ */

/**
 * Sample `count` points from the opaque pixels of a rasterized 2D shape.
 *
 * The silhouette is laid out flat (z = 0) and normalized to the shared fit on
 * its X/Y extent, THEN given a small fixed world-space thickness. Adding depth
 * before normalization would let it be amplified by the (large) fit scale and
 * balloon the flat mark into a 3D blob — so the emblems stay crisp and legible
 * with just enough body to catch the sway.
 */
function samplePixels(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  count: number,
  zThickness: number,
): Float32Array {
  const out = new Float32Array(count * 3)
  // Collect opaque pixel coordinates (alpha gate rejects anti-aliased fringe).
  const px: number[] = []
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] > 48) px.push(x, y)
    }
  }
  const n = px.length / 2
  if (n === 0) {
    // Empty raster → a small flat disc so a morph target always exists.
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random())
      out.set([Math.cos(a) * r, Math.sin(a) * r, 0], i * 3)
    }
  } else {
    for (let i = 0; i < count; i += 1) {
      const p = (Math.random() * n) | 0
      // Sub-pixel jitter dissolves the raster grid into a smooth cloud.
      const sx = (px[p * 2] + Math.random()) / w
      const sy = (px[p * 2 + 1] + Math.random()) / h
      out[i * 3] = sx - 0.5
      out[i * 3 + 1] = 0.5 - sy // canvas Y is down; world Y is up
      out[i * 3 + 2] = 0
    }
  }
  normalizeToFit(out)
  // Thin slab of depth in fixed world units, applied post-scale.
  for (let i = 0; i < count; i += 1) {
    out[i * 3 + 2] = (Math.random() * 2 - 1) * zThickness
  }
  return out
}

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('2D canvas context unavailable')
  return { canvas, ctx }
}

/**
 * Rasterize a same-origin SVG mark and sample its silhouette into a point
 * cloud. The SVG is fetched as text and given explicit pixel dimensions before
 * decoding so it rasterizes at its viewBox aspect (marks here have a viewBox
 * but no width/height, which some browsers render at a default 300×150).
 */
export async function sampleSvgSilhouette(
  url: string,
  count: number,
  zThickness = 0.22,
): Promise<Float32Array> {
  const size = 320
  const res = await fetch(url)
  let text = await res.text()
  if (!/<svg[^>]*\swidth=/.test(text)) {
    text = text.replace('<svg', `<svg width="${size}" height="${size}"`)
  }
  const objUrl = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }))
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(`SVG silhouette failed: ${url}`))
      image.src = objUrl
    })
    const { ctx } = makeCanvas(size)
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)
    return samplePixels(data, size, size, count, zThickness)
  } finally {
    URL.revokeObjectURL(objUrl)
  }
}

/* ------------------------------------------------------------------ *\
   Procedural solids
\* ------------------------------------------------------------------ */

/** A barbell: a knurled bar with a stack of weight plates at each end. */
export function buildBarbell(count: number): Float32Array {
  const out = new Float32Array(count * 3)
  const barLen = 3.4
  const barR = 0.13
  const plateR = 0.98
  const plateReach = barLen / 2 - 0.08
  const plateHalf = 0.16
  for (let i = 0; i < count; i += 1) {
    if (Math.random() < 0.3) {
      // Bar: points on a cylinder surface running along X.
      const a = Math.random() * Math.PI * 2
      out[i * 3] = (Math.random() - 0.5) * barLen
      out[i * 3 + 1] = Math.cos(a) * barR
      out[i * 3 + 2] = Math.sin(a) * barR
    } else {
      // Plate: a disc facing along X, biased toward the rim so it reads as a ring.
      const side = Math.random() < 0.5 ? -1 : 1
      const a = Math.random() * Math.PI * 2
      const rr = plateR * (0.45 + 0.55 * Math.sqrt(Math.random()))
      out[i * 3] = side * plateReach + (Math.random() * 2 - 1) * plateHalf
      out[i * 3 + 1] = Math.cos(a) * rr
      out[i * 3 + 2] = Math.sin(a) * rr
    }
  }
  return normalizeToFit(out)
}

/** A fitted short-sleeve compression tee silhouette, sampled from a canvas path. */
export function buildShirt(count: number): Float32Array {
  const size = 320
  const { ctx } = makeCanvas(size)
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = '#ffffff'

  // Silhouette control points as fractions of the canvas (x, y-down), traced
  // clockwise from the left neckline: shoulder → sleeve → taper → hem → mirror.
  const s = size
  const pts: Array<[number, number]> = [
    [0.41, 0.17], // neck left
    [0.29, 0.20], // shoulder left
    [0.13, 0.29], // sleeve left, outer top
    [0.10, 0.43], // sleeve left, outer bottom
    [0.27, 0.41], // armpit left
    [0.30, 0.83], // waist left (compression taper)
    [0.33, 0.88], // hem left
    [0.67, 0.88], // hem right
    [0.70, 0.83], // waist right
    [0.73, 0.41], // armpit right
    [0.90, 0.43], // sleeve right, outer bottom
    [0.87, 0.29], // sleeve right, outer top
    [0.71, 0.20], // shoulder right
    [0.59, 0.17], // neck right
  ]
  ctx.beginPath()
  ctx.moveTo(pts[0][0] * s, pts[0][1] * s)
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0] * s, pts[i][1] * s)
  // Scooped neckline back to the start.
  ctx.quadraticCurveTo(0.5 * s, 0.25 * s, pts[0][0] * s, pts[0][1] * s)
  ctx.closePath()
  ctx.fill()

  const { data } = ctx.getImageData(0, 0, size, size)
  return samplePixels(data, size, size, count, 0.24)
}
