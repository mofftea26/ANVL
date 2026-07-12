import * as THREE from 'three'

/**
 * Shared point-cloud shape sampling for particle-morph scenes.
 *
 * Both the Coming Soon ember forge and The Oath hero product showcase morph a
 * fixed pool of GPU particles between target shapes. Every target is a
 * `count × 3` Float32Array, centered on the origin and normalized to a common
 * fit so any two shapes morph 1:1 by particle index. This module holds the
 * generic samplers; scene-specific sources (SVG silhouettes, procedural
 * solids) live with their feature.
 */

/** Center points on the origin and scale so the largest box dim == `fit`. */
export function normalizeToFit(points: Float32Array, fit: number): Float32Array {
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

/** A sampled 2D silhouette: flat point cloud + per-point brightness (0..1). */
export interface SilhouetteCloud {
  positions: Float32Array
  /** Luminance of the source pixel, normalized to the image's brightest point —
   *  lets shaders make light graphics glow within a dark garment. */
  shades: Float32Array
}

/** Fallback silhouette — a soft flat disc, so a morph target always exists. */
function fallbackDisc(count: number, fit: number, zThickness: number): SilhouetteCloud {
  const positions = new Float32Array(count * 3)
  const shades = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random())
    positions.set([Math.cos(a) * r, Math.sin(a) * r, 0], i * 3)
    shades[i] = 0.35
  }
  normalizeToFit(positions, fit)
  for (let i = 0; i < count; i += 1) {
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * zThickness
  }
  return { positions, shades }
}

/**
 * Sample `count` points from the opaque pixels of a transparent-background
 * image (product render, brand mark) — the 2D-silhouette technique shared with
 * the Coming Soon emblems. Points are mapped in **image-box coordinates**
 * (the full canvas, transparent padding included, largest dim == `fit`, box
 * centre == origin) — NOT the tight pixel bounds — because the DOM reveal
 * `object-contain`s the same image box: the particle form and the rendered
 * pixels then match in size *and* position regardless of how much padding the
 * upload carries. Depth is a small **fixed world-space** thickness (applied
 * after scaling, so the fit can never balloon a flat render into a blob).
 * Each point carries the source pixel's relative luminance, so printed
 * graphics read through the ember form. CORS-tainted or undecodable images
 * degrade to a disc — a broken CMS upload can never blank the scene.
 */
export async function sampleImageSilhouette(
  url: string,
  count: number,
  fit: number,
  zThickness = 0.24,
): Promise<SilhouetteCloud> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(`silhouette image failed: ${url}`))
      image.src = url
    })
    // Cap the raster — silhouette sampling needs shape, not resolution.
    const maxDim = 300
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return fallbackDisc(count, fit, zThickness)
    ctx.drawImage(img, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)

    // Opaque pixels only (alpha gate rejects anti-aliased fringe), with
    // per-pixel luminance for the shade channel. Flat triplets: x, y, lum‰.
    const px: number[] = []
    let maxLum = 0
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const o = (y * w + x) * 4
        if (data[o + 3] <= 48) continue
        const lum = (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) / 255
        if (lum > maxLum) maxLum = lum
        px.push(x, y, lum * 1000)
      }
    }
    const n = px.length / 3
    if (n < 32) return fallbackDisc(count, fit, zThickness)

    const positions = new Float32Array(count * 3)
    const shades = new Float32Array(count)
    const lumScale = maxLum > 0.01 ? 1 / (maxLum * 1000) : 0
    // Image-box mapping: largest image dim → `fit`, box centre → origin.
    const worldScale = fit / Math.max(w, h)
    for (let i = 0; i < count; i += 1) {
      const p = (Math.random() * n) | 0
      // Sub-pixel jitter dissolves the raster grid into a smooth cloud.
      positions[i * 3] = (px[p * 3] + Math.random() - w / 2) * worldScale
      positions[i * 3 + 1] = (h / 2 - px[p * 3 + 1] - Math.random()) * worldScale
      // Thin slab of depth in fixed world units.
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * zThickness
      shades[i] = px[p * 3 + 2] * lumScale
    }
    return { positions, shades }
  } catch {
    return fallbackDisc(count, fit, zThickness)
  }
}

type Triangle = { ax: number; ay: number; az: number; bx: number; by: number; bz: number; cx: number; cy: number; cz: number; cumArea: number }

/**
 * Collect every finite, non-degenerate world-space triangle in a mesh tree.
 * Reads positions through the attribute getters so indexed, non-indexed, and
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

/**
 * Area-weighted surface sampling of `count` points across a mesh tree (GLB
 * scene), normalized to `fit`. An empty/atypical input degrades to a sphere —
 * never a crash, so a broken CMS upload can't blank the scene.
 */
export function sampleMeshSurface(
  scene: THREE.Object3D,
  count: number,
  fit: number,
): Float32Array {
  const out = new Float32Array(count * 3)
  const triangles = collectTriangles(scene)

  if (triangles.length === 0) {
    const v = new THREE.Vector3()
    for (let i = 0; i < count; i += 1) {
      v.randomDirection().multiplyScalar(1.4 + Math.random() * 0.1)
      out.set([v.x, v.y, v.z], i * 3)
    }
    return normalizeToFit(out, fit)
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

  return normalizeToFit(out, fit)
}
