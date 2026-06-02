import { describe, expect, it } from 'vitest'
import { ACT_RESPONSIVE_STYLE } from '@/features/marketing/act-presets/shared/actResponsiveTokens'

describe('ACT_RESPONSIVE_STYLE', () => {
  it('uses readable body and emblem floors for oath presets', () => {
    expect(ACT_RESPONSIVE_STYLE['--act-body-size']).toMatch(/0\.875rem/)
    expect(ACT_RESPONSIVE_STYLE['--act-emblem-size']).toMatch(/3\.25rem/)
    expect(ACT_RESPONSIVE_STYLE['--act-gap-lg']).toMatch(/1rem/)
  })
})
