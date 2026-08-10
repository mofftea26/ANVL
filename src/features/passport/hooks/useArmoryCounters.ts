import { useQuery } from '@tanstack/react-query'

import {
  EMPTY_ARMORY_COUNTERS,
  fetchArmoryCounters,
  type ArmoryCounters,
} from '../api/armoryEventsClient'

export const ARMORY_COUNTERS_QUERY_KEY = ['armory', 'counters'] as const

/**
 * Server-derived challenge counters (streaks, shares, chapter reads, tenure…).
 *
 * `EMPTY_ARMORY_COUNTERS` is the placeholder rather than `undefined`, so the
 * challenge log renders immediately with zeroes and fills in — a quest log
 * that pops into existence a beat after the rest of the Armory reads as a bug.
 *
 * Cached for a minute: these move on user action, and the mutations that
 * change them invalidate this key directly, so polling would only add load.
 */
export function useArmoryCounters(enabled = true) {
  return useQuery<ArmoryCounters>({
    queryKey: ARMORY_COUNTERS_QUERY_KEY,
    queryFn: fetchArmoryCounters,
    enabled,
    staleTime: 60_000,
    placeholderData: EMPTY_ARMORY_COUNTERS,
  })
}
