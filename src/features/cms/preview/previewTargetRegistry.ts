/**
 * Preview target → editor mapping registry (data-only, storefront-safe).
 *
 * Maps every target id the storefront emits (`data-anvl-preview-target` /
 * the Oath's `data-scene` fallback) to the admin editor page that owns it and
 * a stable DOM anchor id the editor renders on the owning control. Powers the
 * inspector's locate-in-editor: inspect-click → resolve → navigate/scroll to
 * the anchor. Ordered first-match-wins; ids with no owning editor (`site:page`
 * — the whole-page marker every editor can ring but none owns) resolve to
 * null and degrade to a toast on the admin side.
 */

/** Admin editor routes the registry can send the user to (closed union). */
export type PreviewEditorRoute =
  | '/admin'
  | '/admin/shop'
  | '/admin/products'
  | '/admin/passports'
  | '/admin/content'
  | '/admin/about'
  | '/admin/coming-soon'

export interface PreviewTargetEditorMatch {
  adminRoute: PreviewEditorRoute
  /** DOM id of the editor control that owns this target (see below). */
  anchorId: string
}

/**
 * Stable DOM id for the editor control anchoring a target id — `:` (and any
 * other non-id-safe run) collapses to `-`: `about:orb-3` → `pt-anchor-about-orb-3`.
 */
export function previewFieldAnchorId(targetId: string): string {
  return `pt-anchor-${targetId.replace(/[^a-zA-Z0-9_-]+/g, '-')}`
}

interface PreviewTargetRegistryEntry {
  pattern: RegExp
  /** null = recognized but unowned — resolve gracefully to "no editor". */
  adminRoute: PreviewEditorRoute | null
}

const PREVIEW_TARGET_REGISTRY: PreviewTargetRegistryEntry[] = [
  // Whole-page marker — every editor rings it, none owns it.
  { pattern: /^site:page$/, adminRoute: null },
  { pattern: /^shop:(hero|toolbar|grid)$/, adminRoute: '/admin/shop' },
  { pattern: /^pdp:(materials|care|details)$/, adminRoute: '/admin/products' },
  // The passport editor is the per-product content page; the prefix
  // `/admin/passports/content/$slug` still resolves to this route (same-page
  // locate rings the owning tab). authenticity/story have no distinct tab —
  // recognized so inspect-click degrades gracefully rather than as "unmapped".
  {
    pattern:
      /^passport:(identity|piece|material|blueprint|specs|care|fit|details|forge-notes|origin|authenticity|story)$/,
    adminRoute: '/admin/passports',
  },
  { pattern: /^the-oath:(hero|manifesto|tenets|products|finale)$/, adminRoute: '/admin/content' },
  { pattern: /^about:(hero|marquee)$/, adminRoute: '/admin/about' },
  { pattern: /^about:orb-\d+$/, adminRoute: '/admin/about' },
  // The banner editor is a dashboard modal (DropStatusModal → customize),
  // not a page — locate lands on the dashboard; no static anchor exists.
  { pattern: /^banner:rail$/, adminRoute: '/admin' },
  { pattern: /^coming-soon:page$/, adminRoute: '/admin/coming-soon' },
]

/**
 * Resolve a storefront target id to the admin editor that owns it, or null
 * when nothing does (unknown ids and the unowned `site:page`).
 */
export function resolvePreviewTargetToEditor(
  targetId: string,
): PreviewTargetEditorMatch | null {
  for (const entry of PREVIEW_TARGET_REGISTRY) {
    if (!entry.pattern.test(targetId)) continue
    if (!entry.adminRoute) return null
    return { adminRoute: entry.adminRoute, anchorId: previewFieldAnchorId(targetId) }
  }
  return null
}
