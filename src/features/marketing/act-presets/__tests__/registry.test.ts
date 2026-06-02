import { describe, expect, it } from 'vitest'
import {
  ACT_PRESET_ENTRIES,
  ACT_PRESETS_BY_NATURE,
  DEFAULT_ACT_PRESETS,
  getActPresetLabel,
  resolveActPreset,
} from '@/features/marketing/act-presets/registry'
import { LANDING_ACT_NATURES } from '@/features/marketing/act-presets/types'

describe('act preset registry', () => {
  it('every nature has a default preset entry', () => {
    for (const nature of LANDING_ACT_NATURES) {
      const defaultPreset = DEFAULT_ACT_PRESETS[nature]
      expect(defaultPreset).toBeTruthy()
      const entry = resolveActPreset(nature, defaultPreset)
      expect(entry, `${nature}:${defaultPreset}`).not.toBeNull()
      expect(entry?.nature).toBe(nature)
      expect(entry?.preset).toBe(defaultPreset)
      expect(entry?.component).toBeDefined()
    }
  })

  it('registers four hero presets', () => {
    expect(ACT_PRESETS_BY_NATURE.hero).toEqual([
      'standardHero',
      'editorialHero',
      'productHero',
      'cinematicScrollHero',
    ])
  })

  it('falls back to cinematic scroll hero when preset is unknown', () => {
    const entry = resolveActPreset('hero', 'does-not-exist')
    expect(entry?.preset).toBe('cinematicScrollHero')
  })

  it('resolves oath presets and legacy aliases', () => {
    expect(resolveActPreset('hero', 'theOathCinematic')?.preset).toBe('editorialHero')
    expect(resolveActPreset('hero', 'splitProduct')?.preset).toBe('productHero')
    expect(resolveActPreset('hero', 'minimalEmblem')?.preset).toBe('standardHero')
    expect(resolveActPreset('hero', 'cinematic-full-screen')?.preset).toBe(
      'cinematicScrollHero',
    )
    expect(resolveActPreset('specialEvent', 'eventCard')?.preset).toBe('oathEventPulse')
    expect(resolveActPreset('finalCTA', 'centered')?.preset).toBe('oathForgeClose')
    expect(resolveActPreset('manifesto', 'oathStampLedger')?.preset).toBe('oathTenetLedger')
    expect(resolveActPreset('productShowcase', 'gridSix')?.preset).toBe('oathEditorialThree')
  })

  it('does not expose newsletter nature', () => {
    expect(LANDING_ACT_NATURES).not.toContain('newsletterWaitlist')
  })

  it('registers all CMS builder preset keys', () => {
    for (const nature of LANDING_ACT_NATURES) {
      for (const preset of ACT_PRESETS_BY_NATURE[nature]) {
        expect(resolveActPreset(nature, preset)?.preset).toBe(preset)
      }
    }
  })

  it('maps stored preset ids to user-facing labels', () => {
    expect(getActPresetLabel('hero', 'cinematicScrollHero')).toBe('Cinematic scroll hero')
    expect(getActPresetLabel('hero', 'theOathCinematic')).toBe('Editorial hero')
    expect(getActPresetLabel('manifesto', 'oathTenetLedger')).toBe('Oath tenet ledger')
    expect(getActPresetLabel('hero', 'legacyUnknown')).toBe('Legacy Unknown')
  })

  it('exports a lazy component for every registry entry', () => {
    expect(ACT_PRESET_ENTRIES.length).toBe(
      LANDING_ACT_NATURES.reduce(
        (n, nature) => n + ACT_PRESETS_BY_NATURE[nature].length,
        0,
      ),
    )
    for (const entry of ACT_PRESET_ENTRIES) {
      expect(typeof entry.component).toBe('object')
      expect(entry.label.length).toBeGreaterThan(0)
    }
  })
})
