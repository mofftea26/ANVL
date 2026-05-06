/**
 * Removes outer background from brand PNGs (edge-connected flood fill), then trims.
 * Light/cream marks use luminance thresholds so ink is not mistaken for canvas.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BRAND = path.join(ROOT, 'public', 'brand')

const FILES = [
  'logo-wordmark-light.png',
  'logo-stacked-light.png',
  'mark-light.png',
  'logo-wordmark-dark.png',
  'logo-stacked-dark.png',
  'mark-dark.png',
]

function idx(x, y, w) {
  return (y * w + x) * 4
}

function lum(data, i) {
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
}

function collectBorderIndices(width, height) {
  const out = []
  for (let x = 0; x < width; x++) {
    out.push(idx(x, 0, width), idx(x, height - 1, width))
  }
  for (let y = 0; y < height; y++) {
    out.push(idx(0, y, width), idx(width - 1, y, width))
  }
  return out
}

/** Light ink on white/light gray: seed bright border, expand into nearby highlights only. */
function processLightInk(data, width, height) {
  const borderIdx = collectBorderIndices(width, height)
  const L_SEED_STRICT = 248
  const L_SEED_RELAX = 242
  const L_EXPAND = 239

  let seeds = borderIdx.filter((i) => lum(data, i) >= L_SEED_STRICT)
  if (seeds.length === 0) {
    seeds = borderIdx.filter((i) => lum(data, i) >= L_SEED_RELAX)
  }

  const out = new Uint8Array(data.length)
  out.set(data)
  const marked = new Uint8Array(width * height)
  const queue = []

  const mark = (x, y) => {
    const p = y * width + x
    if (marked[p]) return
    marked[p] = 1
    queue.push(x, y)
  }

  for (const i of seeds) {
    const p = i / 4
    const x = p % width
    const y = Math.floor(p / width)
    mark(x, y)
  }

  let head = 0
  while (head < queue.length) {
    const x = queue[head++]
    const y = queue[head++]
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      const p = ny * width + nx
      if (marked[p]) continue
      const i = idx(nx, ny, width)
      if (lum(data, i) < L_EXPAND) continue
      marked[p] = 1
      queue.push(nx, ny)
    }
  }

  for (let p = 0; p < marked.length; p++) {
    if (marked[p]) {
      const i = p * 4
      out[i + 3] = 0
    }
  }

  return Buffer.from(out)
}

/** Dark / marble ink on near-white: classic average-border + distance match. */
function processDarkInk(data, width, height, colorDist) {
  const borderIdx = collectBorderIndices(width, height)
  let sr = 0
  let sg = 0
  let sb = 0
  for (const i of borderIdx) {
    sr += data[i]
    sg += data[i + 1]
    sb += data[i + 2]
  }
  const n = borderIdx.length
  const bg = [sr / n, sg / n, sb / n]

  const matchBg = (i) => {
    const d = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2])
    return d < colorDist
  }

  const out = new Uint8Array(data.length)
  out.set(data)
  const marked = new Uint8Array(width * height)
  const queue = []

  const trySeed = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return
    const p = y * width + x
    if (marked[p]) return
    const i = idx(x, y, width)
    if (!matchBg(i)) return
    marked[p] = 1
    queue.push(x, y)
  }

  for (let x = 0; x < width; x++) {
    trySeed(x, 0)
    trySeed(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    trySeed(0, y)
    trySeed(width - 1, y)
  }

  let head = 0
  while (head < queue.length) {
    const x = queue[head++]
    const y = queue[head++]
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      const p = ny * width + nx
      if (marked[p]) continue
      const i = idx(nx, ny, width)
      if (!matchBg(i)) continue
      marked[p] = 1
      queue.push(nx, ny)
    }
  }

  for (let p = 0; p < marked.length; p++) {
    if (marked[p]) {
      const i = p * 4
      out[i + 3] = 0
    }
  }

  return Buffer.from(out)
}

function modeForFile(file) {
  return file.includes('wordmark-light') ||
    file.includes('stacked-light') ||
    file === 'mark-light.png'
    ? 'lightInk'
    : 'darkInk'
}

for (const file of FILES) {
  const filePath = path.join(BRAND, file)
  const input = await readFile(filePath)
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const mode = modeForFile(file)
  const stripped =
    mode === 'lightInk'
      ? processLightInk(data, info.width, info.height)
      : processDarkInk(data, info.width, info.height, 46)

  let pipeline = sharp(stripped, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png({ compressionLevel: 9 })

  pipeline = pipeline.trim({ threshold: 1 })

  const out = await pipeline.toBuffer()
  await writeFile(filePath, out)
  console.log('Updated', file, mode, `${info.width}x${info.height}`)
}

console.log('Done.')
