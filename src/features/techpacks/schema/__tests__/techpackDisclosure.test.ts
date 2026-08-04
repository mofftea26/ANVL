import { describe, expect, it } from 'vitest'

import {
  EMPTY_TECHPACK_DOCUMENT,
  countTechpackIssues,
  parseTechpackDocument,
  type TechpackDocument,
} from '../techpack.zod'
import {
  INTERNAL_ONLY_PATHS,
  isInternalPath,
  redactTechpackDocument,
} from '../techpackDisclosure'

function docWithInternals(): TechpackDocument {
  return {
    ...structuredClone(EMPTY_TECHPACK_DOCUMENT),
    meta: {
      sourceFilename: 'SupplierName_Pack.pdf',
      pageCount: 13,
      parserVersion: '1',
      parsedAt: '2026-07-29T00:00:00.000Z',
    },
    technical: {
      seams: [
        {
          text: 'PLAIN SEAM W/ 15SPI S/N 301 LOCKSTITCH',
          code: 'SSa [1.01.01]',
          spi: 15,
          supplierRef: 'SEE DETAIL K',
        },
      ],
      patternPieces: [{ label: 'CHEST', value: 22.5, unit: 'in' }],
      notes: ['internal note'],
      scale: '1:10',
      baseSize: 'MEDIUM',
    },
    blueprint: [
      {
        page: 6,
        view: '',
        features: [
          {
            code: 'j',
            label: 'HEM WRAPPED BRAND LABEL',
            detail: 'woven branding application',
            supplierRef: 'SEE TRIM A',
            positions: [
              { x: 40, y: 60 },
              { x: 62, y: 60 },
            ],
          },
        ],
      },
    ],
    trims: [
      {
        code: 'TRIM A',
        name: 'Damask jacquard label',
        description: 'centre folded',
        visibleSize: '1.00"X1.00"',
        supplierCode: 'SUP-9931',
        vendor: 'Acme Trims Ltd',
        imageId: 'img-2',
      },
    ],
    branding: [
      {
        code: 'INDEX A',
        description: '3.00" wide logo on upper centre chest',
        dimensions: ['2.50" below front neckline'],
        imageId: 'img-3',
      },
    ],
  }
}

describe('isInternalPath', () => {
  it('matches declared paths', () => {
    expect(isInternalPath('meta.sourceFilename')).toBe(true)
    expect(isInternalPath('technical.patternPieces')).toBe(true)
    expect(isInternalPath('technical.notes')).toBe(true)
  })

  it('normalizes array indices to the wildcard segment', () => {
    expect(isInternalPath('blueprint.0.features.3.supplierRef')).toBe(true)
    expect(isInternalPath('trims.11.vendor')).toBe(true)
    expect(isInternalPath('branding.2.dimensions')).toBe(true)
    expect(isInternalPath('technical.seams.0.supplierRef')).toBe(true)
  })

  it('leaves disclosable paths alone', () => {
    // The whole point of the field-level split: stitch detail is disclosable
    // even though it sits on the same page as the pattern dimensions.
    expect(isInternalPath('technical.seams.0.text')).toBe(false)
    expect(isInternalPath('technical.seams.0.spi')).toBe(false)
    expect(isInternalPath('technical.seams.0.code')).toBe(false)
    expect(isInternalPath('blueprint.0.features.0.label')).toBe(false)
    expect(isInternalPath('blueprint.0.features.0.positions')).toBe(false)
    expect(isInternalPath('colorways.0.roles.0.pantone')).toBe(false)
    expect(isInternalPath('sizing.rows.0.values')).toBe(false)
  })

  it('does not match a prefix or a longer path', () => {
    expect(isInternalPath('meta')).toBe(false)
    expect(isInternalPath('meta.sourceFilename.extra')).toBe(false)
  })

  it('has no unreachable entries in the policy list', () => {
    for (const pattern of INTERNAL_ONLY_PATHS) {
      expect(isInternalPath(pattern)).toBe(true)
    }
  })
})

describe('redactTechpackDocument', () => {
  const redacted = redactTechpackDocument(docWithInternals())

  it('empties every internal field', () => {
    expect(redacted.meta.sourceFilename).toBe('')
    expect(redacted.technical?.patternPieces).toEqual([])
    expect(redacted.technical?.notes).toEqual([])
    expect(redacted.technical?.seams[0]?.supplierRef).toBe('')
    expect(redacted.blueprint[0]?.features[0]?.supplierRef).toBe('')
    expect(redacted.trims[0]?.supplierCode).toBe('')
    expect(redacted.trims[0]?.vendor).toBe('')
    expect(redacted.branding[0]?.dimensions).toEqual([])
  })

  it('keeps every disclosable field intact', () => {
    expect(redacted.technical?.seams[0]?.text).toBe(
      'PLAIN SEAM W/ 15SPI S/N 301 LOCKSTITCH',
    )
    expect(redacted.technical?.seams[0]?.spi).toBe(15)
    expect(redacted.technical?.seams[0]?.code).toBe('SSa [1.01.01]')
    expect(redacted.technical?.baseSize).toBe('MEDIUM')
    expect(redacted.blueprint[0]?.features[0]?.label).toBe('HEM WRAPPED BRAND LABEL')
    expect(redacted.blueprint[0]?.features[0]?.positions).toHaveLength(2)
    expect(redacted.trims[0]?.visibleSize).toBe('1.00"X1.00"')
    expect(redacted.branding[0]?.description).toBe(
      '3.00" wide logo on upper centre chest',
    )
  })

  it('preserves the shape, so the result still parses as a document', () => {
    const reparsed = parseTechpackDocument(redacted)
    expect(reparsed.blueprint[0]?.features[0]?.positions).toHaveLength(2)
    expect(reparsed.technical?.seams).toHaveLength(1)
  })

  it('does not mutate the input', () => {
    const original = docWithInternals()
    redactTechpackDocument(original)
    expect(original.meta.sourceFilename).toBe('SupplierName_Pack.pdf')
    expect(original.trims[0]?.vendor).toBe('Acme Trims Ltd')
  })
})

describe('parseTechpackDocument', () => {
  it('returns an empty document for junk input', () => {
    expect(parseTechpackDocument(null)).toEqual(EMPTY_TECHPACK_DOCUMENT)
    expect(parseTechpackDocument('nope')).toEqual(EMPTY_TECHPACK_DOCUMENT)
    expect(parseTechpackDocument([])).toEqual(EMPTY_TECHPACK_DOCUMENT)
  })

  it('keeps absent sections empty rather than missing', () => {
    const parsed = parseTechpackDocument({ schemaVersion: 1 })
    expect(parsed.trims).toEqual([])
    expect(parsed.knits).toEqual([])
    expect(parsed.sizing).toBeNull()
    expect(parsed.packaging).toBeNull()
  })

  it('round-trips a populated document', () => {
    const doc = docWithInternals()
    expect(parseTechpackDocument(doc)).toEqual(doc)
  })
})

describe('countTechpackIssues', () => {
  const doc: TechpackDocument = {
    ...structuredClone(EMPTY_TECHPACK_DOCUMENT),
    issues: [
      { page: 1, path: 'a', severity: 'info', code: 'i', message: '' },
      { page: 2, path: 'b', severity: 'warn', code: 'w', message: '' },
      { page: 3, path: 'c', severity: 'error', code: 'e', message: '' },
    ],
  }

  it('counts at or above the given severity', () => {
    expect(countTechpackIssues(doc, 'info')).toBe(3)
    expect(countTechpackIssues(doc, 'warn')).toBe(2)
    expect(countTechpackIssues(doc, 'error')).toBe(1)
  })

  it('defaults to warn and above', () => {
    expect(countTechpackIssues(doc)).toBe(2)
  })
})
