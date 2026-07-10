import { describe, expect, it } from 'vitest'
import { coerceUploadFile, resolveUploadMimeType } from '@/features/admin/media/mediaMime'

describe('resolveUploadMimeType', () => {
  it('keeps a real reported mime', () => {
    const file = new File(['x'], 'photo.webp', { type: 'image/webp' })
    expect(resolveUploadMimeType(file)).toBe('image/webp')
  })

  it('infers model mimes for .glb/.gltf with a generic reported type', () => {
    expect(
      resolveUploadMimeType(new File(['x'], 'anvil.glb', { type: '' })),
    ).toBe('model/gltf-binary')
    expect(
      resolveUploadMimeType(
        new File(['x'], 'anvil.gltf', { type: 'application/octet-stream' }),
      ),
    ).toBe('model/gltf+json')
  })
})

describe('coerceUploadFile', () => {
  it('returns the original file when its own type already matches', () => {
    const file = new File(['x'], 'photo.webp', { type: 'image/webp' })
    const { body, contentType } = coerceUploadFile(file)
    expect(body).toBe(file)
    expect(contentType).toBe('image/webp')
  })

  it('re-wraps a .glb so the Blob itself carries the model mime', () => {
    // Windows browsers report '' or application/octet-stream for .glb —
    // supabase-js uploads File bodies as multipart and ignores the
    // contentType option, so the Blob's own type must be correct.
    const file = new File(['glTF'], 'anvil.glb', { type: 'application/octet-stream' })
    const { body, contentType } = coerceUploadFile(file)
    expect(contentType).toBe('model/gltf-binary')
    expect(body).not.toBe(file)
    expect(body.type).toBe('model/gltf-binary')
    expect(body.name).toBe('anvil.glb')
    expect(body.size).toBe(file.size)
  })
})
