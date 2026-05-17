/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'

// sonner toast is invoked on file uploads, not the URL-input rejection path.
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('MediaPickerField (Phase B4 / SEC-20)', () => {
  it('renders the crest fallback when value is empty', () => {
    render(
      <MediaPickerField label="Hero image" value="" onChange={() => {}} />,
    )
    expect(
      screen.queryByText(/unsafe url blocked/i),
    ).toBeNull()
  })

  it('renders the <img> preview for a safe data URI', () => {
    const safe = 'data:image/png;base64,AAAA'
    const { container } = render(
      <MediaPickerField label="Hero image" value={safe} onChange={() => {}} />,
    )
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe(safe)
    expect(screen.queryByText(/unsafe url blocked/i)).toBeNull()
  })

  it('blocks the preview and surfaces a red error for javascript: URLs', () => {
    const { container } = render(
      <MediaPickerField
        label="Hero image"
        value="javascript:alert(1)"
        onChange={() => {}}
      />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('video')).toBeNull()
    expect(screen.getByText(/unsafe url blocked/i)).toBeTruthy()
  })

  it('blocks data:text/html and similar non-media data URIs', () => {
    const { container } = render(
      <MediaPickerField
        label="Hero image"
        value="data:text/html,<script>alert(1)</script>"
        onChange={() => {}}
      />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText(/unsafe url blocked/i)).toBeTruthy()
  })

  it('blocks scheme-less / ambiguous strings', () => {
    const { container } = render(
      <MediaPickerField
        label="Hero image"
        value="brand/hero.png"
        onChange={() => {}}
      />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText(/unsafe url blocked/i)).toBeTruthy()
  })
})
