import { Check, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { Select } from '@/shared/components/ui/Select'
import {
  readThemeConfigFromStorage,
  saveThemeConfigAsync,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import {
  DEFAULT_BONE_LIGHT_PALETTE,
  DEFAULT_THEME_CONFIG,
  DEFAULT_THEME_PALETTE,
  type ThemeConfig,
  type ThemeMode,
  type ThemePalette,
} from '@/features/cms/config/cmsSiteConfig.zod'

function useThemeConfig(): ThemeConfig {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => readThemeConfigFromStorage(),
    () => DEFAULT_THEME_CONFIG,
  )
}

const PALETTE_FIELDS: { key: keyof ThemePalette; label: string }[] = [
  { key: 'colorBg', label: 'Background' },
  { key: 'colorSurface', label: 'Surface' },
  { key: 'colorText', label: 'Text' },
  { key: 'colorTextMuted', label: 'Muted text' },
  { key: 'colorHeading', label: 'Headings' },
  { key: 'colorAccent', label: 'Accent' },
  { key: 'colorEmber', label: 'Ember' },
  { key: 'colorEmberBright', label: 'Ember bright' },
  { key: 'anvlBone', label: 'Bone' },
]

export function SiteThemeEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const stored = useThemeConfig()
  const [settings, setSettings] = useState<ThemeConfig>(stored)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSettings(stored)
  }, [stored])

  const save = useCallback(() => {
    void (async () => {
      setSaving(true)
      try {
        await saveThemeConfigAsync(settings)
        toast.success('Theme saved.')
        flashSuccess()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not save theme.')
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
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save theme'}
      </AdminTopbarChipButton>
    ),
    [save, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  function setMode(mode: ThemeMode) {
    setSettings({
      dataTheme: mode,
      palette: mode === 'bone-light' ? DEFAULT_BONE_LIGHT_PALETTE : DEFAULT_THEME_PALETTE,
    })
  }

  return (
    <div className="space-y-6" data-testid="site-theme-editor">
      <p className="text-sm text-[var(--color-text-muted)]">
        Colors apply site-wide via CSS variables on the storefront.
      </p>

      <AdminFormField label="Theme mode">
        <Select
          value={settings.dataTheme}
          onChange={(e) => setMode(e.target.value as ThemeMode)}
        >
          <option value="oath-dark">Oath dark</option>
          <option value="bone-light">Bone light</option>
        </Select>
      </AdminFormField>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PALETTE_FIELDS.map(({ key, label }) => (
          <AdminFormField key={key} label={label}>
            <input
              type="color"
              value={settings.palette[key].startsWith('#') ? settings.palette[key] : '#0b0b0c'}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  palette: { ...prev.palette, [key]: e.target.value },
                }))
              }
              className="h-10 w-full cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent"
            />
          </AdminFormField>
        ))}
      </div>
    </div>
  )
}
