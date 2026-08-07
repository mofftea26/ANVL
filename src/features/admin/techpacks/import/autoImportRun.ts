import type { CmsSettingsFieldKey } from '@/features/admin/cmsRemote/adminCmsRemoteSync'
import {
  readPassportContentFromStorage,
  writePassportContentToStorage,
} from '@/features/cms/passportContent/passportContent.settings'
import { DEFAULT_PASSPORT_PRODUCT_CONTENT } from '@/features/cms/passportContent/passportContent.zod'
import {
  assertPdpContentHydrated,
  readPdpContentFromStorage,
  writePdpContentToStorage,
} from '@/features/cms/pdpContent/pdpContent.settings'
import { DEFAULT_PDP_PRODUCT_CONTENT } from '@/features/cms/pdpContent/pdpContent.zod'
import {
  readSupportContentFromStorage,
  writeSupportContentToStorage,
} from '@/features/cms/support/supportContent.settings'
import type { SizeProductEntry } from '@/features/cms/support/supportContent.zod'
import type { TechpackDocument } from '@/features/techpacks/schema/techpack.zod'

import {
  AUTO_IMPORT_TARGETS,
  planAutoImport,
  type AutoImportRunResult,
} from './autoImportPlan'
import type { ImportDrafts, ImportTarget } from './importPlan'

/**
 * The write side of the assignment-triggered import.
 *
 * The drafts come from the SAME localStorage working copies the three editors
 * bind to (`read*FromStorage` / `write*ToStorage`). There is deliberately no
 * second path: a parallel store for three published blobs would mean an
 * operator's open editor and this import could each hold a different idea of
 * the truth, and whichever saved last would win silently.
 *
 * What it does NOT reuse is the editors' `save*Async`, and that is the whole
 * point of this module's shape. `save*Async` writes localStorage and then calls
 * `afterLocalCmsMutation`, which flattens EVERY `skipped` flush into
 * `{ ok: true }` — including `hydration-lock`, the one skip that means "this
 * should have reached Supabase and did not". An import that only knows "it did
 * not throw" cannot tell a publish from a deferral, so it does the two steps
 * itself and reads the real flush result.
 */

/** A blank size-guide entry, matching the modal's own fallback. */
const EMPTY_SIZE_ENTRY: SizeProductEntry = { note: '', columns: [], rows: [] }

/** The `cms_settings` column each target publishes through. */
const TARGET_CMS_FIELDS: Record<ImportTarget, CmsSettingsFieldKey> = {
  passport: 'passport_content',
  sizeGuide: 'support_content',
  pdp: 'pdp_content',
}

/**
 * `published` — Supabase has it (or is not expected to: tests, SSR and a
 * Supabase-less dev box are benign no-ops for every CMS save in the app).
 * `deferred` — the local write landed and the publish did not.
 */
type TargetPublishOutcome = 'published' | 'deferred'

function currentDrafts(productSlug: string): ImportDrafts {
  return {
    passport:
      readPassportContentFromStorage()[productSlug] ??
      structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT),
    size: readSupportContentFromStorage().sizeGuide.perProduct[productSlug] ?? {
      ...EMPTY_SIZE_ENTRY,
    },
    pdp: readPdpContentFromStorage()[productSlug] ?? { ...DEFAULT_PDP_PRODUCT_CONTENT },
  }
}

/**
 * Splice this product's merged draft into its blob, in localStorage only.
 *
 * Each map is re-read immediately before its own write rather than reused from
 * the planning read: a publish is a network round trip, and by the time the
 * third one starts the snapshot taken before the first is seconds old. Only
 * this product's key is replaced, so nothing else in the map is at risk either
 * way.
 */
function writeTarget(target: ImportTarget, productSlug: string, drafts: ImportDrafts): void {
  if (target === 'passport') {
    const config = readPassportContentFromStorage()
    writePassportContentToStorage({ ...config, [productSlug]: drafts.passport })
    return
  }
  if (target === 'pdp') {
    // MUST come before the write. `pdp_content` is the one whole-map blob this
    // browser may never have hydrated (it is pulled by `adminCmsHydration`, but
    // that pull can fail), and publishing an unhydrated snapshot erases every
    // other product. `savePdpContentAsync` asserts this for the editors; we do
    // not go through it — we write and flush separately so a hydration-locked
    // publish can be reported as deferred rather than silently swallowed — so
    // the assertion has to be made here explicitly. The flush's own guard
    // cannot help: by then the write below has created the key it probes for.
    assertPdpContentHydrated()
    writePdpContentToStorage({ ...readPdpContentFromStorage(), [productSlug]: drafts.pdp })
    return
  }
  const config = readSupportContentFromStorage()
  writeSupportContentToStorage({
    ...config,
    sizeGuide: {
      ...config.sizeGuide,
      perProduct: { ...config.sizeGuide.perProduct, [productSlug]: drafts.size },
    },
  })
}

/**
 * Push one blob to Supabase and say truthfully whether it got there.
 *
 * Only `hydration-lock` counts as a deferral. It is raised while an admin CMS
 * pull is in flight — the AdminAuthProvider heartbeat is enough to trigger one
 * — and it means the write was refused for timing reasons and can be retried.
 * The other skips describe environments where nothing publishes at all, which
 * every other editor in the CMS already treats as success.
 */
async function publishTarget(target: ImportTarget): Promise<TargetPublishOutcome> {
  // MUST stay a dynamic import, and this must remain the ONLY reference to
  // `cmsWriteThrough` outside `cmsRemote/` itself.
  //
  // Every storefront `*.settings.ts` module already reaches this same module
  // lazily. A single static import anywhere defeats all of them: Rolldown warns
  // `[INEFFECTIVE_DYNAMIC_IMPORT] … dynamic import will not move module into
  // another chunk` and pins `cmsWriteThrough` — plus its static dependents
  // `adminCmsRemoteSync` → `adminSupabaseBrowserClient` → **all of
  // @supabase/supabase-js** — into the chunk the storefront entry imports for
  // its CMS schemas. That is what kept the SDK on the eager entry graph.
  //
  // This file is admin-only, so deferring costs nothing here.
  const { flushAdminCmsWriteThrough } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const result = await flushAdminCmsWriteThrough([TARGET_CMS_FIELDS[target]])
  if (result.status === 'error') throw new Error(result.message)
  if (result.status === 'skipped' && result.reason === 'hydration-lock') return 'deferred'
  return 'published'
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error.'
}

export interface AutoImportPublishOutcome {
  published: ImportTarget[]
  deferred: ImportTarget[]
  /** The first publish failure. Everything after it was never attempted. */
  failure: { target: ImportTarget; message: string } | null
}

/**
 * Publish already-merged blobs, with no planning step.
 *
 * This is what a retry has to call. Going back through `runAutoImport` would
 * re-plan against a localStorage that ALREADY holds the merged content, find
 * every field filled, and publish precisely nothing.
 *
 * Sequential for the same reason the run is: every flush reads the whole local
 * snapshot, so two in flight can publish each other's half-written state.
 */
export async function publishAutoImportTargets(
  targets: readonly ImportTarget[],
): Promise<AutoImportPublishOutcome> {
  const published: ImportTarget[] = []
  const deferred: ImportTarget[] = []
  for (const target of targets) {
    try {
      if ((await publishTarget(target)) === 'deferred') deferred.push(target)
      else published.push(target)
    } catch (error) {
      return { published, deferred, failure: { target, message: errorMessage(error) } }
    }
  }
  return { published, deferred, failure: null }
}

/**
 * Plan the import for one product and write it.
 *
 * Saves run STRICTLY SEQUENTIALLY. Every publish flushes the whole local CMS
 * snapshot to Supabase; two in flight interleave, and the later flush can
 * publish the earlier blob mid-write. `Promise.all` here would be a data-loss
 * bug, not a speed-up.
 *
 * A target that received no fields is skipped entirely — there is no reason to
 * republish a blob this import did not touch.
 *
 * Never throws for a save failure: the failure is part of the result, because
 * the caller has to be able to say WHICH targets landed.
 */
export async function runAutoImport(input: {
  doc: TechpackDocument
  productSlug: string
}): Promise<AutoImportRunResult> {
  const { drafts, ...counts } = planAutoImport({
    doc: input.doc,
    drafts: currentDrafts(input.productSlug),
  })

  const savedTargets: ImportTarget[] = []
  const deferredTargets: ImportTarget[] = []
  for (const target of AUTO_IMPORT_TARGETS) {
    if (counts.countsByTarget[target] === 0) continue
    try {
      writeTarget(target, input.productSlug, drafts)
      if ((await publishTarget(target)) === 'deferred') deferredTargets.push(target)
      else savedTargets.push(target)
    } catch (error) {
      return {
        ...counts,
        savedTargets,
        deferredTargets,
        failure: { target, message: errorMessage(error) },
      }
    }
  }

  return { ...counts, savedTargets, deferredTargets, failure: null }
}
