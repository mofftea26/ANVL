import { Check, Copy, Plus, RotateCcw, Save, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import {
  readThemeLibraryFromStorage,
  saveThemeConfigAsync,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import type { ThemePalette } from '@/features/cms/config/cmsSiteConfig.zod'
import {
  ANVL_PRESETS,
  createThemePreset,
  finalizeThemePalette,
  type ThemeAppearance,
  type ThemeLibraryConfig,
  type ThemePreset,
} from '@/features/cms/config/themeLibrary'
import { THEME_EDITOR_SECTIONS } from '@/features/cms/config/themeTokens'
import { ThemeColorField } from './ThemeColorField'
import {
  SiteThemePreviewRail,
  type ThemePreviewMode,
} from './SiteThemePreviewRail'

type PreviewMode = ThemePreviewMode

function useThemeLibrary(): ThemeLibraryConfig {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => readThemeLibraryFromStorage(),
    () => readThemeLibraryFromStorage(),
  )
}

export function SiteThemeEditor() {
  const setPageActions = useAdminPageActions()
  const stored = useThemeLibrary()
  const {
    config: library,
    setConfig: setLibrary,
    isDirty,
    saving,
    showSuccess,
    save,
  } = useSingletonCmsEditor({
    id: 'theme',
    stored,
    saveAsync: saveThemeConfigAsync,
    successMessage: 'Theme saved to Supabase.',
    errorFallbackMessage: 'Could not save theme.',
  })
  const [editingId, setEditingId] = useState(stored.activeThemeId)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  useEffect(() => {
    setEditingId(stored.activeThemeId)
  }, [stored])

  const editingPreset =
    library.themes.find((t) => t.id === editingId) ?? library.themes[0]

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
        {saving ? 'Saving…' : showSuccess ? 'Saved' : isDirty ? 'Save theme •' : 'Save theme'}
      </AdminTopbarChipButton>
    ),
    [save, saving, showSuccess, isDirty],
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
    setLibrary((prev) => ({ ...prev, themes: [...prev.themes, preset] }))
    setEditingId(preset.id)
  }

  function duplicateTheme() {
    if (!editingPreset) return
    const copy: ThemePreset = {
      ...editingPreset,
      id: `theme-${Date.now()}`,
      name: `${editingPreset.name} copy`,
      recommended: undefined,
    }
    setLibrary((prev) => ({ ...prev, themes: [...prev.themes, copy] }))
    setEditingId(copy.id)
    toast.success(`Duplicated “${editingPreset.name}.”`)
  }

  function resetTheme() {
    if (!editingPreset) return
    const builtIn = ANVL_PRESETS.find((p) => p.id === editingPreset.id)
    if (!builtIn) {
      toast.error('Only built-in presets can be reset.')
      return
    }
    if (!window.confirm(`Reset “${editingPreset.name}” to its brand defaults?`)) return
    updatePreset(() => ({ ...builtIn }))
    toast.success(`Reset “${editingPreset.name}.”`)
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
      return { ...prev, activeThemeId, themes }
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
        Ten brand presets ship ready to use. Edit colors, validate contrast, pick
        the live storefront theme, and save to Supabase.
        {isDirty ? (
          <span className="ml-1 text-[var(--color-highlight)]">Unsaved changes.</span>
        ) : null}
      </p>

      <AdminWorkspace
        asideLabel="Theme preview and accessibility"
        aside={
          <SiteThemePreviewRail
            preset={editingPreset}
            mode={previewMode}
            onModeChange={setPreviewMode}
            onApplyFix={setPaletteField}
          />
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <AdminFieldSelect
                label="Editing theme"
                value={editingId}
                onChange={setEditingId}
                options={library.themes.map((t) => ({
                  value: t.id,
                  label: t.recommended ? `${t.name} ★` : t.name,
                  description:
                    t.id === library.activeThemeId ? 'Live on storefront' : t.description,
                }))}
              />
            </div>
            <AdminFieldSelect
              label="Live storefront theme"
              value={library.activeThemeId}
              onChange={setLiveTheme}
              options={library.themes.map((t) => ({ value: t.id, label: t.name }))}
            />
            <div className="flex gap-2">
              <AdminTopbarChipButton
                type="button"
                size="icon"
                icon={<Plus size={16} />}
                onClick={addTheme}
                aria-label="New theme"
                title="New theme"
              />
              <AdminTopbarChipButton
                type="button"
                size="icon"
                icon={<Copy size={16} />}
                onClick={duplicateTheme}
                aria-label="Duplicate theme"
                title="Duplicate theme"
              />
              <AdminTopbarChipButton
                type="button"
                size="icon"
                icon={<RotateCcw size={16} />}
                onClick={resetTheme}
                aria-label="Reset to preset"
                title="Reset to brand preset"
              />
              <AdminTopbarChipButton
                type="button"
                size="icon"
                variant="destructive"
                icon={<Trash2 size={16} />}
                onClick={removeTheme}
                aria-label="Delete theme"
                title="Delete theme"
              />
            </div>
          </div>

          {editingPreset.recommended ? (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-accent)]">
              <Sparkles size={12} /> Recommended for Drop 01
            </p>
          ) : null}

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

          {/* Normalized palette (§12) — a small, conventional token set. Every
              other effect color is derived from these by themeConfigToCssVars. */}
          {THEME_EDITOR_SECTIONS.map((section) => (
            <section key={section.id} className="space-y-3">
              <div>
                <h2 className="text-sm font-medium text-[var(--color-heading)]">
                  {section.title}
                </h2>
                {section.description ? (
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {section.description}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map(({ key, label, allowAlpha }) => (
                  <ThemeColorField
                    key={key}
                    label={label}
                    value={editingPreset.palette[key] ?? ''}
                    allowAlpha={allowAlpha}
                    onChange={(value) => setPaletteField(key, value)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </AdminWorkspace>
    </div>
  )
}
