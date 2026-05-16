export const LANDING_ACT_SLOT_KEYS = [
  'hero',
  'manifesto',
  'dropReveal',
  'pieces',
  'materials',
  'waitlist',
] as const

export type LandingActSlotKey = (typeof LANDING_ACT_SLOT_KEYS)[number]

export type LandingActSlot = {
  key: LandingActSlotKey
  enabled: boolean
}

export function isSlotKey(value: string): value is LandingActSlotKey {
  return (LANDING_ACT_SLOT_KEYS as readonly string[]).includes(value)
}

export function normalizeLandingActSequence(
  input: LandingActSlot[] | undefined | null,
): LandingActSlot[] {
  const byKey = new Map<LandingActSlotKey, LandingActSlot>()
  for (const key of LANDING_ACT_SLOT_KEYS) {
    byKey.set(key, { key, enabled: true })
  }
  if (Array.isArray(input)) {
    for (const row of input) {
      if (!row || typeof row !== 'object') continue
      const k = row.key
      if (typeof k !== 'string' || !isSlotKey(k)) continue
      byKey.set(k, { key: k, enabled: Boolean(row.enabled) })
    }
  }
  return LANDING_ACT_SLOT_KEYS.map((key) => byKey.get(key)!)
}

export function defaultLandingActSequence(): LandingActSlot[] {
  return LANDING_ACT_SLOT_KEYS.map((key) => ({ key, enabled: true }))
}
