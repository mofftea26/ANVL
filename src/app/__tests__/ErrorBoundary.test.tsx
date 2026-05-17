import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'

function Boom({ when }: { when: boolean }) {
  if (when) throw new Error('boom')
  return <p>healthy</p>
}

describe('ErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    const fallback = vi.fn()
    render(
      <ErrorBoundary fallback={fallback}>
        <p>safe content</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('safe content')).toBeTruthy()
    expect(fallback).not.toHaveBeenCalled()
  })

  it('catches a render error and renders the fallback with reset', () => {
    const onError = vi.fn()
    render(
      <ErrorBoundary
        onError={onError}
        fallback={({ error, reset }) => (
          <div>
            <span>caught:{error.message}</span>
            <button type="button" onClick={reset}>
              retry
            </button>
          </div>
        )}
      >
        <Boom when={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText(/caught:boom/)).toBeTruthy()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('reset callback clears the error state', () => {
    const ui = (when: boolean) => (
      <ErrorBoundary
        onError={() => {}}
        fallback={({ reset }) => (
          <button type="button" onClick={reset}>
            retry
          </button>
        )}
      >
        <Boom when={when} />
      </ErrorBoundary>
    )

    const { rerender } = render(ui(true))
    expect(screen.getByText('retry')).toBeTruthy()
    // Stop the source of the error before reset.
    rerender(ui(false))
    fireEvent.click(screen.getByText('retry'))
    expect(screen.getByText('healthy')).toBeTruthy()
  })

  it('resets when resetKey changes', () => {
    const ui = (key: string, when: boolean) => (
      <ErrorBoundary
        onError={() => {}}
        resetKey={key}
        fallback={() => <span>fallback-shown</span>}
      >
        <Boom when={when} />
      </ErrorBoundary>
    )

    const { rerender } = render(ui('/a', true))
    expect(screen.getByText('fallback-shown')).toBeTruthy()
    rerender(ui('/b', false))
    expect(screen.getByText('healthy')).toBeTruthy()
  })
})
