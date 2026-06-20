import { Check, Copy, Monitor, Plus, RotateCcw, Save, Smartphone, Sparkles, Trash2 } from 'lucide-react'
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
  ANVL_PRESETS,
  createThemePreset,
  finalizeThemePalette,
  type ThemeAppearance,
  type ThemeLibraryConfig,
  type ThemePreset,
} from '@/features/cms/config/themeLibrary'
import { THEME_EDITOR_SECTIONS } from '@/features/cms/config/themeTokens'
import { ThemeColorField } from './ThemeColorField'
import { ThemeComponentPreview } from './ThemeComponentPreview'
import { ThemeContrastReport } from './ThemeContrastReport'

type PreviewMode = 'desktop' | 'mobile'

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
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  useEffect(() => {
    setLibrary(stored)
    setEditingId(stored.activeThemeId)
  }, [stored])

  const editingPreset =
    library.themes.find((t) => t.id === editingId) ?? library.themes[0]
  const isDirty = useMemo(
    () => JSON.stringify(library) !== JSON.stringify(stored),
    [library, stored],
  )

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-start">
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

        <div className="space-y-4 xl:sticky xl:top-6">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Live preview
            </span>
            <div className="flex gap-1.5">
              <AdminTopbarChipButton
                type="button"
                size="icon"
                variant={previewMode === 'desktop' ? 'primary' : undefined}
                icon={<Monitor size={15} />}
                onClick={() => setPreviewMode('desktop')}
                aria-label="Desktop preview"
                title="Desktop preview"
              />
              <AdminTopbarChipButton
                type="button"
                size="icon"
                variant={previewMode === 'mobile' ? 'primary' : undefined}
                icon={<Smartphone size={15} />}
                onClick={() => setPreviewMode('mobile')}
                aria-label="Mobile preview"
                title="Mobile preview"
              />
            </div>
          </div>
          <ThemeComponentPreview preset={editingPreset} mode={previewMode} />
          <ThemeContrastReport
            palette={editingPreset.palette}
            onApplyFix={(key, value) => setPaletteField(key, value)}
          />
        </div>
      </div>
    </div>
  )
}
