import { describe, expect, it } from 'vitest'
import {
  filterMediaLibraryItems,
  mediaLibraryMimeFiltersForKind,
} from '../filterMediaLibraryItems'
import type { CmsMediaAsset } from '../mediaAssets.types'

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
    alt: 'Hero loop',
    mime: 'video/mp4',
    byteSize: 1,
    width: null,
    height: null,
    tags: [],
    createdAt: '2026-05-20T00:00:00.000Z',
    createdBy: null,
  },
  {
    id: '3',
    storagePath: 'library/c.svg',
    filename: 'mark.svg',
    alt: '',
    mime: 'image/svg+xml',
    byteSize: 1,
    width: null,
    height: null,
    tags: ['logo'],
    createdAt: '2026-05-20T00:00:00.000Z',
    createdBy: null,
  },
]

describe('mediaLibraryMimeFiltersForKind', () => {
  it('returns only image filter when kind is image', () => {
    expect(mediaLibraryMimeFiltersForKind('image')).toEqual([
      { id: 'image', label: 'Images' },
    ])
  })

  it('returns only video filter when kind is video', () => {
    expect(mediaLibraryMimeFiltersForKind('video')).toEqual([
      { id: 'video', label: 'Video' },
    ])
  })

  it('returns all filters when kind is any', () => {
    expect(mediaLibraryMimeFiltersForKind('any')).toHaveLength(3)
  })
})

describe('filterMediaLibraryItems', () => {
  it('filters by search across filename, alt, and tags', () => {
    expect(filterMediaLibraryItems(assets, 'crest', 'all', 'any')).toHaveLength(1)
    expect(filterMediaLibraryItems(assets, 'hero loop', 'all', 'any')).toHaveLength(1)
    expect(filterMediaLibraryItems(assets, 'logo', 'all', 'any')).toHaveLength(1)
  })

  it('filters by mime chip when kind is any', () => {
    expect(filterMediaLibraryItems(assets, '', 'image', 'any')).toHaveLength(2)
    expect(filterMediaLibraryItems(assets, '', 'video', 'any')).toHaveLength(1)
    expect(filterMediaLibraryItems(assets, '', 'all', 'any')).toHaveLength(3)
  })

  it('restricts to images when kind is image regardless of mime chip', () => {
    expect(filterMediaLibraryItems(assets, '', 'all', 'image')).toHaveLength(2)
    expect(filterMediaLibraryItems(assets, '', 'video', 'image')).toHaveLength(2)
  })

  it('restricts to videos when kind is video', () => {
    expect(filterMediaLibraryItems(assets, '', 'all', 'video')).toHaveLength(1)
    expect(filterMediaLibraryItems(assets, 'loop', 'image', 'video')).toHaveLength(1)
  })

  it('combines search and mime filter', () => {
    expect(filterMediaLibraryItems(assets, 'crest', 'video', 'any')).toHaveLength(0)
    expect(filterMediaLibraryItems(assets, 'crest', 'image', 'any')).toHaveLength(1)
  })
})
