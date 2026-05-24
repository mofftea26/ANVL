import { describe, expect, it } from 'vitest'
import {
  ACT_PRESET_ENTRIES,
  DEFAULT_ACT_PRESETS,
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

  it('falls back to the nature default when preset is unknown', () => {
    const entry = resolveActPreset('hero', 'does-not-exist')
    expect(entry?.preset).toBe('theOathCinematic')
  })

  it('resolves PR-9 nature presets', () => {
    expect(resolveActPreset('lookbook', 'masonry')?.preset).toBe('masonry')
    expect(resolveActPreset('specialEvent', 'eventCard')?.preset).toBe('eventCard')
    expect(resolveActPreset('finalCTA', 'centered')?.preset).toBe('centered')
  })

  it('registers all CMS builder preset keys for PR-8 natures', () => {
    const builderPresets: Record<string, readonly string[]> = {
      hero: ['theOathCinematic', 'splitProduct', 'minimalEmblem'],
      manifesto: ['oathStampLedger', 'splitText', 'scrollStacked'],
      storytelling: ['chapterScroll', 'editorialArticle', 'imageLed'],
      dropReveal: ['monolithReveal', 'countdownTrio', 'emblemFirst'],
      productShowcase: ['threeCardEditorial', 'carousel', 'productStory'],
      materialShowcase: ['fabricRunway', 'specsGrid', 'splitDetail'],
      newsletterWaitlist: ['oathFullWidthForm', 'minimalForm', 'splitForm'],
      lookbook: ['masonry', 'carousel', 'editorial'],
      specialEvent: ['eventCard', 'countdownEvent', 'locationSplit'],
      finalCTA: ['centered', 'footerOverlap', 'productCta'],
    }

    for (const [nature, presets] of Object.entries(builderPresets)) {
      for (const preset of presets) {
        expect(resolveActPreset(nature, preset)?.preset).toBe(preset)
      }
    }
  })

  it('aliases legacy gridSix product showcase preset', () => {
    expect(resolveActPreset('productShowcase', 'gridSix')?.preset).toBe('gridSix')
  })

  it('exports a lazy component for every registry entry', () => {
    expect(ACT_PRESET_ENTRIES.length).toBeGreaterThanOrEqual(LANDING_ACT_NATURES.length)
    for (const entry of ACT_PRESET_ENTRIES) {
      expect(typeof entry.component).toBe('object')
      expect(entry.label.length).toBeGreaterThan(0)
    }
  })
})
