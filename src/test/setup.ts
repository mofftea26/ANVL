/**
 * Vitest setup file (see vitest.config.ts -> test.setupFiles).
 *
 * Provides:
 * - DOM cleanup after every test
 * - localStorage / sessionStorage reset
 * - matchMedia / IntersectionObserver / ResizeObserver polyfills for jsdom
 *
 * Add new polyfills here only when a test actually needs them — avoid
 * monkey-patching globals you don't understand.
 */

import '@testing-library/jest-dom/vitest'

import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  // localStorage / sessionStorage are jsdom-provided; clearing keeps tests isolated.
  try {
    window.localStorage.clear()
    window.sessionStorage.clear()
  } catch {
    /* Some tests intentionally stub storage; ignore. */
  }
})

// matchMedia — many components call window.matchMedia at mount; jsdom doesn't ship it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(false),
    })),
  })
}

// IntersectionObserver — used by some lazy components / scroll triggers.
if (typeof globalThis !== 'undefined' && !('IntersectionObserver' in globalThis)) {
  class MockIntersectionObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    takeRecords = vi.fn(() => [])
    root: Element | null = null
    rootMargin = ''
    thresholds: ReadonlyArray<number> = []
  }
  ;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    MockIntersectionObserver
}

// ResizeObserver — same story.
if (typeof globalThis !== 'undefined' && !('ResizeObserver' in globalThis)) {
  class MockResizeObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  }
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
    MockResizeObserver
}

// Pointer capture — Radix Select expects these DOM APIs (missing in jsdom).
if (typeof Element !== 'undefined') {
  const proto = Element.prototype as Element & {
    hasPointerCapture?: (pointerId: number) => boolean
    setPointerCapture?: (pointerId: number) => void
    releasePointerCapture?: (pointerId: number) => void
  }
  if (!proto.hasPointerCapture) {
    proto.hasPointerCapture = () => false
  }
  if (!proto.setPointerCapture) {
    proto.setPointerCapture = () => {}
  }
  if (!proto.releasePointerCapture) {
    proto.releasePointerCapture = () => {}
  }
  proto.scrollIntoView = function scrollIntoView() {
    /* Radix Select focuses options via scrollIntoView — jsdom stub. */
  }
}
