import type { QueryClient } from '@tanstack/react-query'
import { ADMIN_DROPS_LIST_QUERY_KEY } from '@/features/admin/drops/useAdminDropsListQuery'

export function invalidateAdminDropsList(
  queryClient: QueryClient,
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: ADMIN_DROPS_LIST_QUERY_KEY })
}

type AdminDropsListInvalidator = () => void | Promise<void>

let registeredInvalidator: AdminDropsListInvalidator | null = null

export function registerAdminDropsListInvalidator(
  fn: AdminDropsListInvalidator,
): () => void {
  registeredInvalidator = fn
  return () => {
    if (registeredInvalidator === fn) registeredInvalidator = null
  }
}

export async function notifyAdminDropsListChanged(): Promise<void> {
  await registeredInvalidator?.()
}
