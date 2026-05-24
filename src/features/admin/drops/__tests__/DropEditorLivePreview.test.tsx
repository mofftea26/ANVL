import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import type { Product } from '@/features/products/types/product.types'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'
import { DropEditorLivePreview } from '@/features/admin/drops/DropEditorLivePreview'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'

describe('DropEditorLivePreview below-xl collapse', () => {
  function minimalProps() {
    const drop = createDefaultTheOathDrop()
    const layout = createDefaultWebsiteLayout(drop.updatedAt)
    const landing = composeLandingPageFromDrop(drop, layout, {
      editorActsPreview: true,
      editorPreviewHeroFallback: true,
    })
    return {
      landing,
      products: [] as Product[],
      palette: drop.theme,
      emblemUrl: '',
    }
  }

  it('applies max-xl:hidden to viewport toolbar when collapsed', () => {
    render(
      <DropEditorLivePreview
        {...minimalProps()}
        belowXlCollapse={{ collapsed: true, onToggle: vi.fn() }}
      />,
    )

    const toolbar = screen.getByRole('toolbar', {
      name: /preview viewport size/i,
    })
    expect(toolbar.className.includes('max-xl:hidden')).toBe(true)
  })

  it('does not apply max-xl:hidden to viewport toolbar when expanded', () => {
    render(
      <DropEditorLivePreview
        {...minimalProps()}
        belowXlCollapse={{ collapsed: false, onToggle: vi.fn() }}
      />,
    )

    const toolbar = screen.getByRole('toolbar', {
      name: /preview viewport size/i,
    })
    expect(toolbar.className.includes('max-xl:hidden')).toBe(false)
  })

  it('wires Tablet viewport iframe with anvl-branded srcdoc stub', async () => {
    const user = userEvent.setup()
    render(<DropEditorLivePreview {...minimalProps()} />)

    await user.click(screen.getByRole('button', { name: /tablet/i }))

    await waitFor(() => {
      const frame = screen.getByTitle('Drop preview')
      expect(frame.getAttribute('srcdoc')).toContain('data-anvl-drop-editor-live-preview')
      expect(frame.getAttribute('srcdoc')).toMatch(/<\s*html[^>]*\blang\s*=\s*["']en["']/i)
      expect(frame.style.width).toBe('820px')
      expect(frame.className).toMatch(/min\(720px/)
      expect(frame.className).toMatch(/\bflex-none\b/)
    })
  })

  it('Fit mode uses full-width iframe that fills the stretch shell', async () => {
    render(<DropEditorLivePreview {...minimalProps()} />)
    await waitFor(() => {
      const frame = screen.getByTitle('Drop preview')
      expect(frame.getAttribute('srcdoc')).toContain('data-anvl-drop-editor-live-preview')
    })
    const frame = screen.getByTitle('Drop preview')
    expect(frame.style.width).toBe('100%')
    expect(frame.style.maxWidth).toBe('100%')
    expect(frame.className).toMatch(/min\(720px/)
  })

  it('wraps the iframe in a flex stretch shell (avoids default 150px iframe height in flex rows)', async () => {
    render(<DropEditorLivePreview {...minimalProps()} />)
    await waitFor(() => {
      expect(screen.getByTestId('drop-editor-viewport-iframe-shell')).toBeInTheDocument()
    })
    const shell = screen.getByTestId('drop-editor-viewport-iframe-shell')
    expect(shell.className.includes('flex-1')).toBe(true)
    expect(shell.className.includes('self-start')).toBe(true)
    expect(shell.className.includes('justify-start')).toBe(true)
    expect(shell.className.includes('overflow-hidden')).toBe(true)
  })

  it('mounts the preview portal into the iframe document body', async () => {
    render(<DropEditorLivePreview {...minimalProps()} />)
    await waitFor(
      () => {
        const frame = screen.getByTitle('Drop preview') as HTMLIFrameElement
        expect(frame.contentDocument?.body).not.toBeNull()
        const scoped = frame.contentDocument?.body?.querySelector(
          '[data-anvl-drop-preview-scope]',
        )
        expect(scoped).not.toBeNull()
      },
      { timeout: 5000 },
    )
  })

  it('re-mounts portal after iframe document is swapped and load fires again', async () => {
    render(<DropEditorLivePreview {...minimalProps()} />)

    const frame = screen.getByTitle('Drop preview') as HTMLIFrameElement

    await waitFor(
      () => {
        expect(frame.contentDocument?.body).not.toBeNull()
        expect(
          frame.contentDocument?.body?.querySelector('[data-anvl-drop-preview-scope]'),
        ).not.toBeNull()
      },
      { timeout: 5000 },
    )

    const doc2 = document.implementation.createHTMLDocument('ifr-swap')
    doc2.documentElement.setAttribute('data-anvl-drop-editor-live-preview', '')
    Object.defineProperty(doc2, 'readyState', {
      configurable: true,
      value: 'interactive',
    })

    const getter = vi.spyOn(frame, 'contentDocument', 'get').mockReturnValue(doc2 as Document)

    fireEvent.load(frame)

    await waitFor(
      () => {
        expect(doc2.body).not.toBeNull()
        expect(doc2.head.querySelector('style[data-anvl-preview-reset]')).not.toBeNull()
        expect(doc2.body.querySelector('[data-anvl-drop-preview-scope]')).not.toBeNull()
      },
      { timeout: 5000 },
    )

    getter.mockRestore()
  })

  it('keeps preview scope in iframe body after viewport toggle (stable iframe)', async () => {
    const user = userEvent.setup()
    render(<DropEditorLivePreview {...minimalProps()} />)

    const assertScopeUnderBody = (frame: HTMLIFrameElement) => {
      expect(frame.contentDocument?.body).not.toBeNull()
      expect(
        frame.contentDocument?.body?.querySelector('[data-anvl-drop-preview-scope]'),
      ).not.toBeNull()
    }

    await waitFor(() => assertScopeUnderBody(screen.getByTitle('Drop preview')), {
      timeout: 5000,
    })

    await user.click(screen.getByRole('button', { name: /tablet/i }))

    await waitFor(() => assertScopeUnderBody(screen.getByTitle('Drop preview')), {
      timeout: 5000,
    })
  })
})
