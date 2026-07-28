import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { CARE_ICON_KEYS } from '@/features/cms/support/supportContent.zod'
import {
  CARE_INSTRUCTION_PRESETS,
  findCarePresetByName,
  getCarePreset,
} from '@/features/cms/support/carePresets'
import { CARE_ICON_COMPONENTS, careIconMeaning } from '@/features/support/components'

describe('care symbol registry', () => {
  it('renders a real SVG symbol for every CareIconKey', () => {
    for (const key of CARE_ICON_KEYS) {
      const Icon = CARE_ICON_COMPONENTS[key]
      expect(Icon, `missing component for "${key}"`).toBeTypeOf('function')
      const { container, unmount } = render(<Icon size={20} aria-hidden="true" />)
      const svg = container.querySelector('svg')
      expect(svg, `no <svg> for "${key}"`).not.toBeNull()
      expect(svg?.getAttribute('width')).toBe('20')
      unmount()
    }
  })

  it('exposes a plain-language meaning for the standard symbols', () => {
    expect(careIconMeaning('do-not-bleach')).toMatch(/bleach/i)
    expect(careIconMeaning('iron-low')).toMatch(/lowest/i)
    // Legacy/decorative keys need no meaning entry.
    expect(careIconMeaning('generic')).toBeUndefined()
  })
})

describe('care instruction presets', () => {
  it('every preset points at a valid icon key', () => {
    const keys = new Set<string>(CARE_ICON_KEYS)
    for (const preset of CARE_INSTRUCTION_PRESETS) {
      expect(keys.has(preset.icon), `preset "${preset.key}" → unknown icon "${preset.icon}"`).toBe(
        true,
      )
    }
  })

  it('offers the standard textile-care symbols to choose from', () => {
    for (const key of ['machine-wash-30', 'do-not-bleach', 'tumble-dry-low', 'iron-high', 'dry-clean']) {
      expect(getCarePreset(key), `missing preset "${key}"`).toBeDefined()
    }
  })

  it('keeps existing preset names resolvable (backward compat)', () => {
    expect(findCarePresetByName('Machine wash')?.key).toBe('machine-wash')
    expect(findCarePresetByName('Do not iron')?.icon).toBe('do-not-iron')
  })
})
