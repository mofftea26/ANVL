import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { runtimeClients } from '@/app/config/runtime'
import { subscribeDropsChange } from '@/features/admin/drops/drops.storage'

export const ADMIN_DROPS_LIST_QUERY_KEY = ['admin', 'drops', 'list'] as const

export function useAdminDropsListQuery() {
  const queryClient = useQueryClient()

  useEffect(() => {
    return subscribeDropsChange(() => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_DROPS_LIST_QUERY_KEY })
    })
  }, [queryClient])

  return useQuery({
    queryKey: ADMIN_DROPS_LIST_QUERY_KEY,
    queryFn: () => runtimeClients.cms.getAdminDropsList(),
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
    onSuccess: () => invalidate(),
  })
}

export function useScheduleAdminDropMutation() {
  const invalidate = useInvalidateAdminDropsList()
  return useMutation({
    mutationFn: (input: { id: string; activationIso: string }) =>
      runtimeClients.cms.scheduleAdminDrop(input.id, input.activationIso),
    onSuccess: () => invalidate(),
  })
}

export function useArchiveAdminDropMutation() {
  const invalidate = useInvalidateAdminDropsList()
  return useMutation({
    mutationFn: (id: string) => runtimeClients.cms.archiveAdminDrop(id),
    onSuccess: () => invalidate(),
  })
}

export function useDeleteAdminDropMutation() {
  const invalidate = useInvalidateAdminDropsList()
  return useMutation({
    mutationFn: (id: string) => runtimeClients.cms.deleteAdminDrop(id),
    onSuccess: () => invalidate(),
  })
}
