import { describe, expect, it } from 'vitest'
import {
  PASSPORT_PREVIEW_TOKEN,
  buildPassportPreviewRoute,
  isPassportPreviewToken,
  normalizePassportPreviewView,
} from '../lib/passportPreview'

/**
 * The guest/owner preview forcing must fire ONLY for the reserved sentinel
 * token — a real QR token never synthesizes a passport or honors the view
 * flag, so real visitors are unaffected.
 */
describe('passportPreview gating', () => {
  it('only the sentinel token triggers the preview branch', () => {
    expect(isPassportPreviewToken(PASSPORT_PREVIEW_TOKEN)).toBe(true)
    expect(isPassportPreviewToken('a-real-qr-token-1234')).toBe(false)
    expect(isPassportPreviewToken('preview')).toBe(false)
    expect(isPassportPreviewToken('')).toBe(false)
  })

  it('normalizes the view flag, defaulting to guest for anything but "owner"', () => {
    expect(normalizePassportPreviewView('owner')).toBe('owner')
    expect(normalizePassportPreviewView('guest')).toBe('guest')
    expect(normalizePassportPreviewView(undefined)).toBe('guest')
    expect(normalizePassportPreviewView('nonsense')).toBe('guest')
    expect(normalizePassportPreviewView(null)).toBe('guest')
  })

  it('builds a preview route encoding the slug and forced view', () => {
    const route = buildPassportPreviewRoute('oath-tee', 'owner')
    expect(route.startsWith(`/p/${PASSPORT_PREVIEW_TOKEN}?`)).toBe(true)
    expect(route).toContain('previewSlug=oath-tee')
    expect(route).toContain('previewView=owner')

    const guest = buildPassportPreviewRoute('', 'guest')
    expect(guest).toContain('previewView=guest')
    expect(guest).not.toContain('previewSlug=')
  })
})
