import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useStorefrontAccountSession } from '@/features/storefront-account/publicAccount.core'
import {
  createArmoryFeat,
  deleteArmoryFeat,
  deleteProductReview,
  fetchProductReviewsAuthed,
  getArmoryShare,
  listArmoryFeats,
  logPassportWear,
  setArmoryShare,
  setPassportFeatured,
  submitProductReview,
  updateArmoryFeat,
  type ArmoryWriteResult,
} from '../api/armoryClient'
import type { ArmoryFeatInput, OwnedPassport } from '../schemas/passport.schema'
import { passportQueryKeys } from './usePassport'

/**
 * React Query layer for the Armory's life features (Phase G): wear journal,
 * Feats, Hall of Honor, sharing, and PDP reviews.
 */

export const armoryQueryKeys = {
  feats: (customerId: string | null) => ['armory', 'feats', customerId] as const,
  share: (customerId: string | null) => ['armory', 'share', customerId] as const,
  reviews: (slug: string, customerId: string | null) =>
    ['armory', 'reviews', slug, customerId] as const,
}

/* ------------------------------------------------------------------ wear --- */

/**
 * "Wore it" with an optimistic bump — the counter must feel instant to be a
 * ritual worth tapping. Wear is limited to once per 24h; a rejected wear rolls
 * the optimistic bump back (the button reflects the cooldown from last_worn_at).
 */
export function useLogWearMutation() {
  const qc = useQueryClient()
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const ownedKey = passportQueryKeys.owned(customerId)
  return useMutation({
    mutationFn: (input: { id: string; delta: 1 | -1 }) =>
      logPassportWear(input.id, input.delta),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ownedKey })
      const previous = qc.getQueryData<OwnedPassport[]>(ownedKey)
      qc.setQueryData<OwnedPassport[]>(ownedKey, (old) =>
        (old ?? []).map((p) =>
          p.id === input.id
            ? {
                ...p,
                wearCount: Math.max(0, p.wearCount + input.delta),
                lastWornAt: input.delta > 0 ? new Date().toISOString() : p.lastWornAt,
              }
            : p,
        ),
      )
      return { previous }
    },
    onError: (_err, _input, context) => {
      if (context?.previous) qc.setQueryData(ownedKey, context.previous)
    },
    onSuccess: (result, _input, context) => {
      // Server rejected (cooldown/not-owner) — undo the optimistic bump.
      if (!result.ok && context?.previous) qc.setQueryData(ownedKey, context.previous)
      // A not_owner answer means this unit was unassigned out from under the
      // list (admin freed the QR) — refetch so the phantom drops immediately.
      if (!result.ok && result.error === 'not_owner') {
        toast.error('This piece is no longer registered to you — removing it.')
        void qc.invalidateQueries({ queryKey: ownedKey })
        return
      }
      // Cooldown has its own button state; everything else surfaces loudly.
      if (!result.ok && result.error !== 'cooldown') {
        toast.error(
          result.error === 'not_authenticated'
            ? 'Your session expired — sign in again and retry.'
            : 'Could not log the wear — reload and retry.',
        )
      }
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ownedKey }),
  })
}

/* --------------------------------------------------------- hall of honor --- */

export function useSetFeaturedMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; slot: 1 | 2 | 3 | null }) =>
      setPassportFeatured(input.id, input.slot),
    onSuccess: (ok) => {
      if (!ok) {
        // Covers both real failures and units unassigned mid-session — the
        // refetch drops any phantom either way.
        toast.error('Could not update the Hall of Honor — refreshing your armory.')
      }
      void qc.invalidateQueries({ queryKey: passportQueryKeys.all })
    },
  })
}

/* ----------------------------------------------------------------- feats --- */

export function useArmoryFeatsQuery() {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  return useQuery({
    queryKey: armoryQueryKeys.feats(customerId),
    queryFn: () => listArmoryFeats(),
    enabled: Boolean(customerId),
  })
}

export function useFeatMutations() {
  const qc = useQueryClient()
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  // Failures TOAST their real reason (session rot, RLS, network) — a feat
  // that doesn't appear must never be silent.
  const settle = (result: ArmoryWriteResult) => {
    if (result.ok) {
      void qc.invalidateQueries({ queryKey: armoryQueryKeys.feats(customerId) })
    } else {
      toast.error(result.error)
    }
  }
  const create = useMutation({
    mutationFn: (input: ArmoryFeatInput) => createArmoryFeat(input),
    onSuccess: settle,
  })
  const update = useMutation({
    mutationFn: (input: { id: string } & ArmoryFeatInput) =>
      updateArmoryFeat(input.id, input),
    onSuccess: settle,
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteArmoryFeat(id),
    onSuccess: settle,
  })
  return { create, update, remove }
}

/* --------------------------------------------------------------- sharing --- */

export function useArmoryShareQuery() {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  return useQuery({
    queryKey: armoryQueryKeys.share(customerId),
    queryFn: () => getArmoryShare(),
    enabled: Boolean(customerId),
  })
}

export function useSetArmoryShareMutation() {
  const qc = useQueryClient()
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  return useMutation({
    mutationFn: (isPublic: boolean) => setArmoryShare(isPublic),
    onSuccess: (share) => {
      if (share) qc.setQueryData(armoryQueryKeys.share(customerId), share)
    },
  })
}

/* --------------------------------------------------------------- reviews --- */

export function useProductReviewsQuery(slug: string) {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  return useQuery({
    queryKey: armoryQueryKeys.reviews(slug, customerId),
    queryFn: () => fetchProductReviewsAuthed(slug),
    enabled: Boolean(slug),
    staleTime: 60_000,
  })
}

export function useSubmitReviewMutation(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { rating: number; title: string; body: string; displayName: string }) =>
      submitProductReview({ slug, ...input }),
    onSuccess: (result) => {
      if (result.ok) {
        void qc.invalidateQueries({ queryKey: ['armory', 'reviews', slug] })
      }
    },
  })
}

export function useDeleteReviewMutation(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deleteProductReview(slug),
    onSuccess: (ok) => {
      if (ok) void qc.invalidateQueries({ queryKey: ['armory', 'reviews', slug] })
    },
  })
}
