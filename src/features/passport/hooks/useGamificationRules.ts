import { useQuery } from '@tanstack/react-query'

import { fetchGamificationRules } from '../api/gamificationClient'
import {
  DEFAULT_GAMIFICATION_RULES,
  type GamificationRules,
} from '../schemas/gamification.schema'

export const GAMIFICATION_RULES_QUERY_KEY = ['gamification', 'rules'] as const

/**
 * The live gamification rule set. Renders immediately on the code defaults
 * (== the DB seed, so no visual pop) and swaps to the published DB rules when
 * the anon fetch lands. Rules change rarely — cache for the session.
 */
export function useGamificationRules(): GamificationRules {
  const query = useQuery({
    queryKey: GAMIFICATION_RULES_QUERY_KEY,
    queryFn: fetchGamificationRules,
    placeholderData: DEFAULT_GAMIFICATION_RULES,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
  return query.data ?? DEFAULT_GAMIFICATION_RULES
}
