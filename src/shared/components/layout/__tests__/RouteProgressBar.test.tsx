import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouteProgressBar } from '@/shared/components/layout/RouteProgressBar'

const routerState = vi.hoisted(() => ({ isLoading: false }))
const reducedMotionState = vi.hoisted(() => ({ reduced: false }))

vi.mock('@tanstack/react-router', () => ({
  useRouterState: (opts: { select: (state: { isLoading: boolean }) => boolean }) =>
    opts.select({ isLoading: routerState.isLoading }),
}))

vi.mock('@/shared/hooks/useReducedMotion', () => ({
  useReducedMotion: () => reducedMotionState.reduced,
}))

describe('RouteProgressBar', () => {
  beforeEach(() => {
    routerState.isLoading = false
    reducedMotionState.reduced = false
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing while the router is idle', () => {
    render(<RouteProgressBar />)
    expect(screen.queryByTestId('route-progress-bar')).not.toBeInTheDocument()
  })

  it('becomes visible once loading has run past the entry delay', async () => {
    const { rerender } = render(<RouteProgressBar />)
    expect(screen.queryByTestId('route-progress-bar')).not.toBeInTheDocument()

    routerState.isLoading = true
    rerender(<RouteProgressBar />)
    // Before the entry delay elapses, it must still be hidden — this is what
    // keeps fast navigations flash-free.
    expect(screen.queryByTestId('route-progress-bar')).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120)
    })
    expect(screen.getByTestId('route-progress-bar')).toBeInTheDocument()
    expect(screen.getByTestId('route-progress-bar')).toHaveAttribute('aria-hidden', 'true')
  })

  it('mounts at a small start width and creeps to the target — it must not pop straight in', async () => {
    const { rerender } = render(<RouteProgressBar />)

    routerState.isLoading = true
    rerender(<RouteProgressBar />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120)
    })
    // The instant the bar mounts, it must be at the small start value, not
    // already at the 72% creep target — otherwise there is nothing for the
    // `transform` transition to animate from and the bar just pops in.
    expect(screen.getByTestId('route-progress-bar-fill')).toHaveStyle({
      transform: 'scaleX(0.08)',
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(16)
    })
    expect(screen.getByTestId('route-progress-bar-fill')).toHaveStyle({
      transform: 'scaleX(0.72)',
    })
  })

  it('completes to full width and fades out when loading finishes, then unmounts', async () => {
    const { rerender } = render(<RouteProgressBar />)

    routerState.isLoading = true
    rerender(<RouteProgressBar />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120 + 16)
    })
    expect(screen.getByTestId('route-progress-bar-fill')).toHaveStyle({
      transform: 'scaleX(0.72)',
      opacity: '1',
    })

    routerState.isLoading = false
    rerender(<RouteProgressBar />)

    // Still in the document, but now completing to 100% while fading out.
    expect(screen.getByTestId('route-progress-bar-fill')).toHaveStyle({
      transform: 'scaleX(1)',
      opacity: '0',
    })
    expect(screen.getByTestId('route-progress-bar')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    expect(screen.queryByTestId('route-progress-bar')).not.toBeInTheDocument()
  })

  it('does not freeze at full width when a new navigation interrupts the fade-out', async () => {
    const { rerender } = render(<RouteProgressBar />)

    // Nav A: reach the creep target.
    routerState.isLoading = true
    rerender(<RouteProgressBar />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120 + 16)
    })
    expect(screen.getByTestId('route-progress-bar-fill')).toHaveStyle({ transform: 'scaleX(0.72)' })

    // Nav A finishes — enters the leaving/fade-out phase.
    routerState.isLoading = false
    rerender(<RouteProgressBar />)
    expect(screen.getByTestId('route-progress-bar-fill')).toHaveStyle({
      transform: 'scaleX(1)',
      opacity: '0',
    })

    // Nav B starts before the 200ms fade-out completes.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })
    routerState.isLoading = true
    rerender(<RouteProgressBar />)

    // The bar must not be stuck showing nav A's completed state through nav
    // B's own entry delay — a fresh navigation starts from the same hidden
    // baseline as a first-ever one, not from a stale scaleX(1).
    expect(screen.queryByTestId('route-progress-bar')).not.toBeInTheDocument()

    // Nav B's entry delay elapses — it must creep in from the small start
    // value, not jump from (or ever render at) the leftover scaleX(1).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120)
    })
    const fill = screen.getByTestId('route-progress-bar-fill')
    expect(fill).not.toHaveStyle({ transform: 'scaleX(1)' })
    expect(fill).toHaveStyle({ transform: 'scaleX(0.08)' })
  })

  it('restarts cleanly when a new navigation begins before the previous one ever became visible', async () => {
    const { rerender } = render(<RouteProgressBar />)

    // Nav A starts, but resolves inside its own 120ms entry delay — it never
    // became visible.
    routerState.isLoading = true
    rerender(<RouteProgressBar />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })
    expect(screen.queryByTestId('route-progress-bar')).not.toBeInTheDocument()

    routerState.isLoading = false
    rerender(<RouteProgressBar />)
    routerState.isLoading = true
    rerender(<RouteProgressBar />)

    // Nav B needs its own full, uninterrupted entry delay.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(screen.queryByTestId('route-progress-bar')).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20)
    })
    expect(screen.getByTestId('route-progress-bar-fill')).toHaveStyle({ transform: 'scaleX(0.08)' })
  })

  it('leaves no pending timer behind when unmounted mid-creep', async () => {
    const { rerender, unmount } = render(<RouteProgressBar />)

    routerState.isLoading = true
    rerender(<RouteProgressBar />)
    // Past the entry delay but inside the 16ms creep-start window.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120)
    })

    expect(() => unmount()).not.toThrow()
    // The creep timer (and any other) must have been cleared on unmount —
    // otherwise it would fire and call setState on an unmounted component.
    expect(vi.getTimerCount()).toBe(0)
  })

  it('leaves no pending timer behind when unmounted mid-fade-out', async () => {
    const { rerender, unmount } = render(<RouteProgressBar />)

    routerState.isLoading = true
    rerender(<RouteProgressBar />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120 + 16)
    })

    routerState.isLoading = false
    rerender(<RouteProgressBar />)
    // Inside the 200ms fade-out window.

    expect(() => unmount()).not.toThrow()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('shows immediately, with no transition, under reduced motion', () => {
    reducedMotionState.reduced = true
    routerState.isLoading = true
    render(<RouteProgressBar />)

    const fill = screen.getByTestId('route-progress-bar-fill')
    expect(fill).toBeInTheDocument()
    expect(fill).toHaveStyle({ transition: 'none' })
  })

  it('hides instantly with no completion/fade under reduced motion', () => {
    reducedMotionState.reduced = true
    routerState.isLoading = true
    const { rerender } = render(<RouteProgressBar />)
    expect(screen.getByTestId('route-progress-bar')).toBeInTheDocument()

    routerState.isLoading = false
    rerender(<RouteProgressBar />)
    expect(screen.queryByTestId('route-progress-bar')).not.toBeInTheDocument()
  })
})
