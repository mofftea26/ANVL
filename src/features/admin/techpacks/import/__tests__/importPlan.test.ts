import { describe, expect, it } from 'vitest'

import { DEFAULT_PASSPORT_PRODUCT_CONTENT } from '@/features/cms/passportContent/passportContent.zod'
import { DEFAULT_PDP_PRODUCT_CONTENT } from '@/features/cms/pdpContent/pdpContent.zod'
import {
  EMPTY_TECHPACK_DOCUMENT,
  type TechpackDocument,
} from '@/features/techpacks/schema/techpack.zod'

import {
  affectedTargets,
  applyImportPlan,
  buildImportPlan,
  defaultSelection,
  type ImportDrafts,
} from '../importPlan'

function emptyDrafts(): ImportDrafts {
  return {
    passport: structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT),
    size: { note: '', columns: [], rows: [] },
    pdp: structuredClone(DEFAULT_PDP_PRODUCT_CONTENT),
  }
}

/** A document shaped like the real oversized-tee pack. */
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
      { page: 4, kind: 'sizing-guide', title: 'SIZING GUIDE' },
      { page: 6, kind: 'basic-specs', title: 'BASIC SPECS' },
      { page: 13, kind: 'packaging-and-labels', title: 'PACKAGING AND LABELS' },
    ],
    technical: {
      seams: [
        { text: 'PLAIN SEAM WITH LOCKSTITCH', code: 'SSa [1.01.01]', spi: 15, supplierRef: '' },
      ],
      patternPieces: [{ label: '', value: 24, unit: 'in' }],
      notes: [],
      scale: '1:10',
      baseSize: 'MEDIUM',
    },
    blueprint: [
      {
        page: 6,
        view: '',
        features: [
          {
            code: 'a',
            label: 'HIGH NECK FRONT NECKLINE STYLE',
            detail: '',
            supplierRef: 'SEE DETAIL A',
            positions: [{ x: 40, y: 20 }],
          },
          {
            code: 'f',
            label: 'GARMENT STYLE AND FIT',
            detail: '',
            supplierRef: '',
            positions: [
              { x: 20, y: 30 },
              { x: 70, y: 30 },
            ],
          },
        ],
      },
    ],
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

describe('buildImportPlan — the non-destructive rule', () => {
  it('pre-selects only fields that are currently empty', () => {
    const plan = buildImportPlan({ doc: doc(), drafts: emptyDrafts() })
    expect(plan.length).toBeGreaterThan(0)
    for (const entry of plan) {
      expect(entry.state).not.toBe('differs')
      expect(entry.defaultSelected).toBe(!entry.blocked)
    }
  })

  it('never pre-selects a field that would overwrite authored copy', () => {
    // The failure that makes people stop trusting an import tool: it silently
    // replaces the voice someone already wrote.
    const drafts = emptyDrafts()
    drafts.passport.specs.construction = 'Hand-finished in the atelier'

    const plan = buildImportPlan({ doc: doc(), drafts })
    const construction = plan.find((e) => e.id === 'passport.specs.construction')

    expect(construction?.state).toBe('differs')
    expect(construction?.defaultSelected).toBe(false)
    expect(construction?.current).toBe('Hand-finished in the atelier')
  })

  it('marks an unchanged value as same and leaves it unticked', () => {
    const drafts = emptyDrafts()
    const first = buildImportPlan({ doc: doc(), drafts })
    const applied = applyImportPlan(first, defaultSelection(first), drafts)

    // Re-importing the same pack should be a no-op.
    const second = buildImportPlan({ doc: doc(), drafts: applied })
    const changed = second.filter((e) => e.state !== 'same' && !e.blocked)
    expect(changed).toEqual([])
    expect(defaultSelection(second).size).toBe(0)
  })
})

describe('applyImportPlan', () => {
  it('writes only the selected fields', () => {
    const drafts = emptyDrafts()
    const plan = buildImportPlan({ doc: doc(), drafts })
    const onlyMaterials = new Set(['passport.material.materials'])

    const result = applyImportPlan(plan, onlyMaterials, drafts)
    expect(result.passport.material.materials).toHaveLength(1)
    expect(result.passport.specs.construction).toBe('')
    expect(result.passport.care.steps).toEqual([])
  })

  it('refuses a blocked field even when its id is selected', () => {
    // The block is a policy, not a UI hint — selecting it must not bypass it.
    const drafts = emptyDrafts()
    const artworkOnly = doc()
    artworkOnly.packaging!.careLabel.textAvailable = false
    const plan = buildImportPlan({ doc: artworkOnly, drafts })
    const steps = plan.find((e) => e.id === 'passport.care.steps')
    expect(steps?.blocked).toContain('artwork only')

    const result = applyImportPlan(plan, new Set([steps!.id]), drafts)
    expect(result.passport.care.steps).toEqual([])
  })

  it('replaces list fields rather than appending to them', () => {
    // Appending is the classic import-tool duplicate bug.
    const drafts = emptyDrafts()
    drafts.passport.care.steps = ['Old step']
    const plan = buildImportPlan({ doc: doc(), drafts })
    const steps = plan.find((e) => e.id === 'passport.care.steps')

    const result = applyImportPlan(plan, new Set([steps!.id]), drafts)
    expect(result.passport.care.steps).toEqual([
      'Cool wash inside out',
      'Do not tumble dry',
    ])
  })

  it('does not mutate the drafts it was given', () => {
    const drafts = emptyDrafts()
    const plan = buildImportPlan({ doc: doc(), drafts })
    applyImportPlan(plan, defaultSelection(plan), drafts)
    expect(drafts.passport.material.materials).toEqual([])
    expect(drafts.passport.care.steps).toEqual([])
  })
})

describe('buildImportPlan — what it maps', () => {
  const drafts = emptyDrafts()
  const plan = buildImportPlan({ doc: doc(), drafts })
  const applied = applyImportPlan(plan, defaultSelection(plan), drafts)

  it('puts GSM on the first composition card only', () => {
    // Repeating it per fibre renders "260 GSM" three times and reads as 780.
    const multi = doc({
      header: {
        ...doc().header,
        fabric: {
          raw: '',
          composition: [
            { material: 'NYLON', percentage: 73 },
            { material: 'POLYESTER', percentage: 21 },
            { material: 'SPANDEX', percentage: 6 },
          ],
          gsm: 330,
          construction: 'SINGLE JERSEY',
        },
      },
    })
    const fresh = emptyDrafts()
    const multiPlan = buildImportPlan({ doc: multi, drafts: fresh })
    const result = applyImportPlan(multiPlan, defaultSelection(multiPlan), fresh)

    expect(result.passport.material.materials.map((m) => m.gsm)).toEqual([330, null, null])
    expect(result.passport.material.materials.map((m) => m.name)).toEqual([
      'Nylon',
      'Polyester',
      'Spandex',
    ])
  })

  it('carries the blueprint callouts across as text cards', () => {
    const features = applied.passport.blueprint.features
    expect(features).toEqual([
      { code: 'a', title: 'High Neck Front Neckline Style', body: '' },
      { code: 'f', title: 'Garment Style And Fit', body: '' },
    ])
  })

  it('drops the parsed marker positions — the passport has no drawing to pin', () => {
    const serialized = JSON.stringify(applied.passport.blueprint.features)
    expect(serialized).not.toContain('"x"')
    expect(serialized).not.toContain('positions')
  })

  it('drops the supplier cross-reference from blueprint callouts', () => {
    const serialized = JSON.stringify(applied.passport.blueprint.features)
    expect(serialized).not.toContain('SEE DETAIL A')
  })

  it('excludes the composition line from care steps', () => {
    expect(applied.passport.care.steps).not.toContain('100% Cotton')
    expect(applied.pdp.careItems.map((c) => c.icon)).toEqual([
      'wash-inside-out',
      'do-not-tumble-dry',
    ])
  })

  it('maps the origin label', () => {
    expect(applied.passport.origin.label).toBe('Designed in Lebanon')
  })

  it('reports which targets a selection touches', () => {
    expect(affectedTargets(plan, defaultSelection(plan)).sort()).toEqual([
      'passport',
      'pdp',
    ])
  })
})

describe('buildImportPlan — refusing to publish what it should not', () => {
  it('blocks care steps when the label is artwork only', () => {
    // The seamless pack heat-transfers its label, so there is no wording to
    // import. Blocking beats publishing an empty care section.
    const imageOnly = doc({
      packaging: {
        careLabel: {
          textAvailable: false,
          lines: [],
          origin: '',
          visibleSize: '2.00"X2.00"',
          imageId: 'p12-i0',
        },
        sizeLabel: { visibleSize: '', placement: '', sizes: [], imageId: '' },
      },
    })
    const plan = buildImportPlan({ doc: imageOnly, drafts: emptyDrafts() })
    const steps = plan.find((e) => e.id === 'passport.care.steps')
    // Shown, not hidden: the operator needs to know WHY the care section is
    // empty and what to do about it.
    expect(steps?.blocked).toContain('artwork only')
    expect(steps?.defaultSelected).toBe(false)
  })

  it('never offers an internal-only field', () => {
    const plan = buildImportPlan({ doc: doc(), drafts: emptyDrafts() })
    const serialized = JSON.stringify(plan.map((e) => e.next))
    expect(serialized).not.toContain('patternPieces')
    expect(plan.some((e) => e.path.includes('patternPieces'))).toBe(false)
  })

  it('refuses a value that still carries supplier text', () => {
    const tainted = doc({
      technical: {
        seams: [
          { text: 'FITTDESIGN PROPRIETARY SEAM', code: '', spi: null, supplierRef: '' },
        ],
        patternPieces: [],
        notes: [],
        scale: '',
        baseSize: '',
      },
    })
    const plan = buildImportPlan({ doc: tainted, drafts: emptyDrafts() })
    const construction = plan.find((e) => e.id === 'passport.specs.construction')
    expect(construction?.blocked).toContain('supplier text')
    expect(construction?.defaultSelected).toBe(false)
  })
})
