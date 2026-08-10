import { describe, expect, it } from 'vitest'
import {
  MAX_UPLOAD_IMAGE_EDGE,
  MIN_UPLOAD_IMAGE_BYTES_TO_REENCODE,
  encodeUploadImage,
  fitScale,
  shouldReencodeUpload,
  webpFilename,
} from '../encodeUploadImage'

function fakeFile(name: string, type: string, bytes: number): File {
  const file = new File(['x'], name, { type })
  // `size` is derived from the parts and read-only; override it so a test can
  // describe a 7 MB upload without allocating one.
  Object.defineProperty(file, 'size', { value: bytes })
  return file
}

const BIG = MIN_UPLOAD_IMAGE_BYTES_TO_REENCODE * 40

describe('shouldReencodeUpload', () => {
  it('re-encodes large raster images', () => {
    expect(shouldReencodeUpload(fakeFile('a.png', 'image/png', BIG))).toBe(true)
    expect(shouldReencodeUpload(fakeFile('a.jpg', 'image/jpeg', BIG))).toBe(true)
    expect(shouldReencodeUpload(fakeFile('a.webp', 'image/webp', BIG))).toBe(true)
  })

  it('never rasterises SVG', () => {
    expect(shouldReencodeUpload(fakeFile('logo.svg', 'image/svg+xml', BIG))).toBe(false)
  })

  it('leaves GIF alone so animation survives', () => {
    expect(shouldReencodeUpload(fakeFile('loop.gif', 'image/gif', BIG))).toBe(false)
  })

  it('leaves AVIF alone — already smaller than our output', () => {
    expect(shouldReencodeUpload(fakeFile('a.avif', 'image/avif', BIG))).toBe(false)
  })

  it('ignores non-images (video, GLB, fonts)', () => {
    expect(shouldReencodeUpload(fakeFile('clip.mp4', 'video/mp4', BIG))).toBe(false)
    expect(shouldReencodeUpload(fakeFile('anvil.glb', 'model/gltf-binary', BIG))).toBe(false)
    expect(shouldReencodeUpload(fakeFile('f.woff2', 'font/woff2', BIG))).toBe(false)
  })

  it('skips already-small images rather than degrading them', () => {
    const small = MIN_UPLOAD_IMAGE_BYTES_TO_REENCODE - 1
    expect(shouldReencodeUpload(fakeFile('a.png', 'image/png', small))).toBe(false)
  })
})

describe('encodeUploadImage', () => {
  it('returns the original file when the format is skipped', async () => {
    const svg = fakeFile('logo.svg', 'image/svg+xml', BIG)
    await expect(encodeUploadImage(svg)).resolves.toBe(svg)
  })

  it('returns the original file when no canvas encoder exists (jsdom)', async () => {
    const png = fakeFile('hero.png', 'image/png', BIG)
    // jsdom has no working canvas/WebP encoder — the guard must fall back
    // rather than throw, which is exactly the browser-support behaviour.
    await expect(encodeUploadImage(png)).resolves.toBe(png)
  })
})

describe('fitScale', () => {
  it('leaves images already within the cap untouched', () => {
    expect(fitScale(1200, 800, MAX_UPLOAD_IMAGE_EDGE)).toBe(1)
    expect(fitScale(MAX_UPLOAD_IMAGE_EDGE, 100, MAX_UPLOAD_IMAGE_EDGE)).toBe(1)
  })

  it('scales by the longest edge', () => {
    // The real About assets: 2752x1536 -> longest edge lands on the cap.
    const scale = fitScale(2752, 1536, MAX_UPLOAD_IMAGE_EDGE)
    expect(Math.round(2752 * scale)).toBe(MAX_UPLOAD_IMAGE_EDGE)
    expect(Math.round(1536 * scale)).toBe(1143)
  })

  it('handles portrait orientation', () => {
    expect(fitScale(1000, 4096, MAX_UPLOAD_IMAGE_EDGE)).toBe(0.5)
  })
})

describe('webpFilename', () => {
  it('swaps the extension so filename matches stored bytes', () => {
    expect(webpFilename('about-materials.png')).toBe('about-materials.webp')
    expect(webpFilename('a.b.c.jpeg')).toBe('a.b.c.webp')
  })

  it('handles names with no extension', () => {
    expect(webpFilename('asset')).toBe('asset.webp')
  })

  it('falls back rather than producing a bare extension', () => {
    expect(webpFilename('')).toBe('asset.webp')
  })
})
