import {
  deleteTechpackImage,
  promoteTechpackImage,
  type TechpackImageRow,
} from './techpackFiles.service'
import type { TechpackResult } from './techpacks.service'

/**
 * Promote or delete many extracted images in one action.
 *
 * A pack yields dozens of images and most are page furniture, so reviewing them
 * one modal at a time is the difference between a minute and a quarter of an
 * hour.
 *
 * Two decisions worth stating:
 *
 * - **Sequential, never `Promise.all`.** Each operation is several round trips
 *   (download, re-upload, catalogue write), and the admin client refreshes no
 *   token of its own. Firing thirty at once buys nothing on a rate-limited API
 *   and turns one expired session into thirty identical failures.
 * - **Partial success is a real outcome and is reported as such.** The run does
 *   not stop at the first failure — the operator asked for twelve, and eleven
 *   landing is worth knowing precisely. Aborting halfway would leave them
 *   guessing which half.
 */

export interface BulkImageOutcome {
  succeeded: number
  /** Ineligible rather than broken — already promoted, or promoted so undeletable. */
  skipped: number
  failed: number
  /** First few real failures, for a message an operator can act on. */
  errors: string[]
}

/** Enough to diagnose a pattern; past that the list stops being readable. */
const MAX_REPORTED_ERRORS = 3

function summarise(outcome: BulkImageOutcome, verb: string): string {
  const parts = [`${outcome.succeeded} ${verb}`]
  if (outcome.skipped > 0) parts.push(`${outcome.skipped} skipped`)
  if (outcome.failed > 0) parts.push(`${outcome.failed} failed`)
  return parts.join(' · ')
}

async function runBulk(
  images: readonly TechpackImageRow[],
  eligible: (image: TechpackImageRow) => boolean,
  run: (image: TechpackImageRow) => Promise<TechpackResult<unknown>>,
): Promise<BulkImageOutcome> {
  const outcome: BulkImageOutcome = { succeeded: 0, skipped: 0, failed: 0, errors: [] }

  for (const image of images) {
    if (!eligible(image)) {
      outcome.skipped += 1
      continue
    }
    const res = await run(image)
    if (res.ok) {
      outcome.succeeded += 1
    } else {
      outcome.failed += 1
      if (outcome.errors.length < MAX_REPORTED_ERRORS) outcome.errors.push(res.error)
    }
  }

  return outcome
}

/** Publish every not-yet-published image in the selection into `cms-media`. */
export async function promoteTechpackImages(
  images: readonly TechpackImageRow[],
  productSlug: string,
): Promise<TechpackResult<BulkImageOutcome>> {
  const stem = productSlug || 'techpack'
  const outcome = await runBulk(
    images,
    (image) => !image.promotedMediaId,
    (image) => promoteTechpackImage(image, { filename: `${stem}-${image.refId}.webp` }),
  )

  // Nothing succeeded and something was attempted: that is a failure, not a
  // quiet no-op, so the caller can surface it as one.
  if (outcome.succeeded === 0 && outcome.failed > 0) {
    return { ok: false, error: `Nothing was published. ${outcome.errors[0] ?? ''}`.trim() }
  }
  return { ok: true, data: outcome }
}

/** Remove every deletable image in the selection. Promoted ones are skipped. */
export async function deleteTechpackImages(
  images: readonly TechpackImageRow[],
): Promise<TechpackResult<BulkImageOutcome>> {
  const outcome = await runBulk(
    images,
    (image) => !image.promotedMediaId,
    (image) => deleteTechpackImage(image),
  )

  if (outcome.succeeded === 0 && outcome.failed > 0) {
    return { ok: false, error: `Nothing was deleted. ${outcome.errors[0] ?? ''}`.trim() }
  }
  return { ok: true, data: outcome }
}

/** One line an operator can read at a glance: `9 published · 3 skipped`. */
export function describeBulkOutcome(outcome: BulkImageOutcome, verb: string): string {
  return summarise(outcome, verb)
}
