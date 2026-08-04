import { describe, expect, it } from 'vitest'
import type { ResolvedPassportContent } from '../../lib/resolvePassportContent'
import { buildPassportEffectFacts } from '../effectFacts'

/**
 * The readouts are AUTHORED, so the only rule worth pinning is that this stays
 * a pass-through: nothing inferred, nothing invented, nothing reordered. An
 * editor clicked those points; the storefront shows those points.
 */

function content(overrides: {
  blueprint?: ResolvedPassportContent['blueprint']['points']
  specs?: ResolvedPassportContent['specs']['points']
  fit?: ResolvedPassportContent['fit']['points']
}): ResolvedPassportContent {
  return {
    blueprint: { heading: '', intro: '', features: [], points: overrides.blueprint ?? [] },
    specs: {
      construction: '',
      fitType: '',
      compression: '',
      stretch: '',
      breathability: '',
      intendedUse: '',
      points: overrides.specs ?? [],
    },
    fit: {
      intendedFit: '',
      measurements: [],
      stretchRange: '',
      modelHeight: '',
      modelSize: '',
      sizeAdvice: '',
      points: overrides.fit ?? [],
    },
    // Only the three point lists are read here; the rest of the model is
    // irrelevant to this function and cast rather than fabricated in full.
  } as unknown as ResolvedPassportContent
}

describe('buildPassportEffectFacts', () => {
  it('emits nothing when nothing has been authored', () => {
    expect(buildPassportEffectFacts(content({}))).toEqual({
      blueprint: [],
      specs: [],
      fit: [],
    })
  })

  it('passes authored markers through verbatim, in authoring order', () => {
    const fit = [
      { x: 50, y: 32, label: 'Chest', value: '52 cm' },
      { x: 48, y: 58, label: 'Waist', value: '48 cm' },
    ]
    const facts = buildPassportEffectFacts(content({ fit }))
    expect(facts.fit).toEqual(fit)
    // Order is the editor's choice — an effect with two slots takes these two.
    expect(facts.fit.map((m) => m.label)).toEqual(['Chest', 'Waist'])
  })

  it('keeps each section\'s markers on its own list', () => {
    const facts = buildPassportEffectFacts(
      content({
        blueprint: [{ x: 20, y: 20, label: 'A', value: 'Flatlock' }],
        specs: [{ x: 60, y: 40, label: 'Knit', value: '260 GSM' }],
      }),
    )
    expect(facts.blueprint).toHaveLength(1)
    expect(facts.specs[0]?.value).toBe('260 GSM')
    expect(facts.fit).toEqual([])
  })
})
