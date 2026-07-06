import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useRegisterAdminDirty } from '@/features/admin/hooks/useRegisterAdminDirty'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'

interface UseSingletonCmsEditorOptions<T> {
  /** Unique per editor — registers with the shared unsaved-changes guard. */
  id: string
  /** The externally-stored value (from a `useSyncExternalStore`-backed read hook). */
  stored: T
  /** Persists the current local config (e.g. `saveThemeConfigAsync`). */
  saveAsync: (config: T) => Promise<void>
  successMessage?: string
  errorFallbackMessage?: string
}

interface UseSingletonCmsEditorResult<T> {
  config: T
  setConfig: React.Dispatch<React.SetStateAction<T>>
  isDirty: boolean
  saving: boolean
  showSuccess: boolean
  save: () => void
}

/**
 * Shared read/dirty-track/save/toast lifecycle for the CMS's singleton-blob
 * editors (Theme, Shop, Fonts, Assets, PDP content) — each previously
 * hand-rolled this same ~15-line pattern independently. Editors with a more
 * bespoke shape (React Hook Form–driven About/Landing Content editors) don't
 * use this — see `useRegisterAdminDirty` directly for those.
 */
export function useSingletonCmsEditor<T>({
  id,
  stored,
  saveAsync,
  successMessage = 'Saved.',
  errorFallbackMessage = 'Could not save.',
}: UseSingletonCmsEditorOptions<T>): UseSingletonCmsEditorResult<T> {
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const [config, setConfig] = useState<T>(stored)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setConfig(stored)
  }, [stored])

  const isDirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(stored),
    [config, stored],
  )
  useRegisterAdminDirty(id, isDirty)

  const save = useCallback(() => {
    void (async () => {
      setSaving(true)
      try {
        await saveAsync(config)
        toast.success(successMessage)
        flashSuccess()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : errorFallbackMessage)
      } finally {
        setSaving(false)
      }
    })()
  }, [config, saveAsync, successMessage, errorFallbackMessage, flashSuccess])

  return { config, setConfig, isDirty, saving, showSuccess, save }
}
