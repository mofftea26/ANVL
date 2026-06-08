import { Check, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import {
  readThemeLibraryFromStorage,
  saveThemeConfigAsync,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import type { ThemePalette } from '@/features/cms/config/cmsSiteConfig.zod'
import {
  createThemePreset,
  finalizeThemePalette,
  THEME_EDITOR_COLOR_FIELDS,
  type ThemeAppearance,
  type ThemeLibraryConfig,
  type ThemePreset,
} from '@/features/cms/config/themeLibrary'
import { SiteThemePreview } from './SiteThemePreview'

function useThemeLibrary(): ThemeLibraryConfig {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => readThemeLibraryFromStorage(),
    () => readThemeLibraryFromStorage(),
  )
}

export function SiteThemeEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const stored = useThemeLibrary()
  const [library, setLibrary] = useState<ThemeLibraryConfig>(stored)
  const [editingId, setEditingId] = useState(stored.activeThemeId)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLibrary(stored)
    setEditingId(stored.activeThemeId)
  }, [stored])

  const editingPreset =
    library.themes.find((t) => t.id === editingId) ?? library.themes[0]

  const save = useCallback(() => {
    void (async () => {
      setSaving(true)
      try {
        await saveThemeConfigAsync(library)
        toast.success('Theme saved to Supabase.')
        flashSuccess()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not save theme.')
      } finally {
        setSaving(false)
      }
    })()
  }, [library, flashSuccess])

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

  function updatePreset(updater: (preset: ThemePreset) => ThemePreset) {
    if (!editingPreset) return
    setLibrary((prev) => ({
      ...prev,
      themes: prev.themes.map((t) => (t.id === editingPreset.id ? updater(t) : t)),
    }))
  }

  function setPaletteField(key: keyof ThemePalette, value: string) {
    updatePreset((preset) => ({
      ...preset,
      palette: finalizeThemePalette({ ...preset.palette, [key]: value }, preset.appearance),
    }))
  }

  function addTheme() {
    const name = window.prompt('Theme name', 'New theme')
    if (!name?.trim()) return
    const appearance: ThemeAppearance =
      window.confirm('Use light appearance? Cancel for dark.') ? 'light' : 'dark'
    const preset = createThemePreset(name.trim(), appearance)
    setLibrary((prev) => ({
      ...prev,
      themes: [...prev.themes, preset],
    }))
    setEditingId(preset.id)
  }

  function removeTheme() {
    if (library.themes.length <= 1) {
      toast.error('Keep at least one theme.')
      return
    }
    if (!editingPreset) return
    if (!window.confirm(`Delete “${editingPreset.name}”?`)) return
    setLibrary((prev) => {
      const themes = prev.themes.filter((t) => t.id !== editingPreset.id)
      const activeThemeId =
        prev.activeThemeId === editingPreset.id ? themes[0].id : prev.activeThemeId
      return { activeThemeId, themes }
    })
    setEditingId(library.themes.find((t) => t.id !== editingPreset.id)?.id ?? '')
  }

  function setLiveTheme(themeId: string) {
    setLibrary((prev) => ({ ...prev, activeThemeId: themeId }))
    setEditingId(themeId)
  }

  if (!editingPreset) return null

  return (
    <div className="space-y-6" data-testid="site-theme-editor">
      <p className="text-sm text-[var(--color-text-muted)]">
        Create color themes, pick which one is live on the storefront, and save to Supabase.
      </p>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:items-start">
        <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <AdminFieldSelect
                label="Editing theme"
                value={editingId}
                onChange={setEditingId}
                options={library.themes.map((t) => ({
                  value: t.id,
                  label: t.name,
                  description:
                    t.id === library.activeThemeId ? 'Live on storefront' : undefined,
                }))}
              />
            </div>
            <AdminFieldSelect
              label="Live storefront theme"
              value={library.activeThemeId}
              onChange={setLiveTheme}
              options={library.themes.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <AdminTopbarChipButton type="button" icon={<Plus size={14} />} onClick={addTheme}>
              New theme
            </AdminTopbarChipButton>
            <AdminTopbarChipButton
              type="button"
              variant="destructive"
              icon={<Trash2 size={14} />}
              onClick={removeTheme}
            >
              Delete
            </AdminTopbarChipButton>
          </div>

          <AdminFormField label="Theme name">
            <AdminInput
              value={editingPreset.name}
              onChange={(e) =>
                updatePreset((preset) => ({ ...preset, name: e.target.value }))
              }
            />
          </AdminFormField>

          <AdminFieldSelect
            label="Appearance"
            value={editingPreset.appearance}
            onChange={(value) =>
              updatePreset((preset) => ({
                ...preset,
                appearance: value as ThemeAppearance,
                palette: finalizeThemePalette(preset.palette, value as ThemeAppearance),
              }))
            }
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {THEME_EDITOR_COLOR_FIELDS.map(({ key, label, input }) => (
              <AdminFormField key={key} label={label}>
                {input === 'color' ? (
                  <input
                    type="color"
                    value={
                      editingPreset.palette[key].startsWith('#')
                        ? editingPreset.palette[key]
                        : '#0b0b0c'
                    }
                    onChange={(e) => setPaletteField(key, e.target.value)}
                    className="h-10 w-full cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent"
                  />
                ) : (
                  <AdminInput
                    value={editingPreset.palette[key]}
                    onChange={(e) => setPaletteField(key, e.target.value)}
                    placeholder="rgba(231, 228, 223, 0.14)"
                  />
                )}
              </AdminFormField>
            ))}
          </div>
        </div>

        <div className="xl:sticky xl:top-6">
          <SiteThemePreview preset={editingPreset} />
        </div>
      </div>
    </div>
  )
}
