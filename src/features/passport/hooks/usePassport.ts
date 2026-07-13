import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStorefrontAccountSession } from '@/features/storefront-account/publicAccount.core'
import {
  claimPassport,
  fetchPassportByToken,
  listOwnedPassports,
} from '../api/passportClient'
import type { ClaimPassportInput, PassportView } from '../schemas/passport.schema'

export const passportQueryKeys = {
  all: ['productPassport'] as const,
  byToken: (token: string, customerId: string | null) =>
    [...passportQueryKeys.all, 'token', token, customerId] as const,
  owned: (customerId: string | null) =>
    [...passportQueryKeys.all, 'owned', customerId] as const,
}

/**
 * Token lookup keyed by the current customer so the owner projection refreshes
 * when the session appears (post sign-in redirect back to /p/$token).
 */
export function usePassportQuery(token: string, initialData?: PassportView | null) {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  return useQuery({
    queryKey: passportQueryKeys.byToken(token, customerId),
    queryFn: () => fetchPassportByToken(token),
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

export function useOwnedPassportsQuery() {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  return useQuery({
    queryKey: passportQueryKeys.owned(customerId),
    queryFn: () => listOwnedPassports(),
    enabled: Boolean(customerId),
  })
}
