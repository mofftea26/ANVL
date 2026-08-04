import { describe, expect, it } from 'vitest'

import { DEFAULT_PASSPORT_PRODUCT_CONTENT } from '@/features/cms/passportContent/passportContent.zod'
import { DEFAULT_PDP_PRODUCT_CONTENT } from '@/features/cms/pdpContent/pdpContent.zod'
import {
  EMPTY_TECHPACK_DOCUMENT,
  type TechpackDocument,
} from '@/features/techpacks/schema/techpack.zod'

import {
  applyImportPlan,
  buildImportPlan,
  type ImportDrafts,
  type ImportFieldProposal,
} from '../importPlan'

/**
 * The silent-overwrite class.
 *
 * Assigning a product to a techpack imports UNATTENDED, filling every proposal
 * whose `state` is `empty`. Several CMS fields are not the only thing feeding
 * their slot on the page — the storefront resolvers prefer a structured field
 * and fall back to a legacy sibling, or to another blob — so a field can read
 * empty while authored copy is live. Each case below asserts BOTH halves of
 * the fix: the proposal is not auto-selected, AND the authored copy survives
 * the unattended run.
 */

/**
 * The unattended rule, restated rather than imported from `autoImportPlan`.
 * That module deliberately re-derives it from `state`/`blocked` instead of
 * reusing `defaultSelected`; a test that borrowed either would stop testing
 * the thing that actually decides what gets written.
 */
function autoSelection(plan: readonly ImportFieldProposal[]): Set<string> {
  return new Set(
    plan.filter((e) => e.state === 'empty' && e.blocked === null).map((e) => e.id),
  )
}

function emptyDrafts(): ImportDrafts {
  return {
    passport: structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT),
    size: { note: '', columns: [], rows: [] },
    pdp: structuredClone(DEFAULT_PDP_PRODUCT_CONTENT),
  }
}

/** A pack carrying every section these proposals read from. */
function doc(): TechpackDocument {
  return {
    ...structuredClone(EMPTY_TECHPACK_DOCUMENT),
    header: {
      product: 'MENS OVERSIZED TEE',
      contrast: 'SOLID (NONE)',
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
    pages: [{ page: 4, kind: 'sizing-guide', title: 'SIZING GUIDE' }],
    colorways: [
      {
        index: 1,
        name: 'JET',
        roles: [
          {
            role: 'MAIN',
            roleKey: 'main',
            colorName: 'JET BLACK',
            pantone: '19-4005 TCX',
            coloro: '',
            hex: '#0b0b0c',
            swatchImageId: '',
          },
        ],
      },
    ],
    sizing: {
      unit: 'in',
      sizes: ['SMALL', 'MEDIUM', 'LARGE'],
      rows: [
        {
          letter: 'B',
          label: 'CHEST 1/2 WIDTH',
          rowKey: 'chest',
          isHalf: true,
          values: [20, 22, 24],
        },
      ],
      diagramImageId: '',
      markers: [],
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
  }
}

function proposalFor(drafts: ImportDrafts, id: string) {
  const plan = buildImportPlan({ doc: doc(), drafts })
  const entry = plan.find((e) => e.id === id)
  return { plan, entry, applied: applyImportPlan(plan, autoSelection(plan), drafts) }
}

describe('a legacy size chart is not an empty size table', () => {
  it('does not overwrite the live legacy chart', () => {
    // `resolveSizeTable` renders the legacy `columns`/`rows` whenever the
    // structured `table` has no filled cell — so `table === undefined` here
    // means "the legacy chart is what customers see", not "nothing is there".
    const drafts = emptyDrafts()
    drafts.size = {
      note: '',
      columns: ['Chest', 'Length'],
      rows: [{ id: 'row-1', size: 'M', values: ['52', '72'] }],
    }

    const { entry, applied } = proposalFor(drafts, 'sizeGuide.table')

    expect(entry?.state).toBe('differs')
    expect(entry?.defaultSelected).toBe(false)
    expect(applied.size.table).toBeUndefined()
    expect(applied.size.rows).toEqual([{ id: 'row-1', size: 'M', values: ['52', '72'] }])
  })

  it('shows the legacy chart as what would be replaced', () => {
    const drafts = emptyDrafts()
    drafts.size = {
      note: '',
      columns: ['Chest'],
      rows: [{ id: 'row-1', size: 'M', values: ['52'] }],
    }
    const { entry } = proposalFor(drafts, 'sizeGuide.table')
    expect(entry?.current).toEqual(['M: 52'])
  })

  it('still fills a size table that is blank in both generations', () => {
    const drafts = emptyDrafts()
    const { entry, applied } = proposalFor(drafts, 'sizeGuide.table')

    expect(entry?.state).toBe('empty')
    expect(applied.size.table?.rows).toHaveLength(1)
  })

  it('ignores an all-blank structured table, which renders nothing either', () => {
    const drafts = emptyDrafts()
    drafts.size = {
      note: '',
      columns: [],
      rows: [],
      table: { rows: [{ key: 'chest', values: ['', '', '', '', '', ''] }], halfMeasurement: true },
    }
    const { entry } = proposalFor(drafts, 'sizeGuide.table')
    expect(entry?.state).toBe('empty')
  })
})

describe('PDP structured lists do not silently retire their legacy siblings', () => {
  it('does not overwrite the legacy material headline', () => {
    const drafts = emptyDrafts()
    drafts.pdp.materialTitle = 'Heavyweight loopback terry'
    drafts.pdp.materialNote = 'Milled in Tripoli'

    const { entry, applied } = proposalFor(drafts, 'pdp.materials')

    expect(entry?.state).toBe('differs')
    expect(entry?.current).toEqual(['Heavyweight loopback terry', 'Milled in Tripoli'])
    expect(applied.pdp.materials).toEqual([])
    expect(applied.pdp.materialTitle).toBe('Heavyweight loopback terry')
  })

  it('does not overwrite the legacy care lines', () => {
    const drafts = emptyDrafts()
    drafts.pdp.care = ['Wash cold with like colours']

    const { entry, applied } = proposalFor(drafts, 'pdp.careItems')

    expect(entry?.state).toBe('differs')
    expect(entry?.current).toEqual(['Wash cold with like colours'])
    expect(applied.pdp.careItems).toEqual([])
    expect(applied.pdp.care).toEqual(['Wash cold with like colours'])
  })

  it('still fills both when neither generation is authored', () => {
    const drafts = emptyDrafts()
    const { applied } = proposalFor(drafts, 'pdp.materials')

    expect(applied.pdp.materials).toHaveLength(1)
    expect(applied.pdp.careItems).toHaveLength(2)
  })
})

describe('passport fields backed by pdp_content', () => {
  it('does not overwrite the composition the passport inherits from the PDP', () => {
    const drafts = emptyDrafts()
    drafts.pdp.materials = [
      { id: 'm1', name: 'Combed ring-spun cotton', percentage: 100, gsm: 240, image: '' },
    ]

    const { entry, applied } = proposalFor(drafts, 'passport.material.materials')

    expect(entry?.state).toBe('differs')
    expect(entry?.current).toEqual(drafts.pdp.materials)
    expect(applied.passport.material.materials).toEqual([])
  })

  it('does not overwrite the care symbols the passport inherits from the PDP', () => {
    const drafts = emptyDrafts()
    drafts.pdp.careItems = [
      { id: 'c1', icon: 'wash-hand', name: 'Hand wash only', value: '', note: '' },
    ]

    const { entry, applied } = proposalFor(drafts, 'passport.care.careItems')

    expect(entry?.state).toBe('differs')
    expect(entry?.current).toEqual(drafts.pdp.careItems)
    expect(applied.passport.care.careItems).toEqual([])
  })

  it('does not overwrite the care steps the passport inherits from the PDP', () => {
    const drafts = emptyDrafts()
    drafts.pdp.care = ['Rinse after every session']

    const { entry, applied } = proposalFor(drafts, 'passport.care.steps')

    expect(entry?.state).toBe('differs')
    expect(applied.passport.care.steps).toEqual([])
  })

  it('does not overwrite the facts the passport inherits from the PDP', () => {
    const drafts = emptyDrafts()
    drafts.pdp.designDetails = ['Twin-needle hem']

    const { entry, applied } = proposalFor(drafts, 'passport.details.facts')

    expect(entry?.state).toBe('differs')
    expect(applied.passport.details.facts).toEqual([])
  })

  it('does not overwrite the material note the passport inherits from the PDP', () => {
    const drafts = emptyDrafts()
    drafts.pdp.materialNote = '240 GSM, milled in Tripoli'

    const { entry, applied } = proposalFor(drafts, 'passport.material.note')

    expect(entry?.state).toBe('differs')
    expect(applied.passport.material.note).toBe('')
  })

  it('still fills passport fields when the PDP blob is blank too', () => {
    const drafts = emptyDrafts()
    const { applied } = proposalFor(drafts, 'passport.material.materials')

    expect(applied.passport.material.materials).toHaveLength(1)
    expect(applied.passport.care.careItems).toHaveLength(2)
    expect(applied.passport.care.steps).toEqual(['Cool wash inside out', 'Do not tumble dry'])
    expect(applied.passport.details.facts).toEqual(['Jet Black — 19-4005 TCX'])
    expect(applied.passport.material.note).toBe('Single Jersey Weft Knit')
  })
})
