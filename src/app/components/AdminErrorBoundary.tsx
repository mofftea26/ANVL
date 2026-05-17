import type { PropsWithChildren } from 'react'
import { ErrorBoundary, type ErrorBoundaryFallbackProps } from './ErrorBoundary'

/**
 * Admin-only error boundary. Keeps the admin chrome usable when a sub
 * panel throws (e.g. an editor tab) instead of blanking the whole shell.
 * Always shows the error message in admin (operators need it), with the
 * full stack collapsed under a details disclosure in dev.
 *
 * Audit refs: Phase A2 / MAINT-11.
 */

type AdminErrorBoundaryProps = PropsWithChildren<{ resetKey?: string }>

export function AdminErrorBoundary({ children, resetKey }: AdminErrorBoundaryProps) {
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
      className="flex min-h-[40vh] items-center justify-center px-6 py-12"
    >
      <div className="mx-auto w-full max-w-lg rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-[var(--color-text)]">
        <p className="anvl-micro mb-2 text-[var(--color-text-muted)]">
          Admin panel error
        </p>
        <h2 className="text-xl font-semibold uppercase tracking-tight">
          This panel crashed
        </h2>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          {error.message || 'Unknown error.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-4 text-sm font-semibold"
          >
            Retry panel
          </button>
          <a
            href="/admin"
            className="focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-4 text-sm font-semibold no-underline"
          >
            Back to admin home
          </a>
        </div>
        {isDev && error.stack ? (
          <details className="mt-4 text-xs text-[var(--color-text-muted)]">
            <summary className="focus-ring inline-block cursor-pointer rounded px-1 py-1">
              Show stack
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] p-3 text-left">
              {error.stack}
            </pre>
          </details>
        ) : null}
      </div>
    </section>
  )
}
