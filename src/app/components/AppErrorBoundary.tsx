import type { PropsWithChildren } from 'react'
import { ErrorBoundary, type ErrorBoundaryFallbackProps } from './ErrorBoundary'

/**
 * Storefront-facing error boundary. Renders an ANVL-branded apology card
 * instead of a blank document when a route subtree throws. Reset target
 * is set by the route loader (we use a `resetKey` prop so navigating to
 * a different route clears the state).
 *
 * Audit refs: Phase A2 / MAINT-11.
 */

type AppErrorBoundaryProps = PropsWithChildren<{ resetKey?: string }>

export function AppErrorBoundary({ children, resetKey }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={renderFallback} resetKey={resetKey}>
      {children}
    </ErrorBoundary>
  )
}

function renderFallback({ error, reset }: ErrorBoundaryFallbackProps) {
  const isDev = import.meta.env?.DEV === true
  return (
    <section
      role="alert"
      aria-live="assertive"
      className="flex min-h-[60vh] items-center justify-center bg-[var(--color-bg)] px-6 py-24 text-[var(--color-text)]"
    >
      <div className="mx-auto w-full max-w-xl text-center">
        <p className="anvl-micro mb-3 text-[var(--color-text-muted)]">
          Something broke
        </p>
        <h1 className="anvl-display text-3xl uppercase tracking-tight sm:text-4xl md:text-5xl">
          Forge interrupted
        </h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)] sm:text-base">
          We hit an unexpected error rendering this page. Try again, or
          head back to the homepage.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 text-sm font-semibold uppercase tracking-wide"
          >
            Try again
          </button>
          <a
            href="/"
            className="focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-5 text-sm font-semibold uppercase tracking-wide text-[var(--color-bg)] no-underline"
          >
            Back to home
          </a>
        </div>
        {isDev ? (
          <pre className="mt-8 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-left text-xs text-[var(--color-text-muted)]">
            {String(error.stack ?? error.message)}
          </pre>
        ) : null}
      </div>
    </section>
  )
}
