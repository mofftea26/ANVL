import type { PassportProductContent } from '@/features/cms/passportContent/passportContent.zod'
import type { PdpProductContent } from '@/features/cms/pdpContent/pdpContent.zod'
import type { SizeProductEntry } from '@/features/cms/support/supportContent.zod'
import { isStrippedText } from '@/features/techpacks/parse/strip'
import { isInternalPath } from '@/features/techpacks/schema/techpackDisclosure'

/**
 * One import proposal: a single selectable field patch, and the gates it must
 * pass before it is offered at all.
 *
 * An import is a list of these, never a bulk overwrite. That shape exists for
 * one reason: a techpack is authoritative about facts and completely ignorant
 * about the voice an operator has already written. Replacing authored copy
 * with extracted copy is the failure mode that makes an import tool something
 * people stop trusting.
 *
 * Hence the rule encoded in `defaultSelected`: **only fields where nothing is
 * currently rendering are pre-selected.** Anything that would displace what is
 * on the page is offered, shown next to what it would replace, and left
 * unticked until a human decides.
 *
 * Split out of `importPlan.ts` so that file can stay a readable map of WHICH
 * fields a pack offers, while the judgement about ONE field lives here.
 */

export type ImportTarget = 'passport' | 'sizeGuide' | 'pdp'

export interface ImportDrafts {
  passport: PassportProductContent
  size: SizeProductEntry
  pdp: PdpProductContent
}

export interface ImportFieldProposal {
  id: string
  target: ImportTarget
  /** Dotted path within the target, for display. */
  path: string
  label: string
  /** Which techpack page this came from — provenance an operator can check. */
  sourcePage: number
  next: unknown
  /** What is rendering there now — which is not always the field's own value. */
  current: unknown
  state: 'empty' | 'differs' | 'same'
  defaultSelected: boolean
  /** Non-null when the field cannot be imported yet, with the reason why. */
  blocked: string | null
  /** Pure updater. Kept as a function so no string-path setter is needed. */
  apply: (drafts: ImportDrafts) => ImportDrafts
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Gate 1 of the disclosure policy.
 *
 * This used to test the proposal's `path` — its DESTINATION key in a CMS blob
 * (`care.steps`, `specs.construction`, `table`) — against
 * `INTERNAL_ONLY_PATHS`, which lists SOURCE paths in the techpack document
 * (`technical.seams.*.supplierRef`, `branding.*.dimensions`). The two
 * namespaces never overlap, so not one proposal could ever match: the branch
 * read like a second line of defence and was dead code. The only real
 * protection was mapper discipline, and the backstop meant to catch a mapper
 * mistake could not fire.
 *
 * So a proposal now declares what it READ, and that is what is checked.
 * `sourcePaths` is required rather than optional on purpose — a new mapper
 * cannot be added without stating its sources, which is what turns this from a
 * comment into a gate.
 */
export function internalSourceReason(sourcePaths: readonly string[]): string | null {
  const internal = sourcePaths.filter((path) => isInternalPath(path))
  if (internal.length === 0) return null
  return `This reads ${internal.join(', ')}, which is internal-only and cannot be published.`
}

/**
 * Gate 2 of the stripping policy.
 *
 * The parser strips at capture and again at assembly, but an operator can also
 * type or paste into these fields, and a techpack from a future supplier may
 * carry a phrase the patterns did not anticipate. Refusing at the write
 * boundary is cheap and closes the loop.
 */
function containsBlockedText(value: unknown): boolean {
  if (typeof value === 'string') return isStrippedText(value)
  if (Array.isArray(value)) return value.some((entry) => containsBlockedText(entry))
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((entry) =>
      containsBlockedText(entry),
    )
  }
  return false
}

export interface ProposalInput {
  id: string
  target: ImportTarget
  path: string
  label: string
  /**
   * The techpack fields this proposal read, leaf by leaf. The disclosure gate
   * has nothing else to go on — see {@link internalSourceReason}.
   */
  sourcePaths: readonly string[]
  sourcePage?: number
  next: unknown
  current: unknown
  /**
   * The other sources that render in this field's place while its own key is
   * unset — a legacy sibling, or another blob the storefront resolver falls
   * back to. First non-empty wins, mirroring the resolver. The mirrors live in
   * `renderedCurrent.ts`, which explains why this exists at all.
   */
  renderedBy?: readonly unknown[]
  blocked?: string | null
  apply: (drafts: ImportDrafts) => ImportDrafts
}

/**
 * What is on the page for this field right now: its own value, or — when that
 * key is unset — the first fallback the storefront would render instead.
 *
 * Presenting the fallback as `current` (rather than blocking the row) is
 * deliberate. The content is real, authored, and directly comparable with what
 * the pack offers, so the honest thing is to show both and let a human choose.
 * The safety comes from the `differs` state that follows: the unattended
 * import will not touch it.
 */
function currentlyRendered(input: ProposalInput): unknown {
  if (!isEmptyValue(input.current)) return input.current
  return (input.renderedBy ?? []).find((value) => !isEmptyValue(value)) ?? input.current
}

export function buildProposal(input: ProposalInput): ImportFieldProposal | null {
  let blocked = input.blocked ?? null
  if (!blocked) blocked = internalSourceReason(input.sourcePaths)
  if (!blocked && containsBlockedText(input.next)) {
    blocked = 'This value still contains supplier text and was not imported.'
  }

  // Nothing to offer and nothing to explain — drop it. A BLOCKED row is kept
  // even when it has no value, because the reason is the point: "this care
  // label is artwork only" is exactly what an operator needs to be told, and
  // hiding it just leaves a mystery gap in the passport.
  if (isEmptyValue(input.next) && !blocked) return null

  const current = currentlyRendered(input)
  const state: ImportFieldProposal['state'] = sameValue(input.next, current)
    ? 'same'
    : isEmptyValue(current)
      ? 'empty'
      : 'differs'

  return {
    id: input.id,
    target: input.target,
    path: input.path,
    label: input.label,
    sourcePage: input.sourcePage ?? 0,
    next: input.next,
    current,
    state,
    // The non-destructive rule: never pre-tick something that displaces copy.
    defaultSelected: state === 'empty' && !blocked,
    blocked,
    apply: input.apply,
  }
}
