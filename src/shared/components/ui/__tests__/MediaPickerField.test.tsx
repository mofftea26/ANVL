/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
    expect(
      screen.queryByRole('img', { name: /default anvl crest/i }),
    ).not.toBeNull()
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

  it('renders the wordmark SVG fallback when value is empty and fallback is wordmark', () => {
    render(
      <MediaPickerField
        label="Wordmark"
        value=""
        onChange={() => {}}
        fallback="wordmark"
      />,
    )
    expect(screen.queryByRole('img', { name: /^anvl wordmark$/i })).not.toBeNull()
  })

  it('swaps a broken remote image to the crest fallback after onError', () => {
    render(
      <MediaPickerField
        label="Hero"
        value="https://example.invalid/broken.png"
        onChange={() => {}}
        fallback="crest"
      />,
    )
    const preview = screen.getByRole('img', { name: /preview/i })
    fireEvent.error(preview)
    expect(
      screen.queryByRole('img', { name: /default anvl crest/i }),
    ).not.toBeNull()
  })

  it('styles the URL field with shared admin/cms field chrome', () => {
    render(
      <MediaPickerField label="Hero image" value="" onChange={() => {}} />,
    )
    const details = screen.getByText(/or paste url/i).closest('details')
    expect(details).not.toBeNull()
    const urlInput = details?.querySelector('input[type="url"]') as HTMLInputElement | null
    expect(urlInput).not.toBeNull()
    expect(urlInput?.className).toMatch(/rounded-md/)
  })

  it('uses fallbackPreviewSrc when main value empty', () => {
    const url = '/brand/crest-mark.svg'
    const { container } = render(
      <MediaPickerField
        label="Wordmark"
        value=""
        onChange={() => {}}
        fallback="crest"
        fallbackPreviewSrc={url}
      />,
    )
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe(url)
  })
})
