import { useQuery } from '@tanstack/react-query'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { searchPublicArmories } from '@/features/passport/api/armoryClient'
import type { ArmorySearchHit } from '@/features/passport/schemas/passport.schema'

/** The RPC's own floor — shorter queries return `[]` server-side anyway. */
const MIN_ARMORY_QUERY_LENGTH = 2

/**
 * Live public-armory search for the global search surfaces. Unlike every other
 * result group, warriors cannot live in the static Fuse corpus — profiles
 * change and must never be snapshotted client-side — so this hits the
 * anon-granted `search_public_armories` RPC (SECURITY DEFINER: public armories
 * only, handle + display name only) through the storefront anon REST path.
 *
 * Callers pass the already-debounced committed query (`useGlobalSearch` owns
 * the 350ms debounce), so this fires at the same cadence as the Fuse search.
 * Disabled — and therefore silently empty — when Supabase env is missing or
 * the query is under 2 characters.
 */
export function useArmorySearch(query: string, options: { enabled?: boolean } = {}) {
  const normalized = query.trim()
  const isConfigured = getSupabasePublicEnv() !== null
  return useQuery<ArmorySearchHit[]>({
    queryKey: ['armory-search', normalized.toLowerCase()],
    queryFn: () => searchPublicArmories(normalized),
    enabled:
      (options.enabled ?? true) &&
      isConfigured &&
      normalized.length >= MIN_ARMORY_QUERY_LENGTH,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
