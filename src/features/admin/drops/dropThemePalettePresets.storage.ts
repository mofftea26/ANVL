import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'
import type { SavedDropThemePalettePresetRow } from '@/features/admin/drops/dropThemePalettePresets.persistence.zod'
import { savedDropThemePalettePresetsSchema } from '@/features/admin/drops/dropThemePalettePresets.persistence.zod'
import { createJsonStore } from '@/shared/lib/storage/createJsonStore'
import { createLocalStorageChannel } from '@/shared/lib/storage/createLocalStorageChannel'

export const DROP_THEME_PALETTE_PRESETS_CHANGE_EVENT =
  'anvl:drop-theme-palette-presets:change'

const palettePresetsChannel = createLocalStorageChannel({
  key: ADMIN_STORAGE_KEYS.dropThemePalettePresets,
  changeEvent: DROP_THEME_PALETTE_PRESETS_CHANGE_EVENT,
})

/** Zod-validated `{ id, label, tokens, createdAt }[]` for saved campaign palettes. */
export const dropThemePalettePresetsStore = createJsonStore({
  channel: palettePresetsChannel,
  schema: savedDropThemePalettePresetsSchema,
})

export type PresetMergeItem =
  | { kind: 'builtin'; id: string; label: string }
  | { kind: 'saved'; id: string; label: string }

/**
 * Ordered AdminSelect rows: built-ins first (by `DROP_THEME_PRESETS` order),
 * then saved presets with `user-…` ids, excluding duplicates of built-in ids.
 */
export function mergeBuiltinAndSavedPalettePresetItems(params: {
  builtin: readonly { id: string; name: string }[]
  saved: SavedDropThemePalettePresetRow[]
}): PresetMergeItem[] {
  const builtin = params.builtin.map((b) => ({
    kind: 'builtin' as const,
    id: b.id,
    label: b.name,
  }))
  const builtinIds = new Set(builtin.map((b) => b.id))
  const saved = params.saved
    .filter((r) => r.id.startsWith('user-') && !builtinIds.has(r.id))
    .map((r) => ({
      kind: 'saved' as const,
      id: r.id,
      label: r.label,
    }))
  return [...builtin, ...saved]
}
