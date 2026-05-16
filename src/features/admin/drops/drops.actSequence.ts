import {
  LANDING_ACT_SLOT_KEYS,
  type LandingActSlot,
  type LandingActSlotKey,
} from '@/features/admin/drops/drops.types'

const DEFAULT_SEQUENCE: LandingActSlot[] = LANDING_ACT_SLOT_KEYS.map((key) => ({
  key,
  enabled: true,
}))

function isSlotKey(key: unknown): key is LandingActSlotKey {
  return typeof key === 'string' && (LANDING_ACT_SLOT_KEYS as readonly string[]).includes(key)
}

/**
 * Ensures every landing slot exists once, in canonical order, with sane `enabled` flags.
 */
export function normalizeLandingActSequence(
  input: LandingActSlot[] | undefined | null,
): LandingActSlot[] {
  if (!Array.isArray(input) || input.length === 0) {
    return structuredClone(DEFAULT_SEQUENCE)
  }

  const byKey = new Map<LandingActSlotKey, boolean>()
  for (const row of input) {
    if (!row || typeof row !== 'object') continue
    const key = 'key' in row ? (row as LandingActSlot).key : undefined
    if (!isSlotKey(key) || byKey.has(key)) continue
    byKey.set(key, typeof row.enabled === 'boolean' ? row.enabled : true)
  }

  return LANDING_ACT_SLOT_KEYS.map((key) => ({
    key,
    enabled: byKey.has(key) ? (byKey.get(key) as boolean) : true,
  }))
}

/** Default order with every slot enabled (new drops / migrations). */
export function defaultLandingActSequence(): LandingActSlot[] {
  return normalizeLandingActSequence(undefined)
}
