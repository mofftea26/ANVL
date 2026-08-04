import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mediaAssetsQueryKeys } from '@/features/admin/media/useMediaAssetsQuery'
import {
  runAndReportAutoImport,
  type AutoImportOnAssignInput,
} from './import/runAutoImportOnAssign'
import {
  listTechpackImages,
  deleteTechpackImage,
  promoteTechpackImage,
  signedTechpackUrls,
  type TechpackImageRow,
} from './techpackFiles.service'
import {
  deleteTechpackImages,
  promoteTechpackImages,
} from './techpackImageBulk'
import { ingestTechpack, type IngestTechpackOptions } from './techpackIngest'
import {
  deleteTechpack,
  getTechpack,
  listTechpacks,
  setTechpackFinal,
  updateTechpack,
  type TechpackResult,
  type UpdateTechpackInput,
} from './techpacks.service'

/**
 * React Query seam for the techpack admin. Keys are namespaced under
 * `['admin','techpacks']` via one exported factory (the
 * `adminProductCatalogQueryKeys` pattern) so nothing invalidates by
 * hand-written array literal.
 *
 * Services return `Result` unions rather than throwing; the mutation wrappers
 * unwrap them into thrown `Error`s so React Query's `onError` is the single
 * place a failure surfaces.
 */

export const techpackQueryKeys = {
  all: ['admin', 'techpacks'] as const,
  lists: () => [...techpackQueryKeys.all, 'list'] as const,
  list: (productSlug?: string) =>
    [...techpackQueryKeys.lists(), productSlug ?? 'all'] as const,
  detail: (id: string) => [...techpackQueryKeys.all, 'detail', id] as const,
  images: (id: string) => [...techpackQueryKeys.all, 'images', id] as const,
  imageUrls: (id: string, paths: readonly string[]) =>
    [...techpackQueryKeys.all, 'image-urls', id, paths.join('|')] as const,
}

/** Unwrap a service `Result` into a value or a thrown error. */
function unwrap<T>(result: TechpackResult<T>): T {
  if (!result.ok) throw new Error(result.error)
  return result.data
}

export function useTechpackListQuery(productSlug?: string) {
  return useQuery({
    queryKey: techpackQueryKeys.list(productSlug),
    queryFn: async () => unwrap(await listTechpacks({ productSlug })),
    staleTime: 15_000,
  })
}

export function useTechpackQuery(id: string | null) {
  return useQuery({
    queryKey: techpackQueryKeys.detail(id ?? ''),
    queryFn: async () => unwrap(await getTechpack(id ?? '')),
    enabled: Boolean(id),
  })
}

export function useTechpackImagesQuery(id: string | null) {
  return useQuery({
    queryKey: techpackQueryKeys.images(id ?? ''),
    queryFn: async () => unwrap(await listTechpackImages(id ?? '')),
    enabled: Boolean(id),
  })
}

/**
 * Signed URLs for a techpack's images, batched into one round trip.
 * `staleTime` sits well inside the signature's lifetime so a grid never
 * re-signs mid-review, and `gcTime` matches so a stale URL is never replayed.
 */
const SIGNED_URL_TTL_SECONDS = 3600
const SIGNED_URL_STALE_MS = 45 * 60 * 1000

export function useTechpackImageUrlsQuery(
  id: string | null,
  images: readonly TechpackImageRow[],
) {
  const paths = images.map((image) => image.storagePath)
  return useQuery({
    queryKey: techpackQueryKeys.imageUrls(id ?? '', paths),
    queryFn: async () => unwrap(await signedTechpackUrls(paths, SIGNED_URL_TTL_SECONDS)),
    enabled: Boolean(id) && paths.length > 0,
    staleTime: SIGNED_URL_STALE_MS,
    gcTime: SIGNED_URL_STALE_MS,
  })
}

/**
 * Both auto-import triggers fire from the MUTATION-level `onSuccess`, never
 * from `mutate(vars, { onSuccess })`. React Query only runs the observer-level
 * callbacks while the observer still has listeners, so a panel that unmounts
 * between Save and the save resolving would drop the whole import with no
 * error. `Mutation.execute()` awaits these ones no matter who is watching.
 *
 * They are fired without `await` on purpose: the import reports itself, and
 * holding the mutation open would delay the operator's own "saved" feedback
 * behind three CMS round trips.
 */
export function useIngestTechpackMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { file: File } & IngestTechpackOptions) => {
      const { file, ...options } = input
      return unwrap(await ingestTechpack(file, options))
    },
    onSuccess: async (result, variables) => {
      // The upload panel's product select writes `product_slug` at INSERT, so
      // this row is BORN assigned and the detail panel's slug transition never
      // happens. Without this the commonest flow of all — upload, pick product,
      // parse — imported nothing and said nothing about it.
      //
      // Reaching here means `ingestTechpack` already persisted the parse and
      // flipped the row to `parsed`; it returns `ok` no earlier. A later Save
      // in the detail panel cannot double-import, because the row's stored slug
      // is now the one it would be assigning (`autoImportSkipReason` →
      // `unchanged`).
      const productSlug = variables.productSlug?.trim() ?? ''
      if (productSlug) {
        void runAndReportAutoImport({
          previousSlug: '',
          nextSlug: productSlug,
          status: 'parsed',
          document: result.document,
        })
      }
      await queryClient.invalidateQueries({ queryKey: techpackQueryKeys.lists() })
    },
  })
}

export interface UpdateTechpackVariables extends UpdateTechpackInput {
  id: string
  /** Present when this save is an assignment that should fill the blanks. */
  autoImport?: AutoImportOnAssignInput
}

export function useUpdateTechpackMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateTechpackVariables) => {
      // Listed rather than rest-spread so `autoImport` can never leak into the
      // column patch.
      const { id, title, productSlug, status, notes } = input
      unwrap(await updateTechpack(id, { title, productSlug, status, notes }))
      return id
    },
    onSuccess: async (id, variables) => {
      if (variables.autoImport) void runAndReportAutoImport(variables.autoImport)
      await queryClient.invalidateQueries({ queryKey: techpackQueryKeys.lists() })
      await queryClient.invalidateQueries({ queryKey: techpackQueryKeys.detail(id) })
    },
  })
}

export function useSetTechpackFinalMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await setTechpackFinal(id))
      return id
    },
    onSuccess: async (id) => {
      // Marking one pack final CLEARS another's flag, so the whole list is stale.
      await queryClient.invalidateQueries({ queryKey: techpackQueryKeys.lists() })
      await queryClient.invalidateQueries({ queryKey: techpackQueryKeys.detail(id) })
    },
  })
}

export function useDeleteTechpackMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await deleteTechpack(id))
      return id
    },
    onSuccess: async (id) => {
      queryClient.removeQueries({ queryKey: techpackQueryKeys.detail(id) })
      queryClient.removeQueries({ queryKey: techpackQueryKeys.images(id) })
      await queryClient.invalidateQueries({ queryKey: techpackQueryKeys.lists() })
    },
  })
}

export function usePromoteTechpackImageMutation(techpackId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { image: TechpackImageRow; filename?: string }) =>
      unwrap(await promoteTechpackImage(input.image, { filename: input.filename })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: techpackQueryKeys.images(techpackId ?? ''),
      })
    },
  })
}

/**
 * Remove an extracted image from the pack.
 *
 * Also invalidates the media-library key: a delete cannot touch a promoted
 * asset, but an operator who has just unpublished one and come back here
 * should not be looking at a stale "in the library" badge.
 */
export function useDeleteTechpackImageMutation(techpackId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (image: TechpackImageRow) => unwrap(await deleteTechpackImage(image)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: techpackQueryKeys.images(techpackId ?? ''),
      })
      await queryClient.invalidateQueries({ queryKey: mediaAssetsQueryKeys.all })
    },
  })
}

/** Promote or delete a whole selection of extracted images in one action. */
export function useBulkTechpackImagesMutation(techpackId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      images: readonly TechpackImageRow[]
      kind: 'promote' | 'delete'
      productSlug: string
    }) =>
      unwrap(
        input.kind === 'promote'
          ? await promoteTechpackImages(input.images, input.productSlug)
          : await deleteTechpackImages(input.images),
      ),
    // Invalidated once at the end, not per image: a thirty-image run would
    // otherwise refetch the grid thirty times while it was still working.
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: techpackQueryKeys.images(techpackId ?? ''),
      })
      await queryClient.invalidateQueries({ queryKey: mediaAssetsQueryKeys.all })
    },
  })
}
