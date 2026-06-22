/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MediaLibrarySlotField } from '../MediaLibrarySlotField'
import type { CmsMediaAsset } from '../mediaAssets.types'

vi.mock('../MediaLibraryPickerModal', () => ({
  MediaLibraryPickerModal: ({
    open,
    onSelect,
    onClose,
  }: {
    open: boolean
    onSelect: (pick: { id: string } | null) => void
    onClose: () => void
  }) =>
    open ? (
      <div data-testid="picker-modal">
        <button type="button" onClick={() => onSelect({ id: 'picked-id' })}>
          Pick asset
        </button>
        <button type="button" onClick={() => onClose()}>
          Close picker
        </button>
      </div>
    ) : null,
}))

vi.mock('../mediaAssets.service', () => ({
  mediaAssetPublicUrl: () => 'https://cdn.example/preview.webp',
}))

const assets: CmsMediaAsset[] = [
  {
    id: 'assigned-id',
    storagePath: 'library/x.webp',
    filename: 'x.webp',
    alt: '',
    mime: 'image/webp',
    byteSize: 1,
    width: null,
    height: null,
    tags: [],
    createdAt: '2026-06-22T00:00:00.000Z',
    createdBy: null,
  },
]

describe('MediaLibrarySlotField', () => {
  it('shows not assigned state and opens picker', () => {
    const onMediaIdChange = vi.fn()
    render(
      <MediaLibrarySlotField
        label="Hero image"
        mediaId=""
        assets={assets}
        onMediaIdChange={onMediaIdChange}
      />,
    )

    expect(screen.getByText('Not assigned')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /choose media/i }))
    expect(screen.getByTestId('picker-modal')).toBeTruthy()
  })

  it('shows assigned filename and clears selection', () => {
    const onMediaIdChange = vi.fn()
    render(
      <MediaLibrarySlotField
        label="Hero image"
        mediaId="assigned-id"
        assets={assets}
        onMediaIdChange={onMediaIdChange}
      />,
    )

    expect(screen.getByText('x.webp')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onMediaIdChange).toHaveBeenCalledWith('')
  })

  it('forwards picked media id from modal', () => {
    const onMediaIdChange = vi.fn()
    render(
      <MediaLibrarySlotField
        label="Hero image"
        mediaId=""
        assets={assets}
        onMediaIdChange={onMediaIdChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /choose media/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Pick asset' }))
    expect(onMediaIdChange).toHaveBeenCalledWith('picked-id')
  })
})
