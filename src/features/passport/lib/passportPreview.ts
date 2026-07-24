/**
 * Preview-only contract for the /p/$token passport route (storefront-safe).
 *
 * The real passport is token-gated + noindex, so the admin live-preview panel
 * can't point at a customer's claimed token. Instead it navigates the iframe to
 * a reserved sentinel token that the route recognizes ONLY to synthesize a
 * representative passport from public product data — no RPC, no customer PII.
 * A `previewView` query flag forces the guest (public authenticity) vs. owner
 * (dossier) surface so the editor can see both with the unsaved draft applied.
 */

/** Reserved token → the route builds a synthetic passport instead of an RPC read. */
export const PASSPORT_PREVIEW_TOKEN = '__preview__'

export type PassportPreviewView = 'guest' | 'owner'

export function isPassportPreviewToken(token: string): boolean {
  return token === PASSPORT_PREVIEW_TOKEN
}

export function normalizePassportPreviewView(raw: unknown): PassportPreviewView {
  return raw === 'owner' ? 'owner' : 'guest'
}

/** Build the iframe route the preview panel loads (the panel appends `anvl-cms-preview=1`). */
export function buildPassportPreviewRoute(slug: string, view: PassportPreviewView): string {
  const params = new URLSearchParams()
  if (slug) params.set('previewSlug', slug)
  params.set('previewView', view)
  return `/p/${PASSPORT_PREVIEW_TOKEN}?${params.toString()}`
}
