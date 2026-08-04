import { describe, expect, it } from 'vitest'

import { careIconFor, formatCareLine, isCompositionLine } from '../careIconMap'

/** The exact care label printed on the supplied oversized-tee pack. */
const REAL_CARE_LABEL = [
  '100% COTTON',
  'COOL WASH INSIDE OUT',
  'USE MILD DETERGENT',
  'WASH DARK COLORS SEPARATELY',
  'RESHAPE WHILST DAMP',
  'DO NOT TUMBLE DRY',
  'COOL IRON ON REVERSE',
  'DO NOT IRON DECORATION',
  'DO NOT DRY CLEAN',
]

describe('careIconFor — prohibitions', () => {
  it('never reads a prohibition as its permissive counterpart', () => {
    // "DO NOT TUMBLE DRY" contains "TUMBLE DRY". Getting this backwards tells
    // a customer to destroy the garment, with a symbol that looks official.
    expect(careIconFor('DO NOT TUMBLE DRY')).toBe('do-not-tumble-dry')
    expect(careIconFor('DO NOT IRON')).toBe('do-not-iron')
    expect(careIconFor('DO NOT IRON DECORATION')).toBe('do-not-iron')
    expect(careIconFor('DO NOT DRY CLEAN')).toBe('do-not-dry-clean')
    expect(careIconFor('DO NOT BLEACH')).toBe('do-not-bleach')
    expect(careIconFor('DO NOT WASH')).toBe('do-not-wash')
    expect(careIconFor('DO NOT MACHINE WASH')).toBe('do-not-wash')
  })

  it('tolerates the spacing variants labels actually use', () => {
    expect(careIconFor('DONOT TUMBLE DRY')).toBe('do-not-tumble-dry')
    expect(careIconFor('Do not tumble dry')).toBe('do-not-tumble-dry')
  })
})

describe('careIconFor — the real label, line by line', () => {
  it('maps every instruction on the supplied pack', () => {
    expect(careIconFor('COOL WASH INSIDE OUT')).toBe('wash-inside-out')
    expect(careIconFor('USE MILD DETERGENT')).toBe('hand-soap')
    expect(careIconFor('WASH DARK COLORS SEPARATELY')).toBe('wash')
    expect(careIconFor('RESHAPE WHILST DAMP')).toBe('dry-flat')
    expect(careIconFor('COOL IRON ON REVERSE')).toBe('iron-low')
  })

  it('leaves the composition line to the material section', () => {
    expect(isCompositionLine('100% COTTON')).toBe(true)
    expect(isCompositionLine('73% NYLON')).toBe(true)
    expect(isCompositionLine('COOL WASH INSIDE OUT')).toBe(false)
  })

  it('gives every non-composition line a symbol', () => {
    const unmatched = REAL_CARE_LABEL.filter(
      (line) => !isCompositionLine(line) && careIconFor(line) === null,
    )
    expect(unmatched).toEqual([])
  })
})

describe('careIconFor — washing specifics', () => {
  it('prefers the more specific instruction', () => {
    expect(careIconFor('HAND WASH')).toBe('wash-hand')
    expect(careIconFor('COLD WASH')).toBe('wash-cold')
    expect(careIconFor('GENTLE CYCLE')).toBe('wash-gentle')
    expect(careIconFor('MACHINE WASH')).toBe('wash')
  })

  it('reads wash temperatures', () => {
    expect(careIconFor('WASH AT 30°C')).toBe('wash-30')
    expect(careIconFor('WASH AT 40 C')).toBe('wash-40')
    expect(careIconFor('MACHINE WASH 60°C')).toBe('wash-60')
  })

  it('reads drying and ironing grades', () => {
    expect(careIconFor('TUMBLE DRY LOW')).toBe('tumble-dry-low')
    expect(careIconFor('TUMBLE DRY HIGH')).toBe('tumble-dry-high')
    expect(careIconFor('TUMBLE DRY')).toBe('tumble-dry')
    expect(careIconFor('LINE DRY')).toBe('line-dry')
    expect(careIconFor('DRY FLAT')).toBe('dry-flat')
    expect(careIconFor('WARM IRON')).toBe('iron-medium')
    expect(careIconFor('HOT IRON')).toBe('iron-high')
    expect(careIconFor('IRON ON REVERSE')).toBe('iron')
  })
})

describe('careIconFor — refusing to guess', () => {
  it('returns null for anything it does not recognise', () => {
    // The line still reaches the customer as text; what it does not get is a
    // symbol nobody can justify.
    expect(careIconFor('MADE WITH CARE IN LEBANON')).toBeNull()
    expect(careIconFor('STYLE ANVL-M-SS01-FW26')).toBeNull()
    expect(careIconFor('')).toBeNull()
    expect(careIconFor('   ')).toBeNull()
  })
})

describe('formatCareLine', () => {
  it('sentence-cases a shouted label line', () => {
    expect(formatCareLine('DO NOT TUMBLE DRY')).toBe('Do not tumble dry')
    expect(formatCareLine('COOL WASH INSIDE OUT')).toBe('Cool wash inside out')
  })

  it('collapses whitespace and survives blanks', () => {
    expect(formatCareLine('  COOL   IRON  ')).toBe('Cool iron')
    expect(formatCareLine('')).toBe('')
  })
})
