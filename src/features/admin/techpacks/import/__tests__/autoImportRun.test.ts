import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  EMPTY_TECHPACK_DOCUMENT,
  type TechpackDocument,
  type TechpackSizing,
} from '@/features/techpacks/schema/techpack.zod'

// `vi.mock` is hoisted above every import, so the module under test resolves
// its CMS settings imports against the stubs below.
import { publishAutoImportTargets, runAutoImport } from '../autoImportRun'

/**
 * The three CMS settings modules are mocked so the run can be observed without
 * a Supabase write-through. What is under test is the ORDER, the SKIPPING and
 * whether a publish actually reached the server — not the blob schemas, which
 * have their own tests.
 *
 * A save is two steps: a synchronous localStorage write, then the publish. The
 * mocks record `start` for the first and `end` for the second, so the recorded
 * sequence still shows one target closing before the next opens.
 */
const h = vi.hoisted(() => ({
  calls: [] as string[],
  passport: {} as Record<string, unknown>,
  support: { sizeGuide: { perProduct: {} as Record<string, unknown> } },
  pdp: {} as Record<string, unknown>,
  /** Whether this browser holds a hydrated `pdp_content` snapshot. */
  pdpHydrated: true,
  failOn: null as string | null,
  /** What every publish reports back, unless `failOn` fires first. */
  flush: { status: 'ok', rows: 2 } as
    | { status: 'ok'; rows: number }
    | { status: 'skipped'; reason: 'test' | 'ssr' | 'no-env' | 'hydration-lock' },
}))

/** `cms_settings` column -> the import target that owns it. */
const FIELD_TARGETS: Record<string, string> = {
  passport_content: 'passport',
  support_content: 'sizeGuide',
  pdp_content: 'pdp',
}

vi.mock('@/features/admin/cmsRemote/cmsWriteThrough', () => ({
  flushAdminCmsWriteThrough: async (fields?: string[]) => {
    const name = FIELD_TARGETS[fields?.[0] ?? ''] ?? 'unknown'
    // Yield across a couple of macrotasks so an un-awaited publish would
    // visibly interleave with the next target's.
    await new Promise((resolve) => setTimeout(resolve, 0))
    if (h.failOn === name) {
      h.calls.push(`${name}:fail`)
      return { status: 'error', reason: 'write-failed', message: `${name} write refused` }
    }
    h.calls.push(`${name}:end`)
    return h.flush
  },
}))

vi.mock('@/features/cms/passportContent/passportContent.settings', () => ({
  readPassportContentFromStorage: () => h.passport,
  writePassportContentToStorage: (next: Record<string, unknown>) => {
    h.calls.push('passport:start')
    h.passport = next
  },
}))

vi.mock('@/features/cms/support/supportContent.settings', () => ({
  readSupportContentFromStorage: () => h.support,
  writeSupportContentToStorage: (next: {
    sizeGuide: { perProduct: Record<string, unknown> }
  }) => {
    h.calls.push('sizeGuide:start')
    h.support = next
  },
}))

vi.mock('@/features/cms/pdpContent/pdpContent.settings', () => ({
  readPdpContentFromStorage: () => h.pdp,
  writePdpContentToStorage: (next: Record<string, unknown>) => {
    h.calls.push('pdp:start')
    h.pdp = next
  },
  // The real one throws when this browser never hydrated `pdp_content`.
  assertPdpContentHydrated: () => {
    if (!h.pdpHydrated) throw new Error('Product content has not loaded from Supabase')
  },
}))

const SIZING: TechpackSizing = {
  unit: 'in',
  sizes: ['SMALL', 'MEDIUM', 'LARGE'],
  rows: [
    { letter: 'A', label: 'CB LENGTH', rowKey: 'length', isHalf: false, values: [26, 27, 28] },
    {
      letter: 'B',
      label: 'CHEST 1/2 WIDTH',
      rowKey: 'chest',
      isHalf: true,
      values: [22.75, 24, 25.25],
    },
  ],
  diagramImageId: 'p4-i0',
  markers: [],
}

/** A pack with something for all three targets. */
function fullDoc(): TechpackDocument {
  return {
    ...structuredClone(EMPTY_TECHPACK_DOCUMENT),
    header: {
      product: 'MENS OVERSIZED TEE',
      contrast: '',
      style: 'ANVL-M-SS01-FW26',
      colorwayCount: 1,
      fabric: {
        raw: '100% COTTON | 260 GSM | SINGLE JERSEY WEFT KNIT',
        composition: [{ material: 'COTTON', percentage: 100 }],
        gsm: 260,
        construction: 'SINGLE JERSEY WEFT KNIT',
      },
      client: 'ANVL ATHLETICS',
    },
    pages: [
      { page: 4, kind: 'sizing-guide', title: 'SIZING GUIDE' },
      { page: 13, kind: 'packaging-and-labels', title: 'PACKAGING AND LABELS' },
    ],
    sizing: SIZING,
    packaging: {
      careLabel: {
        textAvailable: true,
        lines: ['100% COTTON', 'COOL WASH INSIDE OUT'],
        origin: 'Lebanon',
        visibleSize: '',
        imageId: '',
      },
      sizeLabel: { visibleSize: '', placement: '', sizes: [], imageId: '' },
    },
  }
}

beforeEach(() => {
  h.calls = []
  h.passport = {}
  h.support = { sizeGuide: { perProduct: {} } }
  h.pdp = {}
  h.pdpHydrated = true
  h.failOn = null
  h.flush = { status: 'ok', rows: 2 }
})

describe('runAutoImport', () => {
  it('saves the targets one at a time, never concurrently', async () => {
    // Concurrent flushes each read the FULL local snapshot, so an interleaved
    // pair can publish a half-written blob. Every save must close before the
    // next opens.
    const result = await runAutoImport({ doc: fullDoc(), productSlug: 'oath-tee' })

    expect(result.failure).toBeNull()
    expect(h.calls).toEqual([
      'passport:start',
      'passport:end',
      'sizeGuide:start',
      'sizeGuide:end',
      'pdp:start',
      'pdp:end',
    ])
    expect(result.savedTargets).toEqual(['passport', 'sizeGuide', 'pdp'])
  })

  it('writes the imported facts under the product slug', async () => {
    await runAutoImport({ doc: fullDoc(), productSlug: 'oath-tee' })

    const passport = h.passport['oath-tee'] as { material: { materials: unknown[] } }
    expect(passport.material.materials).toHaveLength(1)
    expect(h.support.sizeGuide.perProduct['oath-tee']).toBeDefined()
    expect(h.pdp['oath-tee']).toBeDefined()
  })

  it('skips a target that received no fields', async () => {
    // No sizing block on this pack — republishing the support blob would be a
    // write for nothing.
    const noSizing = fullDoc()
    noSizing.sizing = null

    const result = await runAutoImport({ doc: noSizing, productSlug: 'oath-tee' })

    expect(result.countsByTarget.sizeGuide).toBe(0)
    expect(h.calls.some((call) => call.startsWith('sizeGuide'))).toBe(false)
    expect(result.savedTargets).toEqual(['passport', 'pdp'])
  })

  it('stops at the first failure and reports what already landed', async () => {
    h.failOn = 'sizeGuide'

    const result = await runAutoImport({ doc: fullDoc(), productSlug: 'oath-tee' })

    expect(result.savedTargets).toEqual(['passport'])
    expect(result.failure).toEqual({ target: 'sizeGuide', message: 'sizeGuide write refused' })
    // The PDP save was never attempted — no half-truth about atomicity.
    expect(h.calls.some((call) => call.startsWith('pdp'))).toBe(false)
  })

  it('writes nothing when the product already has content', async () => {
    // Run once to fill the blanks, then again: the second run must find every
    // field taken and leave all three blobs alone.
    await runAutoImport({ doc: fullDoc(), productSlug: 'oath-tee' })
    h.calls = []

    const second = await runAutoImport({ doc: fullDoc(), productSlug: 'oath-tee' })

    expect(second.totalFields).toBe(0)
    expect(second.savedTargets).toEqual([])
    expect(h.calls).toEqual([])
  })

  it('writes nothing for a pack with no readable facts', async () => {
    const result = await runAutoImport({
      doc: structuredClone(EMPTY_TECHPACK_DOCUMENT),
      productSlug: 'oath-tee',
    })

    expect(result.proposalCount).toBe(0)
    expect(result.totalFields).toBe(0)
    expect(h.calls).toEqual([])
  })
})

/* ------------------------------- defect D -------------------------------- */

describe('runAutoImport — a publish the hydration lock swallowed', () => {
  it('reports a hydration-locked target as deferred, not saved', async () => {
    // `flushAdminCmsRemoteSync` returns `skipped` while a Supabase pull holds
    // the hydration lock, and `afterLocalCmsMutation` turns every skip into
    // `{ ok: true }` — so nothing throws, localStorage holds the import, and
    // the server has none of it.
    h.flush = { status: 'skipped', reason: 'hydration-lock' }

    const result = await runAutoImport({ doc: fullDoc(), productSlug: 'oath-tee' })

    expect(result.failure).toBeNull()
    expect(result.savedTargets).toEqual([])
    expect(result.deferredTargets).toEqual(['passport', 'sizeGuide', 'pdp'])
    // The local merge still happened — that is exactly why a retry can publish
    // it without re-planning.
    expect(h.passport['oath-tee']).toBeDefined()
  })

  it('does not treat the environments that never publish as deferrals', async () => {
    // Tests, SSR and a Supabase-less dev box are expected no-ops for EVERY CMS
    // save in the app. Only the hydration lock means "this should have been
    // published and was not".
    for (const reason of ['test', 'ssr', 'no-env'] as const) {
      h.calls = []
      h.passport = {}
      h.support = { sizeGuide: { perProduct: {} } }
      h.pdp = {}
      h.flush = { status: 'skipped', reason }

      const result = await runAutoImport({ doc: fullDoc(), productSlug: 'oath-tee' })
      expect(result.deferredTargets).toEqual([])
      expect(result.savedTargets).toEqual(['passport', 'sizeGuide', 'pdp'])
    }
  })

  it('republishes a deferred target without re-planning the import', async () => {
    // The retry cannot go back through `runAutoImport`: localStorage already
    // holds the merged content, so a re-plan would find every field filled and
    // publish nothing at all.
    h.flush = { status: 'skipped', reason: 'hydration-lock' }
    const first = await runAutoImport({ doc: fullDoc(), productSlug: 'oath-tee' })
    h.calls = []
    h.flush = { status: 'ok', rows: 2 }

    const retry = await publishAutoImportTargets(first.deferredTargets)

    expect(retry.failure).toBeNull()
    expect(retry.deferred).toEqual([])
    expect(retry.published).toEqual(['passport', 'sizeGuide', 'pdp'])
    // Publishes only — the blobs were already merged on the first run.
    expect(h.calls).toEqual(['passport:end', 'sizeGuide:end', 'pdp:end'])
  })

  /**
   * The seam between two independently-correct fixes.
   *
   * `pdp_content` is a whole-map blob, so publishing an un-hydrated snapshot
   * erases every other product. The editors are guarded inside
   * `savePdpContentAsync` — but this module deliberately does NOT call it (it
   * writes and flushes separately so a hydration-locked publish can be
   * reported as deferred instead of swallowed), so it would walk straight past
   * that guard. The flush's own copy cannot catch it either: it probes for the
   * localStorage key, and the write would already have created it.
   *
   * If this test ever passes without `assertPdpContentHydrated` in
   * `writeTarget`, assigning a product on a fresh admin browser wipes the
   * published PDP content of every other product.
   */
  it('refuses to write pdp_content when this browser never hydrated it', async () => {
    h.pdpHydrated = false

    const result = await runAutoImport({ doc: fullDoc(), productSlug: 'oath-tee' })

    expect(result.failure?.target).toBe('pdp')
    // Never written locally, so there is nothing for a retry to publish either.
    expect(h.calls).not.toContain('pdp:start')
    expect(h.calls).not.toContain('pdp:end')
    expect(h.pdp).toEqual({})
    // The targets that ran before it still landed, and are reported honestly.
    expect(result.savedTargets).toEqual(['passport', 'sizeGuide'])
  })
})
