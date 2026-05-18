import { describe, expect, it } from 'vitest'

import {
  DROP_EDITOR_PREVIEW_IFRAME_SRCDOC,
  isDropEditorPreviewIframeDocumentReady,
} from '@/features/admin/drops/dropEditorLivePreviewIframe'

describe('Drop editor iframe preview helpers', () => {
  it('srcdoc stub exposes anvl marker on <html>', () => {
    expect(DROP_EDITOR_PREVIEW_IFRAME_SRCDOC).toContain('data-anvl-drop-editor-live-preview')
    expect(DROP_EDITOR_PREVIEW_IFRAME_SRCDOC.toLowerCase()).toContain('<!doctype html>')
    expect(DROP_EDITOR_PREVIEW_IFRAME_SRCDOC).toMatch(/<\s*head[^>]*>\s*<\/\s*head\s*>/)
    expect(DROP_EDITOR_PREVIEW_IFRAME_SRCDOC).toMatch(/<\s*body[^>]*>\s*<\/\s*body\s*>/)
  })

  it('isDropEditorPreviewIframeDocumentReady rejects null or missing head/body', () => {
    expect(isDropEditorPreviewIframeDocumentReady(undefined)).toBe(false)
    expect(isDropEditorPreviewIframeDocumentReady(null)).toBe(false)

    const noHead = {
      body: document.createElement('body'),
      head: null as unknown as HTMLHeadElement,
      readyState: 'interactive',
    }
    expect(
      isDropEditorPreviewIframeDocumentReady(noHead as unknown as Document),
    ).toBe(false)
  })

  it('isDropEditorPreviewIframeDocumentReady accepts interactive / complete docs with head/body', () => {
    const interactive = document.implementation.createHTMLDocument('interactive')
    Object.defineProperty(interactive, 'readyState', { value: 'interactive', configurable: true })
    expect(isDropEditorPreviewIframeDocumentReady(interactive)).toBe(true)

    const complete = document.implementation.createHTMLDocument('complete')
    Object.defineProperty(complete, 'readyState', { value: 'complete', configurable: true })
    expect(isDropEditorPreviewIframeDocumentReady(complete)).toBe(true)
  })

  it('isDropEditorPreviewIframeDocumentReady rejects loading without anvl srcdoc marker', () => {
    const loading = document.implementation.createHTMLDocument('loading')
    Object.defineProperty(loading, 'readyState', { value: 'loading', configurable: true })
    expect(isDropEditorPreviewIframeDocumentReady(loading)).toBe(false)
  })

  it('isDropEditorPreviewIframeDocumentReady accepts loading docs with anvl srcdoc marker on html', () => {
    const doc = document.implementation.createHTMLDocument('loading')
    doc.documentElement.setAttribute('data-anvl-drop-editor-live-preview', '')
    Object.defineProperty(doc, 'readyState', { value: 'loading', configurable: true })
    expect(isDropEditorPreviewIframeDocumentReady(doc)).toBe(true)
  })

  it('isDropEditorPreviewIframeDocumentReady tracks stub marker toggles while still loading', () => {
    const doc = document.implementation.createHTMLDocument('loading')
    Object.defineProperty(doc, 'readyState', { value: 'loading', configurable: true })
    doc.documentElement.removeAttribute('data-anvl-drop-editor-live-preview')
    expect(isDropEditorPreviewIframeDocumentReady(doc)).toBe(false)
    doc.documentElement.setAttribute('data-anvl-drop-editor-live-preview', '')
    expect(isDropEditorPreviewIframeDocumentReady(doc)).toBe(true)
  })
})
