import { describe, expect, it, vi } from 'vitest'
import {
  buildMediaIndex,
  filterMediaAssets,
  formatCmsLibraryMediaObjectPath,
  mapMediaAssetRow,
  resolveUploadMimeType,
} from '../mediaAssets.service'
import type { CmsMediaAsset } from '../mediaAssets.types'

describe('resolveUploadMimeType', () => {
  it('trusts a real, specific browser-reported mime', () => {
    const file = new File(['x'], 'hero.png', { type: 'image/png' })
    expect(resolveUploadMimeType(file)).toBe('image/png')
  })

  it('infers model/gltf-binary for .glb when file.type is empty', () => {
    const file = new File(['x'], 'anvil.glb', { type: '' })
    expect(resolveUploadMimeType(file)).toBe('model/gltf-binary')
  })

  it('infers model/gltf-binary for .glb when the browser reports the generic octet-stream mime (observed on Windows Chrome)', () => {
    const file = new File(['x'], 'anvil.glb', { type: 'application/octet-stream' })
    expect(resolveUploadMimeType(file)).toBe('model/gltf-binary')
  })

  it('infers model/gltf+json for .gltf', () => {
    const file = new File(['x'], 'hammer.gltf', { type: 'application/octet-stream' })
    expect(resolveUploadMimeType(file)).toBe('model/gltf+json')
  })

  it('falls back to octet-stream for an unrecognized generic upload', () => {
    const file = new File(['x'], 'mystery.bin', { type: 'application/octet-stream' })
    expect(resolveUploadMimeType(file)).toBe('application/octet-stream')
  })
})

describe('formatCmsLibraryMediaObjectPath', () => {
  it('builds a library path with sanitized filename', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00.000Z'))

    const file = new File(['x'], 'Hero Shot!.png', { type: 'image/png' })
    const path = formatCmsLibraryMediaObjectPath(file)

    expect(path).toMatch(/^library\/hero-shot-\d+\.png$/)
    vi.useRealTimers()
  })
})

describe('mapMediaAssetRow', () => {
  it('maps a Supabase row to CmsMediaAsset', () => {
    const asset = mapMediaAssetRow({
      id: 'uuid-1',
      storage_path: 'library/a.png',
      filename: 'a.png',
      alt: 'Alt',
      mime: 'image/png',
      byte_size: 1200,
      width: 100,
      height: 50,
      tags: ['hero'],
      created_at: '2026-05-20T00:00:00.000Z',
      created_by: 'user-1',
    })
    expect(asset).toEqual({
      id: 'uuid-1',
      storagePath: 'library/a.png',
      filename: 'a.png',
      alt: 'Alt',
      mime: 'image/png',
      byteSize: 1200,
      width: 100,
      height: 50,
      tags: ['hero'],
      createdAt: '2026-05-20T00:00:00.000Z',
      createdBy: 'user-1',
    })
  })

  it('returns null when required fields are missing', () => {
    expect(mapMediaAssetRow({ id: 'x' })).toBeNull()
  })
})

describe('buildMediaIndex', () => {
  it('serializes assets for storefront_publication.media_index', () => {
    const assets: CmsMediaAsset[] = [
      {
        id: 'id-1',
        storagePath: 'library/x.jpg',
        filename: 'x.jpg',
        alt: 'X',
        mime: 'image/jpeg',
        byteSize: 1,
        width: 10,
        height: 20,
        tags: [],
        createdAt: '2026-05-20T12:00:00.000Z',
        createdBy: null,
      },
    ]
    expect(buildMediaIndex(assets)).toEqual([
      {
        id: 'id-1',
        path: 'library/x.jpg',
        alt: 'X',
        mime: 'image/jpeg',
        w: 10,
        h: 20,
        updatedAt: '2026-05-20T12:00:00.000Z',
      },
    ])
  })
})

describe('filterMediaAssets', () => {
  const assets: CmsMediaAsset[] = [
    {
      id: '1',
      storagePath: 'library/a.png',
      filename: 'crest.png',
      alt: 'ANVL crest',
      mime: 'image/png',
      byteSize: 1,
      width: null,
      height: null,
      tags: ['brand'],
      createdAt: '2026-05-20T00:00:00.000Z',
      createdBy: null,
    },
    {
      id: '2',
      storagePath: 'library/b.mp4',
      filename: 'loop.mp4',
      alt: '',
      mime: 'video/mp4',
      byteSize: 1,
      width: null,
      height: null,
      tags: [],
      createdAt: '2026-05-20T00:00:00.000Z',
      createdBy: null,
    },
  ]

  it('filters by search query across filename, alt, and tags', () => {
    expect(filterMediaAssets(assets, 'crest', null)).toHaveLength(1)
    expect(filterMediaAssets(assets, 'brand', null)).toHaveLength(1)
    expect(filterMediaAssets(assets, 'loop', null)).toHaveLength(1)
  })

  it('filters by mime category', () => {
    expect(filterMediaAssets(assets, '', 'image')).toHaveLength(1)
    expect(filterMediaAssets(assets, '', 'video')).toHaveLength(1)
    expect(filterMediaAssets(assets, '', 'all')).toHaveLength(2)
  })
})
