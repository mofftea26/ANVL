import { useEffect, useMemo, useState } from 'react'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminInput } from '@/features/admin/components/AdminInput'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from '@/features/admin/components/AdminSelect'
import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import { DROP_THEME_PRESETS } from '@/features/admin/drops/drops.presets'
import { DebouncedColorField } from '@/features/admin/drops/DebouncedColorField'
import {
  dropThemePalettePresetsStore,
  mergeBuiltinAndSavedPalettePresetItems,
} from '@/features/admin/drops/dropThemePalettePresets.storage'
import type { SavedDropThemePalettePresetRow } from '@/features/admin/drops/dropThemePalettePresets.persistence.zod'
import type { DropThemePalette } from '@/features/drops/theme/dropThemePalette.types'
import { Modal } from '@/shared/components/ui/Modal'
import { isValidColor, parseColor, rgbaToCss } from '@/shared/lib/color'
import { cn } from '@/shared/lib/cn'
import { toast } from 'sonner'

/** Radix Select requires a non-empty `value`; maps to legacy empty native `<option value="">`. */
const CUSTOM_PALETTE_SELECT_VALUE = '__custom__'

type Props = {
  theme: DropThemePalette
  onThemeChange: (next: DropThemePalette) => void
  onApplyPreset: (presetId: string) => void
  savedTheme: DropThemePalette
}

function themeFingerprint(t: DropThemePalette): string {
  return JSON.stringify({
    id: t.id,
    name: t.name,
    colors: t.colors,
  })
}

function MiniSwatch({ color }: { color: string | undefined }) {
  const css = useMemo(() => {
    if (!color?.trim()) return 'transparent'
    const p = parseColor(color)
    return p ? rgbaToCss(p) : 'transparent'
  }, [color])
  const ok = Boolean(color?.trim() && isValidColor(color))
  return (
    <span
      className={cn(
        'h-8 flex-1 min-w-[2rem] rounded-md border border-[var(--color-line)]',
        !ok &&
          'bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,.06)_4px,rgba(255,255,255,.06)_8px)]',
      )}
      style={{ backgroundColor: ok ? css : undefined }}
      title={color?.trim() ? color : 'unset'}
    />
  )
}

export function DropThemePaletteCard({
  theme,
  onThemeChange,
  onApplyPreset,
  savedTheme,
}: Props) {
  const [savedRows, setSavedRows] = useState<SavedDropThemePalettePresetRow[]>(
    () => dropThemePalettePresetsStore.read() ?? [],
  )
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveLabelDraft, setSaveLabelDraft] = useState('')

  useEffect(() => {
    return dropThemePalettePresetsStore.subscribe(() => {
      setSavedRows(dropThemePalettePresetsStore.read() ?? [])
    })
  }, [])

  const mergeItems = useMemo(
    () =>
      mergeBuiltinAndSavedPalettePresetItems({
        builtin: DROP_THEME_PRESETS,
        saved: savedRows,
      }),
    [savedRows],
  )

  const presetSelectValue = useMemo(() => {
    if (DROP_THEME_PRESETS.some((p) => p.id === theme.id)) return theme.id
    if (savedRows.some((r) => r.id === theme.id)) return theme.id
    return CUSTOM_PALETTE_SELECT_VALUE
  }, [savedRows, theme.id])

  const isDirty = themeFingerprint(theme) !== themeFingerprint(savedTheme)

  const colorEntries = Object.entries(theme.colors) as Array<
    [keyof DropThemePalette['colors'], string | undefined]
  >

  function revertPalette() {
    onThemeChange(structuredClone(savedTheme))
    toast.message('Palette reverted to last saved drop state.')
  }

  function copyPaletteJson() {
    void navigator.clipboard?.writeText(JSON.stringify(theme, null, 2)).then(
      () => toast.success('Palette JSON copied.'),
      () => toast.error('Clipboard unavailable.'),
    )
  }

  function openSavePreset() {
    setSaveLabelDraft(theme.name?.trim() || 'My palette')
    setSaveModalOpen(true)
  }

  function commitSavePreset() {
    const label = saveLabelDraft.trim()
    if (!label) {
      toast.error('Enter a preset name.')
      return
    }
    const id = `user-${createCmsId('palette')}`
    const row: SavedDropThemePalettePresetRow = {
      id,
      label,
      tokens: { ...structuredClone(theme), id, name: label },
      createdAt: new Date().toISOString(),
    }
    const prev = dropThemePalettePresetsStore.read() ?? []
    dropThemePalettePresetsStore.write([...prev, row])
    setSaveModalOpen(false)
    toast.success('Preset saved to this browser.')
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/35 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
      <Modal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save palette preset"
        aria-describedby="save-palette-preset-desc"
      >
        <p id="save-palette-preset-desc" className="text-xs text-[var(--color-text-muted)]">
          Stored only in local storage on this device ({' '}
          <span className="font-mono text-[10px]">ANVL_DROP_THEME_PALETTE_PRESETS</span>).
        </p>
        <label className="mt-4 block text-xs text-[var(--color-text-muted)]">
          Preset label
          <AdminInput
            autoFocus
            value={saveLabelDraft}
            onChange={(e) => setSaveLabelDraft(e.target.value)}
            placeholder="e.g. Neon steel"
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <AdminButton type="button" variant="ghost" size="sm" onClick={() => setSaveModalOpen(false)}>
            Cancel
          </AdminButton>
          <AdminButton type="button" variant="secondary" size="sm" onClick={commitSavePreset}>
            Save preset
          </AdminButton>
        </div>
      </Modal>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-line)]/80 bg-[var(--color-bg)]/40 px-4 py-4 sm:px-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-heading)]">
            Campaign palette
          </p>
          <p className="max-w-prose text-xs leading-relaxed text-[var(--color-text-muted)]">
            Tokens paint the drop landing preview. Changes stay in this draft until you{' '}
            <span className="text-[var(--color-text)]">Save drop</span> — copy JSON, revert
            mistakes, or save presets for this browser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={!isDirty}
            onClick={revertPalette}
          >
            Revert palette
          </AdminButton>
          <AdminButton type="button" variant="ghost" size="sm" onClick={openSavePreset}>
            Save as preset
          </AdminButton>
          <AdminButton type="button" variant="ghost" size="sm" onClick={copyPaletteJson}>
            Copy JSON
          </AdminButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-4 pt-4 sm:px-5">
        {colorEntries.map(([key, val]) => (
          <MiniSwatch key={key} color={val} />
        ))}
      </div>

      <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-5">
        <AdminSelect
          value={presetSelectValue}
          onValueChange={(v) => {
            if (v === CUSTOM_PALETTE_SELECT_VALUE) return
            const builtin = DROP_THEME_PRESETS.find((p) => p.id === v)
            if (builtin) {
              onApplyPreset(builtin.id)
              return
            }
            const row = savedRows.find((r) => r.id === v)
            if (row) onThemeChange(structuredClone(row.tokens))
          }}
        >
          <AdminSelectTrigger label="Preset" aria-label="Theme preset">
            <AdminSelectValue placeholder="Preset" />
          </AdminSelectTrigger>
          <AdminSelectContent>
            <AdminSelectItem value={CUSTOM_PALETTE_SELECT_VALUE}>
              Custom palette
            </AdminSelectItem>
            {mergeItems.map((item) => (
              <AdminSelectItem key={item.id} value={item.id}>
                {item.kind === 'builtin' ? item.label : `${item.label} (saved)`}
              </AdminSelectItem>
            ))}
          </AdminSelectContent>
        </AdminSelect>
        <label className="text-xs text-[var(--color-text-muted)]">
          Palette label
          <AdminInput
            value={theme.name}
            onChange={(e) => onThemeChange({ ...theme, name: e.target.value })}
          />
        </label>
      </div>

      <div className="grid gap-4 px-4 pb-6 sm:grid-cols-2 sm:px-5">
        {colorEntries.map(([key, val]) => (
          <DebouncedColorField
            key={key}
            debounceMs={72}
            label={key.replace(/([A-Z])/g, ' $1').trim()}
            value={val}
            withAlpha
            onChange={(next: string) =>
              onThemeChange({
                ...theme,
                colors: { ...theme.colors, [key]: next },
              })
            }
          />
        ))}
      </div>
    </div>
  )
}
