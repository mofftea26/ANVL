/**
 * Branded 404 — configured as the router's `defaultNotFoundComponent` so a
 * missing route (mistyped URL, stale link/preload) renders an ANVL page
 * instead of TanStack's generic `<p>Not Found</p>`, and the router stops
 * warning that no `notFoundComponent` is configured.
 */
export function AppNotFound() {
  return (
    <section
      role="alert"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center bg-[var(--color-bg)] px-6 py-24 text-[var(--color-text)]"
    >
      <div className="mx-auto w-full max-w-xl text-center">
        <p className="anvl-micro mb-3 text-[var(--color-text-muted)]">Error 404</p>
        <h1 className="anvl-display text-3xl uppercase tracking-tight sm:text-4xl md:text-5xl">
          Off the forged path
        </h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)] sm:text-base">
          This page was never struck — or it has been retired. Find your way
          back to the drop.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/"
            className="focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-5 text-sm font-semibold uppercase tracking-wide text-[var(--color-bg)] no-underline"
          >
            Back to home
          </a>
          <a
            href="/shop"
            className="focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 text-sm font-semibold uppercase tracking-wide no-underline"
          >
            Enter the armory
          </a>
        </div>
      </div>
    </section>
  )
}
