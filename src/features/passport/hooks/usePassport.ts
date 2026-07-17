import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useStorefrontAccountSession } from '@/features/storefront-account/publicAccount.core'
import {
  acceptPassportTransfer,
  cancelPassportTransfer,
  claimPassport,
  fetchPassportByToken,
  initiatePassportTransfer,
  listOwnedPassports,
  setPassportVisibility,
} from '../api/passportClient'
import type { ClaimPassportInput, PassportView } from '../schemas/passport.schema'

export const passportQueryKeys = {
  all: ['productPassport'] as const,
  byToken: (token: string, customerId: string | null, transferCode: string | null) =>
    [...passportQueryKeys.all, 'token', token, customerId, transferCode] as const,
  owned: (customerId: string | null) =>
    [...passportQueryKeys.all, 'owned', customerId] as const,
}

/**
 * Token lookup keyed by the current customer (and any transfer code in the
 * URL) so the owner/recipient projection refreshes when the session appears
 * (post sign-in redirect back to /p/$token).
 */
export function usePassportQuery(
  token: string,
  initialData?: PassportView | null,
  transferCode?: string,
) {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  return useQuery({
    queryKey: passportQueryKeys.byToken(token, customerId, transferCode ?? null),
    queryFn: () => fetchPassportByToken(token, transferCode),
    enabled: Boolean(token),
    // Loader data is anon-scoped; only seed the signed-out cache entry with it.
    initialData: customerId ? undefined : initialData,
    staleTime: 15_000,
  })
}

export function useClaimPassportMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ClaimPassportInput) => claimPassport(input),
    onSuccess: (result) => {
      if (result.ok) {
        void qc.invalidateQueries({ queryKey: passportQueryKeys.all })
      }
    },
  })
}

export function useSetVisibilityMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { token: string; isPublic: boolean }) =>
      setPassportVisibility(input.token, input.isPublic),
    onSuccess: (result) => {
      if (result.ok) {
        void qc.invalidateQueries({ queryKey: passportQueryKeys.all })
      } else {
        // Never fail silently — the reason surfaces.
        toast.error(result.error ?? 'Could not update visibility.')
      }
    },
  })
}

export function useInitiateTransferMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => initiatePassportTransfer(token),
    onSuccess: (result) => {
      if (result.ok) void qc.invalidateQueries({ queryKey: passportQueryKeys.all })
    },
  })
}

export function useCancelTransferMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => cancelPassportTransfer(token),
    onSuccess: () => void qc.invalidateQueries({ queryKey: passportQueryKeys.all }),
  })
}

export function useAcceptTransferMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { token: string; code: string; displayName: string }) =>
      acceptPassportTransfer(input),
    onSuccess: (result) => {
      if (result.ok) void qc.invalidateQueries({ queryKey: passportQueryKeys.all })
    },
  })
}

export function useOwnedPassportsQuery() {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  return useQuery({
    queryKey: passportQueryKeys.owned(customerId),
    queryFn: () => listOwnedPassports(),
    enabled: Boolean(customerId),
    // The armory must reflect admin-side unassigns promptly — always refetch
    // on mount instead of serving the 30s-stale default.
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
