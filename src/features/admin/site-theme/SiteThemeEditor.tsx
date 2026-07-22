import { Copy, Plus, RotateCcw, Sparkles, Trash2 } from '@/shared/icons'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminPromptDialog } from '@/features/admin/components/AdminPromptDialog'
import { AdminSaveAction } from '@/features/admin/components/AdminSaveAction'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import { usePushPreviewDraft } from '@/features/admin/preview/usePushPreviewDraft'
import {
  readThemeLibraryFromStorage,
  saveThemeConfigAsync,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import { ICON_SIZE } from '@/shared/lib/iconSize'
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
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { ThemeColorField } from './ThemeColorField'
import { SiteThemePreviewRail } from './SiteThemePreviewRail'

type ThemeDialog = 'new' | 'reset' | 'delete' | null

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
  const [editingId, setEditingId] = useState(stored.activeThemeId)
  const [dialog, setDialog] = useState<ThemeDialog>(null)
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
    // Says exactly what went live so "edited preset X but preset Y is live"
    // can never read as a silent success (E4/E6).
    successMessage: `Saved — live theme: ${
      stored.themes.find((t) => t.id === stored.activeThemeId)?.name ?? 'unknown'
    }.`,
    errorFallbackMessage: 'Could not save theme.',
  })

  // Live preview tracks the preset being edited, even before it's activated.
  const previewLibrary = useMemo(
    () => ({ ...library, activeThemeId: editingId }),
    [library, editingId],
  )
  usePushPreviewDraft('themeLibrary', previewLibrary)

  useEffect(() => {
    setEditingId(stored.activeThemeId)
  }, [stored])

  const editingPreset =
    library.themes.find((t) => t.id === editingId) ?? library.themes[0]
  const editingIsLive = editingPreset?.id === library.activeThemeId

  const toolbar = useMemo(
    () => (
      <AdminSaveAction
        onSave={save}
        saving={saving}
        showSuccess={showSuccess}
        dirty={isDirty}
        label="Save theme"
      />
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

  function confirmAddTheme(name: string, appearance?: string) {
    const preset = createThemePreset(
      name,
      appearance === 'light' ? 'light' : 'dark',
    )
    setLibrary((prev) => ({ ...prev, themes: [...prev.themes, preset] }))
    setEditingId(preset.id)
    setDialog(null)
    toast.success(`Created “${name}.” Save to keep it.`)
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

  function requestResetTheme() {
    if (!editingPreset) return
    if (!ANVL_PRESETS.some((p) => p.id === editingPreset.id)) {
      toast.error('Only built-in presets can be reset.')
      return
    }
    setDialog('reset')
  }

  function confirmResetTheme() {
    if (!editingPreset) return
    const builtIn = ANVL_PRESETS.find((p) => p.id === editingPreset.id)
    if (!builtIn) return
    updatePreset(() => ({ ...builtIn }))
    setDialog(null)
    toast.success(`Reset “${editingPreset.name}.”`)
  }

  function requestRemoveTheme() {
    if (library.themes.length <= 1) {
      toast.error('Keep at least one theme.')
      return
    }
    if (!editingPreset) return
    setDialog('delete')
  }

  function confirmRemoveTheme() {
    if (!editingPreset) return
    setLibrary((prev) => {
      const themes = prev.themes.filter((t) => t.id !== editingPreset.id)
      const activeThemeId =
        prev.activeThemeId === editingPreset.id ? themes[0].id : prev.activeThemeId
      return { ...prev, activeThemeId, themes }
    })
    setEditingId(library.themes.find((t) => t.id !== editingPreset.id)?.id ?? '')
    setDialog(null)
    toast.success(`Deleted “${editingPreset.name}.” Save to make it permanent.`)
  }

  function setLiveTheme(themeId: string) {
    setLibrary((prev) => ({ ...prev, activeThemeId: themeId }))
    setEditingId(themeId)
  }

  if (!editingPreset) return null

  return (
    <div className="space-y-6" data-testid="site-theme-editor">
      <p className="text-sm text-[var(--color-text-muted)]">
        The Graphite &amp; Champagne house preset ships ready to use. Edit colors,
        validate contrast, add your own themes, and save to Supabase.
        {isDirty ? (
          <span className="ml-1 text-[var(--color-highlight)]">Unsaved changes.</span>
        ) : null}
      </p>

      <AdminWorkspace
        asideLabel="Theme preview and accessibility"
        aside={
          <SiteThemePreviewRail preset={editingPreset} onApplyFix={setPaletteField} />
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
              label="Live on storefront"
              value={library.activeThemeId}
              onChange={setLiveTheme}
              options={library.themes.map((t) => ({ value: t.id, label: t.name }))}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                density="compact"
                onClick={() => setDialog('new')}
                aria-label="New theme"
                title="New theme"
              >
                <Plus size={ICON_SIZE.md} />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                density="compact"
                onClick={duplicateTheme}
                aria-label="Duplicate theme"
                title="Duplicate theme"
              >
                <Copy size={ICON_SIZE.md} />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                density="compact"
                onClick={requestResetTheme}
                aria-label="Reset to preset"
                title="Reset to brand preset"
              >
                <RotateCcw size={ICON_SIZE.md} />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                density="compact"
                onClick={requestRemoveTheme}
                aria-label="Delete theme"
                title="Delete theme"
              >
                <Trash2 size={ICON_SIZE.md} />
              </Button>
            </div>
          </div>

          {/* E4/E6 — make the editing-vs-live mental model explicit. */}
          {!editingIsLive ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2">
              <p className="text-xs text-[var(--color-text-muted)]" role="status">
                Editing:{' '}
                <span className="font-medium text-[var(--color-text)]">
                  {editingPreset.name}
                </span>{' '}
                — not the live theme. Storefront visitors see “
                {library.themes.find((t) => t.id === library.activeThemeId)?.name}.”
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                density="compact"
                onClick={() => setLiveTheme(editingPreset.id)}
              >
                Make this the live theme
              </Button>
            </div>
          ) : null}

          {editingPreset.recommended ? (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-accent)]">
              <Sparkles size={ICON_SIZE.xs} /> Recommended for Drop 01
            </p>
          ) : null}

          <FormField label="Theme name" labelStyle="stacked">
            <Input
              density="compact"
              value={editingPreset.name}
              onChange={(e) =>
                updatePreset((preset) => ({ ...preset, name: e.target.value }))
              }
            />
          </FormField>

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

      <AdminPromptDialog
        open={dialog === 'new'}
        onClose={() => setDialog(null)}
        title="New theme"
        description="Starts from the brand defaults for the chosen appearance."
        inputLabel="Theme name"
        placeholder="e.g. Midnight Bronze"
        defaultValue="New theme"
        extraLabel="Appearance"
        extraOptions={[
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
        ]}
        confirmLabel="Create theme"
        onConfirm={confirmAddTheme}
      />

      <AdminConfirmDialog
        open={dialog === 'reset'}
        onClose={() => setDialog(null)}
        title="Reset theme?"
        confirmLabel="Reset"
        confirmVariant="destructive"
        onConfirm={confirmResetTheme}
      >
        Reset “{editingPreset.name}” to its brand defaults? Your color edits on
        this preset are discarded.
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={dialog === 'delete'}
        onClose={() => setDialog(null)}
        title="Delete theme?"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={confirmRemoveTheme}
      >
        Delete “{editingPreset.name}”?{' '}
        {editingIsLive
          ? 'It is the live storefront theme — the first remaining theme goes live instead.'
          : 'This cannot be undone after you save.'}
      </AdminConfirmDialog>
    </div>
  )
}
