import type { TechpackDocument } from '@/features/techpacks/schema/techpack.zod'

import type { TechpackStatus } from '../techpacks.service'
import {
  applyImportPlan,
  buildImportPlan,
  type ImportDrafts,
  type ImportFieldProposal,
  type ImportTarget,
} from './importPlan'

/**
 * Assigning a product to a techpack IS the import.
 *
 * The modal exists for the deliberate case — an operator choosing, field by
 * field, what to take and what to overwrite. But the overwhelmingly common
 * case is a pack that has just been parsed and a product that has nothing
 * authored yet, and making someone open three editors and press the same
 * button three times to move facts they already told us about is busywork.
 *
 * So the assignment fires the import itself, under ONE hard rule: it fills
 * blanks and nothing else. A proposal whose `state` is `differs` means a human
 * has already written something there, and a techpack is authoritative about
 * facts and completely ignorant about voice. Overwriting stays available, but
 * only through the modal, where someone is looking at what they are replacing.
 */

/**
 * Save order, and the order counts are reported in. Fixed so a partial failure
 * is reproducible — "the passport landed, the PDP did not" means the same
 * thing every time.
 */
export const AUTO_IMPORT_TARGETS: readonly ImportTarget[] = ['passport', 'sizeGuide', 'pdp']

const TARGET_LABELS: Record<ImportTarget, string> = {
  passport: 'passport',
  sizeGuide: 'size guide',
  pdp: 'PDP',
}

/** Statuses with no parsed document behind them — nothing to give. */
const UNPARSED_STATUSES: ReadonlySet<TechpackStatus> = new Set<TechpackStatus>(['draft', 'failed'])

export type AutoImportSkipReason = 'no-product' | 'unchanged' | 'not-parsed'

export interface AutoImportTrigger {
  /** The slug the row carried before this save. */
  previousSlug: string
  /** The slug the save just wrote. */
  nextSlug: string
  status: TechpackStatus
}

/**
 * Whether this assignment should import at all, and why not when it should
 * not. Three refusals, all of them about not surprising the operator:
 *
 * - **no-product** — clearing an assignment is a removal, not a request for
 *   data. Importing on the way out would be nonsense.
 * - **unchanged** — saving a title edit, or re-picking the product that is
 *   already there, must not silently re-run a write against three CMS blobs.
 * - **not-parsed** — a draft has never been read and a failed parse has no
 *   document, so there is nothing to offer and a toast would only confuse.
 */
export function autoImportSkipReason(trigger: AutoImportTrigger): AutoImportSkipReason | null {
  const next = trigger.nextSlug.trim()
  if (!next) return 'no-product'
  if (next === trigger.previousSlug.trim()) return 'unchanged'
  if (UNPARSED_STATUSES.has(trigger.status)) return 'not-parsed'
  return null
}

/**
 * The selection rule, stated directly rather than borrowed from
 * `defaultSelected`.
 *
 * `defaultSelected` is the modal's pre-tick — a suggestion a human can
 * override before anything is written. This runs with no human in the loop, so
 * it re-derives the condition from `state`/`blocked` itself: if the modal's
 * default ever loosens, an unattended overwrite must not come with it.
 */
export function autoImportSelection(plan: readonly ImportFieldProposal[]): Set<string> {
  return new Set(
    plan
      .filter((entry) => entry.state === 'empty' && entry.blocked === null)
      .map((entry) => entry.id),
  )
}

export interface AutoImportCounts {
  /** Every field the pack proposed, before the blank-only filter. */
  proposalCount: number
  /** Proposals refused by the disclosure/parse policy. */
  blockedCount: number
  /** Proposals skipped because the field already had content. */
  alreadyFilledCount: number
  /** Fields actually selected for writing. */
  totalFields: number
  countsByTarget: Record<ImportTarget, number>
}

export interface AutoImportPlan extends AutoImportCounts {
  /** The merged drafts — the same pure `applyImportPlan` output as the modal. */
  drafts: ImportDrafts
}

export function planAutoImport(input: {
  doc: TechpackDocument
  drafts: ImportDrafts
}): AutoImportPlan {
  const plan = buildImportPlan(input)
  const selectedIds = autoImportSelection(plan)

  const countsByTarget: Record<ImportTarget, number> = { passport: 0, sizeGuide: 0, pdp: 0 }
  let blockedCount = 0
  for (const entry of plan) {
    if (entry.blocked !== null) blockedCount += 1
    if (selectedIds.has(entry.id)) countsByTarget[entry.target] += 1
  }

  return {
    proposalCount: plan.length,
    blockedCount,
    alreadyFilledCount: plan.length - blockedCount - selectedIds.size,
    totalFields: selectedIds.size,
    countsByTarget,
    drafts: applyImportPlan(plan, selectedIds, input.drafts),
  }
}

export interface AutoImportRunResult extends AutoImportCounts {
  /** Targets whose write reached Supabase, in save order. */
  savedTargets: ImportTarget[]
  /**
   * Targets merged into localStorage whose publish was refused by the CMS
   * hydration lock. The import exists in this browser and nowhere else.
   */
  deferredTargets: ImportTarget[]
  /** The first save failure. Everything after it was never attempted. */
  failure: { target: ImportTarget; message: string } | null
}

export interface AutoImportMessage {
  tone: 'success' | 'info' | 'warning' | 'error'
  message: string
}

function countList(
  counts: Record<ImportTarget, number>,
  targets: readonly ImportTarget[],
): string {
  return targets
    .filter((target) => counts[target] > 0)
    .map((target) => `${TARGET_LABELS[target]} ${counts[target]}`)
    .join(' · ')
}

/** `passport`, `passport and PDP`, `passport, size guide and PDP`. */
function labelList(targets: readonly ImportTarget[]): string {
  const labels = targets.map((target) => TARGET_LABELS[target])
  if (labels.length <= 1) return labels.join('')
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

/**
 * The sentence for a publish that never left the browser.
 *
 * Deliberately its own sentence rather than a qualifier on the count: the merge
 * genuinely happened and the publish genuinely did not, and an operator who
 * reads only the first half must still not be left believing the storefront has
 * it. It names the lock because that is what makes the retry worth pressing —
 * a hydration pull finishes on its own in seconds.
 */
function deferredSentence(targets: readonly ImportTarget[]): string {
  const verb = targets.length === 1 ? 'was' : 'were'
  return `Saved in this browser only — the CMS was reloading, so the ${labelList(targets)} ${verb} not published.`
}

/**
 * The sentence for fields the policy refused.
 *
 * Blocked proposals used to be mentioned ONLY when nothing at all was imported,
 * which is exactly backwards: a pack that imported eleven of thirteen fields
 * looks finished, and the two that were refused are usually the two an operator
 * could still act on.
 */
function blockedSentence(count: number): string {
  return `${count} field${count === 1 ? '' : 's'} could not be imported — see the parse issues.`
}

/**
 * What to tell the operator.
 *
 * "Nothing was imported" is three genuinely different situations and they need
 * three different sentences — a pack that could not be read is a parsing
 * problem, a pack whose fields are all already filled is not a problem at all,
 * and a pack that is entirely blocked is a policy refusal with a reason
 * sitting in the issue queue. Collapsing them into one message is how an
 * operator ends up re-uploading a pack that was working perfectly.
 *
 * "It worked" splits the same way, and for the same reason. A clean import, an
 * import that left blocked fields behind, and an import that reached
 * localStorage but not Supabase are three different states with three different
 * next actions — nothing, go read the issues, press retry. Only the first is a
 * success, so only the first gets said like one.
 *
 * A mid-sequence failure never claims atomicity: it names what landed first.
 */
export function describeAutoImport(result: AutoImportRunResult): AutoImportMessage {
  const deferred = result.deferredTargets

  if (result.failure) {
    const failed = TARGET_LABELS[result.failure.target]
    const landed = countList(result.countsByTarget, result.savedTargets)
    const head = landed
      ? `Imported ${landed}, then saving the ${failed} failed: ${result.failure.message}`
      : `Nothing was imported — saving the ${failed} failed: ${result.failure.message}`
    return {
      tone: 'error',
      message: deferred.length > 0 ? `${head} ${deferredSentence(deferred)}` : head,
    }
  }

  if (result.totalFields === 0) {
    if (result.proposalCount === 0) {
      return { tone: 'info', message: 'Nothing to import — nothing could be read from this pack.' }
    }
    if (result.alreadyFilledCount === 0) {
      return {
        tone: 'info',
        message: 'Nothing to import — every field this pack offers is blocked. See the parse issues.',
      }
    }
    return {
      tone: 'info',
      message: 'Nothing to import — everything this pack could fill in was already filled in.',
    }
  }

  const fields = `${result.totalFields} field${result.totalFields === 1 ? '' : 's'}`
  const head = `Imported ${fields} — ${countList(result.countsByTarget, AUTO_IMPORT_TARGETS)}`

  const caveats: string[] = []
  if (result.blockedCount > 0) caveats.push(blockedSentence(result.blockedCount))
  if (deferred.length > 0) caveats.push(deferredSentence(deferred))
  if (caveats.length === 0) return { tone: 'success', message: head }

  // The count only becomes a sentence once something follows it, so the period
  // is added here rather than baked into a headline that usually stands alone.
  return {
    tone: deferred.length > 0 ? 'warning' : 'success',
    message: [`${head}.`, ...caveats].join(' '),
  }
}
