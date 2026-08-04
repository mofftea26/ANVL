import { describe, expect, it } from 'vitest'

import { DEFAULT_PASSPORT_PRODUCT_CONTENT } from '@/features/cms/passportContent/passportContent.zod'
import { DEFAULT_PDP_PRODUCT_CONTENT } from '@/features/cms/pdpContent/pdpContent.zod'
import {
  EMPTY_TECHPACK_DOCUMENT,
  type TechpackDocument,
} from '@/features/techpacks/schema/techpack.zod'

import {
  autoImportSelection,
  autoImportSkipReason,
  describeAutoImport,
  planAutoImport,
  type AutoImportRunResult,
} from '../autoImportPlan'
import { buildImportPlan, type ImportDrafts } from '../importPlan'

function emptyDrafts(): ImportDrafts {
  return {
    passport: structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT),
    size: { note: '', columns: [], rows: [] },
    pdp: structuredClone(DEFAULT_PDP_PRODUCT_CONTENT),
  }
}

/** A pack with facts in it, shaped like the real oversized-tee techpack. */
function doc(overrides: Partial<TechpackDocument> = {}): TechpackDocument {
  return {
    ...structuredClone(EMPTY_TECHPACK_DOCUMENT),
    header: {
      product: 'MENS OVERSIZED TEE',
      contrast: 'SOLID (NONE)',
      style: 'ANVL-M-SS01-FW26',
      colorwayCount: 3,
      fabric: {
        raw: '100% COTTON | 260 GSM | SINGLE JERSEY WEFT KNIT',
        composition: [{ material: 'COTTON', percentage: 100 }],
        gsm: 260,
        construction: 'SINGLE JERSEY WEFT KNIT',
      },
      client: 'ANVL ATHLETICS',
    },
    pages: [
      { page: 6, kind: 'basic-specs', title: 'BASIC SPECS' },
      { page: 13, kind: 'packaging-and-labels', title: 'PACKAGING AND LABELS' },
    ],
    technical: {
      seams: [
        { text: 'PLAIN SEAM WITH LOCKSTITCH', code: 'SSa [1.01.01]', spi: 15, supplierRef: '' },
      ],
      patternPieces: [],
      notes: [],
      scale: '1:10',
      baseSize: 'MEDIUM',
    },
    packaging: {
      careLabel: {
        textAvailable: true,
        lines: ['100% COTTON', 'COOL WASH INSIDE OUT', 'DO NOT TUMBLE DRY'],
        origin: 'Lebanon',
        visibleSize: '1.875"X1.25"',
        imageId: 'p13-i0',
      },
      sizeLabel: { visibleSize: '', placement: '', sizes: [], imageId: '' },
    },
    ...overrides,
  }
}

describe('autoImportSelection — the rule that keeps authored copy alive', () => {
  it('applies a proposal whose field is empty', () => {
    const plan = buildImportPlan({ doc: doc(), drafts: emptyDrafts() })
    const construction = plan.find((e) => e.id === 'passport.specs.construction')

    expect(construction?.state).toBe('empty')
    expect(autoImportSelection(plan).has('passport.specs.construction')).toBe(true)
  })

  it('NEVER selects a proposal that differs from what is already written', () => {
    // The regression this whole rule exists to prevent: an unattended import
    // silently replacing copy a human wrote, just because someone picked a
    // product from a dropdown.
    const drafts = emptyDrafts()
    drafts.passport.specs.construction = 'Hand-finished in the atelier'

    const plan = buildImportPlan({ doc: doc(), drafts })
    const construction = plan.find((e) => e.id === 'passport.specs.construction')
    expect(construction?.state).toBe('differs')

    expect(autoImportSelection(plan).has('passport.specs.construction')).toBe(false)

    const planned = planAutoImport({ doc: doc(), drafts })
    expect(planned.drafts.passport.specs.construction).toBe('Hand-finished in the atelier')
    expect(planned.alreadyFilledCount).toBeGreaterThan(0)
  })

  it('never selects — or applies — a blocked proposal', () => {
    const artworkOnly = doc()
    artworkOnly.packaging!.careLabel.textAvailable = false

    const drafts = emptyDrafts()
    const plan = buildImportPlan({ doc: artworkOnly, drafts })
    const steps = plan.find((e) => e.id === 'passport.care.steps')
    expect(steps?.blocked).toContain('artwork only')

    expect(autoImportSelection(plan).has('passport.care.steps')).toBe(false)

    const planned = planAutoImport({ doc: artworkOnly, drafts })
    expect(planned.drafts.passport.care.steps).toEqual([])
    expect(planned.blockedCount).toBeGreaterThan(0)
  })

  it('leaves the drafts it was given untouched', () => {
    const drafts = emptyDrafts()
    planAutoImport({ doc: doc(), drafts })
    expect(drafts.passport.specs.construction).toBe('')
    expect(drafts.passport.material.materials).toEqual([])
  })

  it('counts what it selected per target', () => {
    const planned = planAutoImport({ doc: doc(), drafts: emptyDrafts() })

    expect(planned.totalFields).toBeGreaterThan(0)
    expect(planned.countsByTarget.passport).toBeGreaterThan(0)
    expect(planned.countsByTarget.pdp).toBeGreaterThan(0)
    // No `sizing` block on this pack, so the size guide is offered nothing.
    expect(planned.countsByTarget.sizeGuide).toBe(0)
    expect(
      planned.countsByTarget.passport +
        planned.countsByTarget.sizeGuide +
        planned.countsByTarget.pdp,
    ).toBe(planned.totalFields)
  })

  it('finds nothing to do in an empty document', () => {
    const planned = planAutoImport({
      doc: structuredClone(EMPTY_TECHPACK_DOCUMENT),
      drafts: emptyDrafts(),
    })
    expect(planned.proposalCount).toBe(0)
    expect(planned.totalFields).toBe(0)
  })
})

describe('autoImportSkipReason — when the assignment must not import', () => {
  it('refuses when the slug was cleared', () => {
    expect(
      autoImportSkipReason({ previousSlug: 'oath-tee', nextSlug: '', status: 'parsed' }),
    ).toBe('no-product')
    expect(
      autoImportSkipReason({ previousSlug: 'oath-tee', nextSlug: '   ', status: 'parsed' }),
    ).toBe('no-product')
  })

  it('refuses when the slug did not actually change', () => {
    expect(
      autoImportSkipReason({ previousSlug: 'oath-tee', nextSlug: 'oath-tee', status: 'parsed' }),
    ).toBe('unchanged')
  })

  it('refuses on a pack that has not been parsed', () => {
    expect(
      autoImportSkipReason({ previousSlug: '', nextSlug: 'oath-tee', status: 'draft' }),
    ).toBe('not-parsed')
    expect(
      autoImportSkipReason({ previousSlug: '', nextSlug: 'oath-tee', status: 'failed' }),
    ).toBe('not-parsed')
  })

  it('allows a real new assignment on a parsed pack', () => {
    for (const status of ['parsed', 'reviewed', 'imported'] as const) {
      expect(autoImportSkipReason({ previousSlug: '', nextSlug: 'oath-tee', status })).toBeNull()
    }
    expect(
      autoImportSkipReason({ previousSlug: 'old-tee', nextSlug: 'oath-tee', status: 'parsed' }),
    ).toBeNull()
  })
})

describe('describeAutoImport — reporting precisely', () => {
  const base: AutoImportRunResult = {
    proposalCount: 14,
    blockedCount: 0,
    alreadyFilledCount: 0,
    totalFields: 14,
    countsByTarget: { passport: 8, sizeGuide: 4, pdp: 2 },
    savedTargets: ['passport', 'sizeGuide', 'pdp'],
    deferredTargets: [],
    failure: null,
  }

  it('breaks the total down per target', () => {
    expect(describeAutoImport(base)).toEqual({
      tone: 'success',
      message: 'Imported 14 fields — passport 8 · size guide 4 · PDP 2',
    })
  })

  it('omits targets that received nothing', () => {
    expect(
      describeAutoImport({
        ...base,
        totalFields: 1,
        countsByTarget: { passport: 1, sizeGuide: 0, pdp: 0 },
        savedTargets: ['passport'],
      }).message,
    ).toBe('Imported 1 field — passport 1')
  })

  it('distinguishes an unreadable pack from an already-filled product', () => {
    expect(
      describeAutoImport({
        ...base,
        proposalCount: 0,
        totalFields: 0,
        countsByTarget: { passport: 0, sizeGuide: 0, pdp: 0 },
        savedTargets: [],
      }).message,
    ).toContain('nothing could be read')

    expect(
      describeAutoImport({
        ...base,
        alreadyFilledCount: 14,
        totalFields: 0,
        countsByTarget: { passport: 0, sizeGuide: 0, pdp: 0 },
        savedTargets: [],
      }).message,
    ).toContain('already filled in')

    expect(
      describeAutoImport({
        ...base,
        blockedCount: 14,
        alreadyFilledCount: 0,
        totalFields: 0,
        countsByTarget: { passport: 0, sizeGuide: 0, pdp: 0 },
        savedTargets: [],
      }).message,
    ).toContain('blocked')
  })

  it('names what landed when a save fails mid-sequence', () => {
    const result = describeAutoImport({
      ...base,
      savedTargets: ['passport', 'sizeGuide'],
      failure: { target: 'pdp', message: 'Supabase said no.' },
    })
    expect(result.tone).toBe('error')
    expect(result.message).toBe(
      'Imported passport 8 · size guide 4, then saving the PDP failed: Supabase said no.',
    )
  })

  it('does not claim a partial import when the first save failed', () => {
    const result = describeAutoImport({
      ...base,
      savedTargets: [],
      failure: { target: 'passport', message: 'Supabase said no.' },
    })
    expect(result.message).toBe(
      'Nothing was imported — saving the passport failed: Supabase said no.',
    )
  })

  /* ---------------------------- defect E ------------------------------ */

  it('still mentions blocked fields when the rest of the import succeeded', () => {
    // `blockedCount` was computed, carried on the result, and then only ever
    // spoken about in the nothing-was-imported branch. The commonest block is
    // one the operator can clear, so staying silent about it whenever anything
    // else landed is how a half-imported pack looks complete.
    const result = describeAutoImport({ ...base, proposalCount: 16, blockedCount: 2 })

    expect(result.tone).toBe('success')
    expect(result.message).toContain('Imported 14 fields')
    expect(result.message).toContain('2')
    expect(result.message).toMatch(/blocked|could not be imported/i)
  })

  it('says one field, not one fields, when a single proposal was blocked', () => {
    expect(describeAutoImport({ ...base, blockedCount: 1 }).message).not.toContain('1 fields')
  })

  /* ---------------------------- defect D ------------------------------ */

  it('never calls a deferred publish a successful one', () => {
    // The hydration lock makes `flushAdminCmsRemoteSync` return `skipped`, and
    // `afterLocalCmsMutation` maps every skip to ok — so nothing throws and the
    // old message announced a publish that never left the browser.
    const result = describeAutoImport({
      ...base,
      savedTargets: [],
      deferredTargets: ['passport', 'sizeGuide', 'pdp'],
    })

    expect(result.tone).not.toBe('success')
    expect(result.message).toContain('not published')
  })

  it('names only the targets that were actually held back', () => {
    const result = describeAutoImport({
      ...base,
      savedTargets: ['passport'],
      deferredTargets: ['sizeGuide', 'pdp'],
    })

    expect(result.tone).toBe('warning')
    expect(result.message).toContain('size guide')
    expect(result.message).toContain('PDP')
    expect(result.message).toContain('not published')
  })

  it('admits a deferral that happened before a later save failed', () => {
    const result = describeAutoImport({
      ...base,
      savedTargets: [],
      deferredTargets: ['passport'],
      failure: { target: 'sizeGuide', message: 'Supabase said no.' },
    })

    expect(result.tone).toBe('error')
    expect(result.message).toContain('not published')
  })
})
