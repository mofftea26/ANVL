import { describe, expect, it } from 'vitest'

import { DEFAULT_PASSPORT_PRODUCT_CONTENT } from '@/features/cms/passportContent/passportContent.zod'
import { DEFAULT_PDP_PRODUCT_CONTENT } from '@/features/cms/pdpContent/pdpContent.zod'

import {
  buildProposal,
  internalSourceReason,
  type ImportDrafts,
  type ProposalInput,
} from '../importProposal'

function drafts(): ImportDrafts {
  return {
    passport: structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT),
    size: { note: '', columns: [], rows: [] },
    pdp: structuredClone(DEFAULT_PDP_PRODUCT_CONTENT),
  }
}

function input(overrides: Partial<ProposalInput> = {}): ProposalInput {
  return {
    id: 'passport.specs.construction',
    target: 'passport',
    path: 'specs.construction',
    label: 'Construction',
    sourcePaths: ['technical.seams.*.text'],
    next: 'Plain Seam With Lockstitch',
    current: '',
    apply: (d) => d,
    ...overrides,
  }
}

describe('the disclosure gate', () => {
  it('blocks a proposal that reads an internal-only techpack field', () => {
    // The gate the mappers are backstopped by. It checks what a proposal READ,
    // because the thing it used to check — the proposal's destination key in a
    // CMS blob — shares no vocabulary with `INTERNAL_ONLY_PATHS` and therefore
    // could never match. If this stops firing, a mapper that starts carrying
    // `supplierRef` or a branding dimension reaches the storefront unopposed.
    const entry = buildProposal(
      input({ sourcePaths: ['technical.seams.*.text', 'technical.seams.*.supplierRef'] }),
    )

    expect(entry?.blocked).toContain('technical.seams.*.supplierRef')
    expect(entry?.blocked).toContain('internal-only')
    expect(entry?.defaultSelected).toBe(false)
  })

  it('refuses a blocked proposal even when its value would fill a blank', () => {
    const entry = buildProposal(input({ sourcePaths: ['technical.patternPieces'] }))
    expect(entry?.state).toBe('empty')
    expect(entry?.defaultSelected).toBe(false)
  })

  it('matches a concrete array index against the declared wildcard', () => {
    expect(internalSourceReason(['blueprint.0.features.3.supplierRef'])).not.toBeNull()
    expect(internalSourceReason(['trims.2.vendor'])).not.toBeNull()
  })

  it('lets a disclosable sibling of an internal field through', () => {
    // `technical.seams.*.text` sits beside `technical.seams.*.supplierRef`;
    // the split is field-level, so declaring the parent must not be enough and
    // declaring a disclosable leaf must not be punished.
    expect(internalSourceReason(['technical.seams.*.text', 'technical.seams.*.spi'])).toBeNull()
    expect(buildProposal(input())?.blocked).toBeNull()
  })

  it('does not judge disclosure by the destination path', () => {
    // A CMS destination that happens to look like a document path is not a
    // disclosure question — only `sourcePaths` is.
    const entry = buildProposal(input({ path: 'technical.patternPieces' }))
    expect(entry?.blocked).toBeNull()
  })
})

describe('buildProposal', () => {
  it('drops a proposal with nothing to offer and nothing to explain', () => {
    expect(buildProposal(input({ next: '' }))).toBeNull()
  })

  it('keeps a blocked proposal even when it carries no value', () => {
    const entry = buildProposal(input({ next: '', blocked: 'Artwork only.' }))
    expect(entry?.blocked).toBe('Artwork only.')
  })

  it('reports the fallback as current when the field itself is unset', () => {
    const entry = buildProposal(input({ current: '', renderedBy: ['', 'Inherited copy'] }))
    expect(entry?.state).toBe('differs')
    expect(entry?.current).toBe('Inherited copy')
  })

  it('prefers the field over any fallback', () => {
    const entry = buildProposal(input({ current: 'Own copy', renderedBy: ['Inherited copy'] }))
    expect(entry?.current).toBe('Own copy')
  })

  it('is same, not empty, when the fallback already matches the pack', () => {
    // Writing a value the page is already showing changes nothing, so it must
    // not be counted as a field the import filled.
    const entry = buildProposal(
      input({ current: '', renderedBy: ['Plain Seam With Lockstitch'] }),
    )
    expect(entry?.state).toBe('same')
    expect(entry?.defaultSelected).toBe(false)
  })

  it('still fills a field that is blank everywhere', () => {
    const entry = buildProposal(input({ current: '', renderedBy: ['', []] }))
    expect(entry?.state).toBe('empty')
    expect(entry?.defaultSelected).toBe(true)
    expect(entry?.apply(drafts())).toEqual(drafts())
  })
})
