import { useQuery } from '@tanstack/react-query'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  ADMIN_DROPS_LIST_QUERY_KEY,
  loadAdminDropsList,
} from '@/features/admin/drops/useAdminDropsListQuery'

/** Whether this drop is the live storefront campaign (`storefront_publication.active_drop_id`). */
export function useDropLiveOnStorefront(
  dropId: string | undefined,
  localIsActive: boolean,
): boolean {
  const env = getSupabasePublicEnv()
  const query = useQuery({
    queryKey: ADMIN_DROPS_LIST_QUERY_KEY,
    queryFn: loadAdminDropsList,
    enabled: Boolean(env && dropId),
    select: (items) => items.find((d) => d.id === dropId)?.isActive ?? false,
    staleTime: 15_000,
  })

  if (!env || !dropId) return localIsActive
  if (query.data != null) return query.data
  return localIsActive
}
