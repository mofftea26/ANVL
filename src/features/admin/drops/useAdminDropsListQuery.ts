import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { runtimeClients } from '@/app/config/runtime'
import { subscribeDropsChange } from '@/features/admin/drops/drops.storage'
import { notifyStorefrontPublicationChanged } from '@/features/cms/hooks/invalidateStorefrontPublication'
import { fetchAdminDropsListFromSupabase } from '@/features/admin/cmsRemote/adminCmsDropsList'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { rehydrateAdminCmsFromRemote } from '@/features/admin/cmsRemote/rehydrateAdminCmsFromRemote'
import { notifyAdminDropsListChanged } from '@/features/admin/cmsRemote/invalidateAdminDropsList'

export const ADMIN_DROPS_LIST_QUERY_KEY = ['admin', 'drops', 'list'] as const

export async function loadAdminDropsList() {
  if (getSupabasePublicEnv()) {
    try {
      await rehydrateAdminCmsFromRemote()
    } catch {
      /* list can still fall back to remote fetch */
    }
    const remote = await fetchAdminDropsListFromSupabase()
    if (remote.ok) return remote.items
  }
  return runtimeClients.cms.getAdminDropsList()
}
export function useAdminDropsListQuery() {
  const queryClient = useQueryClient()

  useEffect(() => {
    return subscribeDropsChange(() => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_DROPS_LIST_QUERY_KEY })
    })
  }, [queryClient])

  return useQuery({
    queryKey: ADMIN_DROPS_LIST_QUERY_KEY,
    queryFn: loadAdminDropsList,
  })
}

function useInvalidateAdminDropsList() {
  const queryClient = useQueryClient()
  return () =>
    void queryClient.invalidateQueries({ queryKey: ADMIN_DROPS_LIST_QUERY_KEY })
}

export function useDuplicateAdminDropMutation() {
  const invalidate = useInvalidateAdminDropsList()
  return useMutation({
    mutationFn: (id: string) => runtimeClients.cms.duplicateAdminDrop(id),
    onSuccess: () => invalidate(),
  })
}

export function useSetActiveAdminDropMutation() {
  const invalidate = useInvalidateAdminDropsList()
  return useMutation({
    mutationFn: (id: string) => runtimeClients.cms.setAdminActiveDrop(id),
    onSuccess: async () => {
      invalidate()
      await rehydrateAdminCmsFromRemote()
      await notifyStorefrontPublicationChanged()
      await notifyAdminDropsListChanged()
    },
  })
}

export function useDeactivateAdminDropMutation() {
  const invalidate = useInvalidateAdminDropsList()
  return useMutation({
    mutationFn: (id: string) => runtimeClients.cms.deactivateAdminDrop(id),
    onSuccess: async () => {
      invalidate()
      await rehydrateAdminCmsFromRemote()
      await notifyStorefrontPublicationChanged()
      await notifyAdminDropsListChanged()
    },
  })
}

export function useScheduleAdminDropMutation() {
  const invalidate = useInvalidateAdminDropsList()
  return useMutation({
    mutationFn: (input: { id: string; activationIso: string }) =>
      runtimeClients.cms.scheduleAdminDrop(input.id, input.activationIso),
    onSuccess: async () => {
      invalidate()
      await notifyAdminDropsListChanged()
    },
  })
}

export function useDeleteAdminDropMutation() {
  const invalidate = useInvalidateAdminDropsList()
  return useMutation({
    mutationFn: (id: string) => runtimeClients.cms.deleteAdminDrop(id),
    onSuccess: () => invalidate(),
  })
}
