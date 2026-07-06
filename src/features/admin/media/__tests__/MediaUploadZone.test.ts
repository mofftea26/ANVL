import { describe, expect, it } from 'vitest'
import { validateUploadFile } from '../MediaUploadZone'

describe('validateUploadFile', () => {
  it('accepts a valid GLB file within the size limit', () => {
    const file = new File(['x'], 'anvil.glb', { type: 'model/gltf-binary' })
    expect(validateUploadFile(file)).toBeNull()
  })

  it('accepts a valid image file', () => {
    const file = new File(['x'], 'hero.png', { type: 'image/png' })
    expect(validateUploadFile(file)).toBeNull()
  })

  it('rejects an unsupported extension', () => {
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' })
    expect(validateUploadFile(file)).toMatch(/not a supported file type|isn't a supported/i)
  })

  it('rejects a file over the 50 MB limit', () => {
    const file = new File(['x'], 'huge.glb', { type: 'model/gltf-binary' })
    Object.defineProperty(file, 'size', { value: 60_000_000 })
    expect(validateUploadFile(file)).toMatch(/50 MB/)
  })

  it('accepts a file at exactly the size limit', () => {
    const file = new File(['x'], 'exact.glb', { type: 'model/gltf-binary' })
    Object.defineProperty(file, 'size', { value: 50_000_000 })
    expect(validateUploadFile(file)).toBeNull()
  })
})
