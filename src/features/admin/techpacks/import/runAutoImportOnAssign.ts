import { toast } from 'sonner'

import type { TechpackDocument } from '@/features/techpacks/schema/techpack.zod'

import type { TechpackStatus } from '../techpacks.service'
import {
  autoImportSkipReason,
  describeAutoImport,
  type AutoImportMessage,
} from './autoImportPlan'
import { publishAutoImportTargets, runAutoImport } from './autoImportRun'
import type { ImportTarget } from './importPlan'

/**
 * Fire the blank-filling import when a techpack gains a product.
 *
 * **Deliberately not a hook, and it must not become one again.** This was
 * `useAutoImportOnAssign`, called from `mutate(vars, { onSuccess })` — an
 * observer-level callback React Query v5 only runs while the observer still
 * has listeners (`MutationObserver.#notify` guards on `hasListeners()`, and
 * `useMutation` unsubscribes on unmount). Navigating away, or just selecting a
 * different techpack, between pressing Save and the save resolving meant the
 * assignment landed and the import silently never happened.
 *
 * A plain module function called from the MUTATION-level `onSuccess` — which
 * `Mutation.execute()` awaits regardless of who is watching — cannot be dropped
 * that way. Nothing here touches React state, so there is nothing left to
 * unmount, and the file is named for what it is so the next reader does not
 * reach for `useState` on the way past.
 *
 * Callers MUST invoke this only after the assignment itself has succeeded.
 * Importing off an optimistic assignment would write three CMS blobs for a
 * pairing the database rejected.
 */

export interface AutoImportOnAssignInput {
  /** The slug the row carried before the save that just succeeded. */
  previousSlug: string
  nextSlug: string
  status: TechpackStatus
  document: TechpackDocument
}

/** How long a message an operator has to act on stays up. */
const ACTIONABLE_TOAST_MS = 12_000

/**
 * Republish blobs the hydration lock held back.
 *
 * Retries the PUBLISH, never the import: localStorage already holds the merged
 * content, so re-running the plan would find every field filled and push
 * nothing at all.
 */
async function retryPublish(targets: readonly ImportTarget[]): Promise<void> {
  const outcome = await publishAutoImportTargets(targets)
  if (outcome.failure) {
    toast.error(`Publishing the import failed: ${outcome.failure.message}`)
    return
  }
  if (outcome.deferred.length > 0) {
    toast.warning('The CMS is still reloading — the import is not published yet.', {
      duration: ACTIONABLE_TOAST_MS,
      action: { label: 'Try again', onClick: () => void retryPublish(outcome.deferred) },
    })
    return
  }
  toast.success('The techpack import is published.')
}

function report(result: AutoImportMessage, deferred: readonly ImportTarget[]): void {
  if (result.tone === 'error') {
    toast.error(result.message)
    return
  }
  if (result.tone === 'warning') {
    // The only message with something to do about it: the lock clears on its
    // own, so the operator needs one press rather than a re-upload.
    toast.warning(result.message, {
      duration: ACTIONABLE_TOAST_MS,
      action: { label: 'Publish now', onClick: () => void retryPublish(deferred) },
    })
    return
  }
  if (result.tone === 'info') toast.info(result.message)
  else toast.success(result.message)
}

export async function runAndReportAutoImport(input: AutoImportOnAssignInput): Promise<void> {
  // Silent on a skip. A cleared or unchanged assignment did not ask for an
  // import, and an unparsed pack has nothing to say — a toast for any of them
  // would be noise attached to an unrelated Save.
  if (autoImportSkipReason(input) !== null) return

  try {
    const result = await runAutoImport({
      doc: input.document,
      productSlug: input.nextSlug.trim(),
    })
    report(describeAutoImport(result), result.deferredTargets)
  } catch (error) {
    // Planning or a storage read blew up — the saves report their own failures
    // through the result, so reaching here means something else.
    toast.error(error instanceof Error ? error.message : 'The techpack import could not run.')
  }
}
