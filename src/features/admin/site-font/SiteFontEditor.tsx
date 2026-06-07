import { Check, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import {
  readFontConfigFromStorage,
  saveFontConfigAsync,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import {
  DEFAULT_FONT_CONFIG,
  type FontConfig,
} from '@/features/cms/config/cmsSiteConfig.zod'

function useFontConfig(): FontConfig {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => readFontConfigFromStorage(),
    () => DEFAULT_FONT_CONFIG,
  )
}

export function SiteFontEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const stored = useFontConfig()
  const [settings, setSettings] = useState<FontConfig>(stored)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSettings(stored)
  }, [stored])

  const save = useCallback(() => {
    void (async () => {
      setSaving(true)
      try {
        await saveFontConfigAsync(settings)
        toast.success('Fonts saved.')
        flashSuccess()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not save fonts.')
      } finally {
        setSaving(false)
      }
    })()
  }, [settings, flashSuccess])

  const toolbar = useMemo(
    () => (
      <AdminTopbarChipButton
        type="button"
        disabled={saving}
        icon={showSuccess ? <Check size={14} /> : <Save size={14} />}
        variant="primary"
        loading={saving}
        onClick={save}
      >
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save fonts'}
      </AdminTopbarChipButton>
    ),
    [save, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  return (
    <div className="space-y-6" data-testid="site-font-editor">
      <p className="text-sm text-[var(--color-text-muted)]">
        Font family names map to self-hosted @fontsource packages (Anton, Sora, Cinzel by default).
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminFormField label="Body (sans)">
          <AdminInput
            value={settings.sans}
            onChange={(e) => setSettings((p) => ({ ...p, sans: e.target.value }))}
          />
        </AdminFormField>
        <AdminFormField label="Headings">
          <AdminInput
            value={settings.heading}
            onChange={(e) => setSettings((p) => ({ ...p, heading: e.target.value }))}
          />
        </AdminFormField>
        <AdminFormField label="Display accent">
          <AdminInput
            value={settings.display}
            onChange={(e) => setSettings((p) => ({ ...p, display: e.target.value }))}
          />
        </AdminFormField>
      </div>
    </div>
  )
}
