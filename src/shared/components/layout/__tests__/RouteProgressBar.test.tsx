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

  it('shows immediately, with no transition, under reduced motion', () => {
    reducedMotionState.reduced = true
    routerState.isLoading = true
    render(<RouteProgressBar />)

    const fill = screen.getByTestId('route-progress-bar-fill')
    expect(fill).toBeInTheDocument()
    expect(fill).toHaveStyle({ transition: 'none' })
  })
})
