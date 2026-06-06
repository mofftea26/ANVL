import { Check, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import {
  getGlobalBrandSettings,
  saveGlobalBrandSettingsAsync,
} from '@/features/admin/global-brand/globalBrand.service'
import type { GlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.types'
import { subscribeGlobalBrandChange } from '@/features/admin/global-brand/globalBrand.storage'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'

export function SiteThemeEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const [settings, setSettings] = useState<GlobalBrandSettings>(() =>
    getGlobalBrandSettings(),
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return subscribeGlobalBrandChange(() =>
      setSettings(getGlobalBrandSettings()),
    )
  }, [])

  const save = useCallback(() => {
    void (async () => {
      setSaving(true)
      try {
        await saveGlobalBrandSettingsAsync(settings)
        toast.success('Brand fallbacks saved.')
        setSettings(getGlobalBrandSettings())
        flashSuccess()
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not save brand fallbacks.'
        toast.error(message)
      } finally {
        setSaving(false)
      }
    })()
  }, [settings, flashSuccess])

  const themeToolbarActions = useMemo(
    () => (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AdminTopbarChipButton
          type="button"
          aria-label={
            saving
              ? 'Saving brand fallbacks'
              : showSuccess
                ? 'Brand fallbacks saved'
                : 'Save brand fallbacks'
          }
          disabled={saving}
          icon={showSuccess ? <Check size={14} /> : <Save size={14} />}
          variant="primary"
          loading={saving}
          onClick={save}
        >
          {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save fallbacks'}
        </AdminTopbarChipButton>
      </div>
    ),
    [save, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(themeToolbarActions)
    return () => setPageActions(null)
  }, [themeToolbarActions, setPageActions])

  return (
    <div className="space-y-6" data-testid="site-theme-editor">
      <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 px-4 py-3 text-sm text-[var(--color-text-muted)]">
        Global brand fallbacks shown before page assets load.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="min-h-[220px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-4">
          <MediaPickerField
            label="Default emblem"
            kind="image"
            value={settings.emblemFallbackUrl}
            onChange={(next) =>
              setSettings((prev) => ({ ...prev, emblemFallbackUrl: next }))
            }
            fallback="crest"
          />
        </div>
        <div className="min-h-[220px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-4">
          <MediaPickerField
            label="Loading emblem"
            kind="image"
            value={settings.loadingEmblemFallbackUrl}
            onChange={(next) =>
              setSettings((prev) => ({
                ...prev,
                loadingEmblemFallbackUrl: next,
              }))
            }
            fallback="crest"
          />
        </div>
      </div>
    </div>
  )
}
