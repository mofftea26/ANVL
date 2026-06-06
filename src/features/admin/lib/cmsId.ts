/**
 * Lightweight, dependency-free id generator for new CMS list items.
 * `crypto.randomUUID()` is used when available so dev/prod parity is
 * clean; the timestamp fallback keeps SSR and older browsers happy.
 *
 * Relocated from the (removed) drop-builder `landing-cms` module during the
 * CMS teardown — see `docs/cms-teardown-plan.md`.
 */
export function createCmsId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${random}`
}
