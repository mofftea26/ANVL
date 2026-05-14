/**
 * Placeholder SEO hub — global defaults are served from `getSiteSeo` in the
 * mock CMS client until a full editor persists into `siteSeo.local`.
 */
export function SeoCmsHub() {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
      <p>
        Route-level SEO is composed in loaders from landing content, active drop
        SEO, and site defaults. A structured editor will connect to local
        storage here when expanded.
      </p>
    </div>
  )
}
