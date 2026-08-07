import { describe, expect, it } from 'vitest'
import { getMediaUploadAdvice } from '@/features/admin/media/mediaUploadAdvice'

const f = (name: string, type: string, size: number) => ({ name, size, type })

/**
 * The advice is ADVISORY: it never blocks an upload. These tests pin the
 * thresholds and, just as importantly, pin the silence — a warning on every
 * file is a warning on none.
 */
describe('getMediaUploadAdvice — images', () => {
  it('says nothing about a small modern image', () => {
    expect(getMediaUploadAdvice(f('hero.webp', 'image/webp', 90_000))).toBeNull()
  })

  it('nudges an oversized legacy format toward WebP/AVIF', () => {
    const a = getMediaUploadAdvice(f('hero.png', 'image/png', 300_000))
    expect(a?.level).toBe('info')
    expect(a?.message).toMatch(/WebP or AVIF/)
  })

  it('warns on a heavy image and names the target', () => {
    const a = getMediaUploadAdvice(f('hero.jpg', 'image/jpeg', 900_000))
    expect(a?.level).toBe('warn')
    expect(a?.message).toMatch(/600 KB/)
  })

  it('warns harder above 2 MB and explains the real cost', () => {
    const a = getMediaUploadAdvice(f('hero.png', 'image/png', 9_000_000))
    expect(a?.level).toBe('warn')
    // The reason this matters here: no resizing layer, so the original ships.
    expect(a?.message).toMatch(/full size/)
    expect(a?.message).toMatch(/9\.0 MB/)
  })

  it('leaves SVG alone — size heuristics do not apply to vectors', () => {
    expect(getMediaUploadAdvice(f('mark.svg', 'image/svg+xml', 800_000))).toBeNull()
  })

  it('still nudges a heavy WebP, but does not tell it to become WebP', () => {
    const a = getMediaUploadAdvice(f('big.webp', 'image/webp', 900_000))
    expect(a?.level).toBe('warn')
    expect(a?.message).not.toMatch(/converting to WebP/i)
  })
})

describe('getMediaUploadAdvice — video and models', () => {
  it('is quiet about a short clip', () => {
    expect(getMediaUploadAdvice(f('loop.mp4', 'video/mp4', 2_000_000))).toBeNull()
  })

  it('warns about a heavy video with a concrete bitrate target', () => {
    const a = getMediaUploadAdvice(f('hero.mp4', 'video/mp4', 7_000_000))
    expect(a?.level).toBe('warn')
    expect(a?.message).toMatch(/Mbps/)
  })

  it('tells the truth about where GLB weight actually lives', () => {
    const a = getMediaUploadAdvice(f('anvil.glb', 'model/gltf-binary', 6_000_000))
    expect(a?.level).toBe('warn')
    expect(a?.message).toMatch(/embedded textures, not geometry/)
    expect(a?.message).toMatch(/compress-glb-textures/)
  })

  it('is quiet about an already-compressed model', () => {
    // The anvil after compression: ~1 MB.
    expect(getMediaUploadAdvice(f('anvil.glb', 'model/gltf-binary', 1_020_000))).toBeNull()
  })

  it('recognises a .glb by extension when the browser sends no MIME type', () => {
    const a = getMediaUploadAdvice(f('hammer.glb', '', 6_000_000))
    expect(a?.level).toBe('warn')
  })

  it('says nothing about a font or an unknown type', () => {
    expect(getMediaUploadAdvice(f('x.woff2', 'font/woff2', 3_000_000))).toBeNull()
  })
})
