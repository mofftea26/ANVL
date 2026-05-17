import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * React 19 still requires class components for render-error boundaries.
 * This base component is API-only; presentational variants live alongside
 * (`AppErrorBoundary`, `AdminErrorBoundary`) and pass a `fallback`.
 *
 * Logs to `console.error` on first catch — replace with a real logger
 * once one exists. Reset state via the `resetKey` prop (e.g. route path).
 *
 * Audit refs: Phase A2 / MAINT-11.
 */

export type ErrorBoundaryFallbackProps = {
  error: Error
  reset: () => void
}

type ErrorBoundaryProps = {
  children: ReactNode
  /** Render prop fallback. Receives the caught error + a reset callback. */
  fallback: (props: ErrorBoundaryFallbackProps) => ReactNode
  /** When this value changes between renders, the boundary state resets. */
  resetKey?: string | number
  /** Optional logger hook (defaults to `console.error`). */
  onError?: (error: Error, info: ErrorInfo) => void
}

type ErrorBoundaryState = { error: Error | null }

const INITIAL_STATE: ErrorBoundaryState = { error: null }

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = INITIAL_STATE

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, info)
      return
    }
    // eslint-disable-next-line no-console -- defensive logging path
    console.error('[anvl] error boundary caught', error, info.componentStack)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState(INITIAL_STATE)
    }
  }

  reset = (): void => {
    this.setState(INITIAL_STATE)
  }

  render(): ReactNode {
    if (this.state.error !== null) {
      return this.props.fallback({ error: this.state.error, reset: this.reset })
    }
    return this.props.children
  }
}
