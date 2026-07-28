/**
 * @vitest-environment jsdom
 */
import type { RefObject } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ForgeEmberCanvas } from '@/shared/components/ui/ForgeEmberCanvas'

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(false),
  }))
}

/** Minimal 2D-context stub — only the calls emberForge's drawing path makes. */
function stub2dContext() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    // Justification: a hand-rolled stub only needs the subset of the 2D
    // context API ForgeEmberCanvas + emberForge actually call.
  } as unknown as CanvasRenderingContext2D
}

/** Controllable requestAnimationFrame: `tick(ms)` advances the clock and
 * invokes the most recently scheduled frame, mirroring one real rAF tick. */
function installFrameControls() {
  let now = 0
  let pending: FrameRequestCallback | null = null
  let nextId = 1
  const cancelled = new Set<number>()

  vi.stubGlobal(
    'requestAnimationFrame',
    (cb: FrameRequestCallback): number => {
      const id = nextId
      nextId += 1
      pending = cb
      return id
    },
  )
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    cancelled.add(id)
    pending = null
  })
  vi.spyOn(performance, 'now').mockImplementation(() => now)

  return {
    tick(ms: number) {
      now += ms
      const cb = pending
      pending = null
      cb?.(now)
    },
    hasPending: () => pending !== null,
  }
}

function makeTargetRef(rect: DOMRect): RefObject<HTMLElement | null> {
  const node = document.createElement('div')
  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue(rect)
  return { current: node }
}

const RECT: DOMRect = {
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  right: 100,
  bottom: 50,
  width: 100,
  height: 50,
  toJSON: () => ({}),
}

describe('ForgeEmberCanvas', () => {
  let getContextSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockReducedMotion(false)
    getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(stub2dContext())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('mounts a canvas element', () => {
    const targetRef = makeTargetRef(RECT)
    const { container } = render(<ForgeEmberCanvas targetRef={targetRef} count={5} />)
    expect(container.querySelector('canvas')).not.toBeNull()
    expect(getContextSpy).toHaveBeenCalled()
  })

  it('renders nothing under reduced motion', () => {
    mockReducedMotion(true)
    const targetRef = makeTargetRef(RECT)
    const { container } = render(<ForgeEmberCanvas targetRef={targetRef} count={5} />)
    expect(container.querySelector('canvas')).toBeNull()
  })

  it('cancels its rAF on unmount', () => {
    const frames = installFrameControls()
    const targetRef = makeTargetRef(RECT)
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame')
    const { unmount } = render(
      <ForgeEmberCanvas targetRef={targetRef} count={5} durationMs={1000} />,
    )
    expect(frames.hasPending()).toBe(true)
    unmount()
    expect(cancelSpy).toHaveBeenCalled()
  })

  it('fires onComplete once the swarm finishes', () => {
    const frames = installFrameControls()
    const targetRef = makeTargetRef(RECT)
    const onComplete = vi.fn()
    render(
      <ForgeEmberCanvas targetRef={targetRef} count={5} durationMs={100} onComplete={onComplete} />,
    )

    frames.tick(0) // first frame: t = 0
    expect(onComplete).not.toHaveBeenCalled()
    frames.tick(150) // past the duration: t clamps to 1, pass ends
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('ends the pass early via a live getRect returning null', () => {
    const frames = installFrameControls()
    const onComplete = vi.fn()
    let connected = true
    render(
      <ForgeEmberCanvas
        getRect={() => (connected ? RECT : null)}
        count={5}
        durationMs={10_000}
        onComplete={onComplete}
      />,
    )

    frames.tick(0)
    expect(onComplete).not.toHaveBeenCalled()
    connected = false
    frames.tick(16)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
