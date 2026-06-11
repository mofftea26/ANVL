import * as THREE from 'three'

/**
 * Procedural canvas textures for the 3D chapter books. Generated once on the
 * client (the 3D books only mount in the browser) so we ship no binary texture
 * assets. Cloth = premium book-binding weave for the covers; parchment = warm
 * aged paper for the pages.
 */

function clampByte(n: number): number {
  return n < 0 ? 0 : n > 255 ? 255 : n | 0
}

function makeNoiseCanvas(
  size: number,
  base: [number, number, number],
  spread: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const image = ctx.createImageData(size, size)
  for (let i = 0; i < size * size; i++) {
    const n = (Math.random() - 0.5) * spread
    image.data[i * 4] = clampByte(base[0] + n)
    image.data[i * 4 + 1] = clampByte(base[1] + n)
    image.data[i * 4 + 2] = clampByte(base[2] + n)
    image.data[i * 4 + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  return ctx.canvas
}

function finalize(canvas: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

/**
 * Fine book-binding cloth — a tight woven weave over a dark base. Doubles as a
 * subtle bump map so the cover catches the studio light like real buckram.
 */
export function makeClothTexture(
  base: [number, number, number] = [33, 29, 26],
): THREE.CanvasTexture {
  const size = 512
  const canvas = makeNoiseCanvas(size, base, 12)
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Woven thread lines (warp + weft).
    ctx.globalAlpha = 0.06
    for (let i = 0; i < size; i += 3) {
      ctx.strokeStyle = i % 6 === 0 ? '#ffffff' : '#000000'
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(size, i)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, size)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    // Worn edge vignette.
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.3,
      size / 2,
      size / 2,
      size * 0.72,
    )
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.4)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }
  return finalize(canvas, 2)
}

/** Warm aged paper for the pages. */
export function makeParchmentTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = makeNoiseCanvas(size, [208, 192, 160], 14)
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Faint foxing speckles.
    for (let i = 0; i < 240; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 1.6, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(120,86,40,${0.02 + Math.random() * 0.06})`
      ctx.fill()
    }
    const grad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.4,
      size * 0.1,
      size * 0.5,
      size * 0.5,
      size * 0.82,
    )
    grad.addColorStop(0, 'rgba(255,238,205,0.16)')
    grad.addColorStop(1, 'rgba(60,40,18,0.16)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }
  return finalize(canvas)
}

/** Soft radial glow sprite for the "magical" open flash. `rgb` is the foil colour. */
export function makeRadialGlow(rgb: [number, number, number]): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    const [r, g, b] = rgb
    grad.addColorStop(0, `rgba(255,255,255,0.95)`)
    grad.addColorStop(0.25, `rgba(${r},${g},${b},0.8)`)
    grad.addColorStop(0.6, `rgba(${r},${g},${b},0.25)`)
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

/** Parse a `#rrggbb` colour to an [r,g,b] byte tuple (255-fallback on bad input). */
export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return [255, 255, 255]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Striped fore-edge — thin page lines so the book block reads as stacked leaves. */
export function makePageEdgeTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#e8dcc0'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < size; i += 2) {
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(120,96,52,0.5)' : 'rgba(170,148,104,0.4)'
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(size, i)
      ctx.stroke()
    }
  }
  return finalize(canvas)
}
