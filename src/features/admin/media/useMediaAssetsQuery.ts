import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  deleteMediaAsset,
  listMediaAssets,
  updateMediaAssetAlt,
  uploadLibraryMediaFile,
} from './mediaAssets.service'
import type { CmsMediaAsset } from './mediaAssets.types'

/** Query-key factory, matching the `accountQueryKeys` pattern (REU-14). */
export const mediaAssetsQueryKeys = {
  all: ['admin', 'cms_media_assets'] as const,
}

export function useMediaAssetsQuery() {
  const env = getSupabasePublicEnv()
  return useQuery({
    queryKey: mediaAssetsQueryKeys.all,
    queryFn: async () => {
      const result = await listMediaAssets()
      if (!result.ok) throw new Error(result.error)
      return result.assets
    },
    enabled: Boolean(env),
    staleTime: 10_000,
  })
}

export function useMediaAssetsMutations() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: mediaAssetsQueryKeys.all })

  const uploadMutation = useMutation({
    mutationFn: uploadLibraryMediaFile,
    onSuccess: () => {
      void invalidate()
      void import('@/features/admin/cmsRemote/adminCmsRemoteSync').then((m) =>
        m.scheduleAdminCmsRemoteSync(),
      )
    },
  })

  const updateAltMutation = useMutation({
    mutationFn: ({ id, alt }: { id: string; alt: string }) =>
      updateMediaAssetAlt(id, alt),
    onSuccess: () => {
      void invalidate()
      void import('@/features/admin/cmsRemote/adminCmsRemoteSync').then((m) =>
        m.scheduleAdminCmsRemoteSync(),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (asset: CmsMediaAsset) => deleteMediaAsset(asset),
    onSuccess: () => {
      void invalidate()
      void import('@/features/admin/cmsRemote/adminCmsRemoteSync').then((m) =>
        m.scheduleAdminCmsRemoteSync(),
      )
    },
  })

  return { uploadMutation, updateAltMutation, deleteMutation, invalidate }
}
