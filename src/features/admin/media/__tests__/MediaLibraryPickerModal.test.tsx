/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ComponentProps } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MediaLibraryPickerModal } from '../MediaLibraryPickerModal'
import type { CmsMediaAsset } from '../mediaAssets.types'

const mockAssets: CmsMediaAsset[] = [
  {
    id: 'img-1',
    storagePath: 'library/hero.webp',
    filename: 'hero.webp',
    alt: 'Hero still',
    mime: 'image/webp',
    byteSize: 100,
    width: 1920,
    height: 1080,
    tags: ['hero'],
    createdAt: '2026-06-22T00:00:00.000Z',
    createdBy: null,
  },
  {
    id: 'vid-1',
    storagePath: 'library/loop.mp4',
    filename: 'loop.mp4',
    alt: '',
    mime: 'video/mp4',
    byteSize: 5000,
    width: null,
    height: null,
    tags: [],
    createdAt: '2026-06-22T00:00:00.000Z',
    createdBy: null,
  },
]

vi.mock('../useMediaAssetsQuery', () => ({
  useMediaAssetsQuery: vi.fn(),
}))

vi.mock('../mediaAssets.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../mediaAssets.service')>()
  return {
    ...actual,
    mediaAssetPublicUrl: (asset: CmsMediaAsset) =>
      `https://cdn.example/${asset.storagePath}`,
  }
})

import { useMediaAssetsQuery } from '../useMediaAssetsQuery'

function renderModal(
  props: Partial<ComponentProps<typeof MediaLibraryPickerModal>> = {},
) {
  const onSelect = vi.fn()
  const onClose = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <MediaLibraryPickerModal
        open
        onClose={onClose}
        onSelect={onSelect}
        {...props}
      />
    </QueryClientProvider>,
  )

  return { onSelect, onClose }
}

describe('MediaLibraryPickerModal', () => {
  beforeEach(() => {
    vi.mocked(useMediaAssetsQuery).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockAssets,
    } as ReturnType<typeof useMediaAssetsQuery>)
  })

  it('renders search, type filters, and asset grid when kind is any', () => {
    renderModal({ kind: 'any' })

    expect(screen.getByLabelText('Search library')).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Filter by type' })).toBeTruthy()
    expect(screen.getByLabelText('Media library assets')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Select hero.webp' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Select loop.mp4' })).toBeTruthy()
  })

  it('hides type filters when kind restricts to image', () => {
    renderModal({ kind: 'image' })
    expect(screen.queryByRole('group', { name: 'Filter by type' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Select hero.webp' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Select loop.mp4' })).toBeNull()
  })

  it('filters assets by search query', () => {
    renderModal({ kind: 'any' })
    fireEvent.change(screen.getByLabelText('Search library'), {
      target: { value: 'loop' },
    })
    expect(screen.queryByRole('button', { name: 'Select hero.webp' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Select loop.mp4' })).toBeTruthy()
  })

  it('filters assets by mime chip', () => {
    renderModal({ kind: 'any' })
    fireEvent.click(screen.getByRole('button', { name: 'Video' }))
    expect(screen.queryByRole('button', { name: 'Select hero.webp' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Select loop.mp4' })).toBeTruthy()
  })

  it('calls onSelect with pick and onClose when an asset is chosen', () => {
    const { onSelect, onClose } = renderModal({ kind: 'any' })
    fireEvent.click(screen.getByRole('button', { name: 'Select hero.webp' }))

    expect(onSelect).toHaveBeenCalledWith({
      id: 'img-1',
      publicUrl: 'https://cdn.example/library/hero.webp',
      filename: 'hero.webp',
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onSelect with null when clear selection is used', () => {
    const { onSelect, onClose } = renderModal({ allowClear: true })
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(onSelect).toHaveBeenCalledWith(null)
    expect(onClose).toHaveBeenCalled()
  })

  it('uses custom title', () => {
    renderModal({ title: 'Pick hero image' })
    expect(screen.getByRole('heading', { name: 'Pick hero image' })).toBeTruthy()
  })
})
