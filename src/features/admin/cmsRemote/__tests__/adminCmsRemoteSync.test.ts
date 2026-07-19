import { describe, expect, it } from 'vitest'
import {
  type CmsSettingsFieldKey,
  pickCmsSettingsFields,
} from '../adminCmsRemoteSync'

const allValues: Record<CmsSettingsFieldKey, unknown> = {
  active_landing_page_key: 'the-oath',
  theme_config: { name: 'theme' },
  font_config: { name: 'font' },
  asset_config: { name: 'asset' },
  landing_content: { name: 'landing' },
  shop_config: { name: 'shop' },
  pdp_content: { name: 'pdp' },
  passport_content: { name: 'passport' },
  coming_soon: { name: 'coming_soon' },
  banner_config: { name: 'banner_config' },
  legal_content: { name: 'legal_content' },
  support_content: { name: 'support_content' },
}

describe('pickCmsSettingsFields', () => {
  it('returns every field when no scope is given (debounced auto-sync paths)', () => {
    expect(pickCmsSettingsFields(allValues)).toEqual(allValues)
  })

  it('scopes to a single field — the fix for the last-write-wins race', () => {
    // This is the exact scenario the fix addresses: tab A saves shop_config
    // while tab B's local snapshot still holds a stale theme_config. Scoping
    // the patch to only the field tab A actually changed means tab B's
    // still-in-flight theme_config never gets touched by tab A's write.
    expect(pickCmsSettingsFields(allValues, ['shop_config'])).toEqual({
      shop_config: { name: 'shop' },
    })
  })

  it('scopes to multiple fields when an editor saves more than one section at once', () => {
    expect(
      pickCmsSettingsFields(allValues, ['landing_content', 'asset_config']),
    ).toEqual({
      landing_content: { name: 'landing' },
      asset_config: { name: 'asset' },
    })
  })

  it('never includes a field outside the requested scope', () => {
    const result = pickCmsSettingsFields(allValues, ['theme_config'])
    expect(Object.keys(result)).toEqual(['theme_config'])
    expect(result).not.toHaveProperty('shop_config')
    expect(result).not.toHaveProperty('pdp_content')
  })

  it('includes banner_config and scopes the banner save to it alone', () => {
    expect(pickCmsSettingsFields(allValues)).toHaveProperty('banner_config')
    expect(pickCmsSettingsFields(allValues, ['banner_config'])).toEqual({
      banner_config: { name: 'banner_config' },
    })
  })

  it('includes legal_content and support_content and scopes each save to it alone', () => {
    const all = pickCmsSettingsFields(allValues)
    expect(all).toHaveProperty('legal_content')
    expect(all).toHaveProperty('support_content')
    expect(pickCmsSettingsFields(allValues, ['legal_content'])).toEqual({
      legal_content: { name: 'legal_content' },
    })
    expect(pickCmsSettingsFields(allValues, ['support_content'])).toEqual({
      support_content: { name: 'support_content' },
    })
  })

  it('returns an empty object for an empty field list', () => {
    expect(pickCmsSettingsFields(allValues, [])).toEqual({})
  })
})
