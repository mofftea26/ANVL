import type { LandingActSlot } from '../drops.actSequence'
import { normalizeLandingActSequence } from '../drops.actSequence'
import {
  mergeActAnimationConfig,
  type PublicLandingAct,
} from './landingActs.types'

const SLOT_TO_PUBLIC_NATURE: Record<LandingActSlot['key'], string> = {
  hero: 'hero',
  manifesto: 'manifesto',
  dropReveal: 'dropReveal',
  pieces: 'productShowcase',
  materials: 'materialShowcase',
  waitlist: 'newsletterWaitlist',
}

const SLOT_TO_PRESET: Record<LandingActSlot['key'], string> = {
  hero: 'theOathCinematic',
  manifesto: 'oathStampLedger',
  dropReveal: 'monolithReveal',
  pieces: 'threeCardEditorial',
  materials: 'fabricRunway',
  waitlist: 'oathFullWidthForm',
}

export function publicLandingActsFromSequence(
  sequence: LandingActSlot[] | undefined | null,
): PublicLandingAct[] {
  const normalized = normalizeLandingActSequence(sequence)
  const out: PublicLandingAct[] = []
  let sortOrder = 0
  for (const slot of normalized) {
    if (!slot.enabled) continue
    out.push({
      id: `landing-slot-${slot.key}`,
      nature: SLOT_TO_PUBLIC_NATURE[slot.key],
      preset: SLOT_TO_PRESET[slot.key],
      sortOrder: sortOrder++,
      animation: mergeActAnimationConfig(),
      slotKey: slot.key,
      enabled: true,
    })
  }
  return out
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v))
}

function slotKeyFromNature(nature: string): string {
  switch (nature) {
    case 'storytelling':
      return 'manifesto'
    case 'productShowcase':
      return 'pieces'
    case 'materialShowcase':
      return 'materials'
    case 'newsletterWaitlist':
      return 'waitlist'
    case 'hero':
    case 'manifesto':
    case 'dropReveal':
    case 'pieces':
    case 'materials':
    case 'waitlist':
      return nature
    default:
      return 'custom'
  }
}

export function publicLandingActsFromUnknownList(
  raw: unknown,
): PublicLandingAct[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const out: PublicLandingAct[] = []
  let i = 0
  for (const row of raw) {
    if (!isRecord(row)) continue
    const nature = row.nature
    if (typeof nature !== 'string') continue
    const preset = typeof row.preset === 'string' ? row.preset : 'default'
    const id = typeof row.id === 'string' ? row.id : `act-import-${i}`
    const sortOrder = typeof row.sortOrder === 'number' ? row.sortOrder : i
    let animation = mergeActAnimationConfig()
    if (isRecord(row.animation)) {
      const a = row.animation
      animation = mergeActAnimationConfig({
        enabled: typeof a.enabled === 'boolean' ? a.enabled : undefined,
        desktopOnly:
          typeof a.desktopOnly === 'boolean' ? a.desktopOnly : undefined,
        type: typeof a.type === 'string' ? a.type : undefined,
        intensity:
          a.intensity === 'subtle' ||
          a.intensity === 'standard' ||
          a.intensity === 'bold'
            ? a.intensity
            : undefined,
      })
    }
    out.push({
      id,
      nature,
      preset,
      sortOrder,
      animation,
      slotKey: slotKeyFromNature(nature),
      enabled: row.enabled !== false,
    })
    i++
  }
  return out.length > 0 ? out : null
}
