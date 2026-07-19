import { useMemo } from 'react'

import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import type { MediaPickerKind } from '@/features/admin/media/mediaPickerKind.types'
import type {
  AssetSlotDefinition,
  AssetSlotKind,
} from '@/features/landingPages/assetSlots'

/** SVG slots want image files; 'select' slots never reach the media list. */
function slotMediaKind(kind: AssetSlotKind): MediaPickerKind {
  if (kind === 'svg') return 'image'
  if (kind === 'image' || kind === 'video' || kind === 'model') return kind
  return 'any'
}

interface SetupAssetSlotFieldsProps {
  /** Code-defined slots for the scope being edited (drop or storefront page). */
  slots: AssetSlotDefinition[]
  /** Current slot → media-id assignments from the step's working copy. */
  assignments: Record<string, string>
  onSlotChange: (slotKey: string, mediaId: string) => void
}

/**
 * Inline asset-slot grid for the setup wizards — the same code-defined slots
 * the Assets editor manages (`SiteAssetsEditor.setSlot` contract), rendered as
 * full `MediaLibrarySlotField`s (picker modal + drag-drop) with `select` slots
 * as dropdowns. Honors `visibleWhen` so mode-dependent slots (e.g. the Oath
 * hero media type) appear and disappear exactly like the real editor.
 */
export function SetupAssetSlotFields({
  slots,
  assignments,
  onSlotChange,
}: SetupAssetSlotFieldsProps) {
  const mediaQuery = useMediaAssetsQuery()
  const mediaAssets = mediaQuery.data ?? []

  const value = (key: string): string => assignments[key] ?? ''

  const visibleSlots = slots.filter((slot) => {
    if (!slot.visibleWhen) return true
    // Default the controlling select to its first option so visibility matches
    // what the select displays before any assignment exists.
    const controller = slots.find((s) => s.key === slot.visibleWhen?.key)
    const current =
      value(slot.visibleWhen.key) || controller?.options?.[0]?.value || 'video'
    return current === slot.visibleWhen.equals
  })

  const sections = useMemo(() => {
    const out: { title: string | null; slots: AssetSlotDefinition[] }[] = []
    for (const slot of visibleSlots) {
      const title = slot.section ?? null
      const last = out[out.length - 1]
      if (last && last.title === title) last.slots.push(slot)
      else out.push({ title, slots: [slot] })
    }
    return out
  }, [visibleSlots])

  if (slots.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        This scope defines no asset slots.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {sections.map((section, sectionIndex) => (
        <div key={section.title ?? `section-${sectionIndex}`} className="space-y-3">
          {section.title ? (
            <h3 className="anvl-heading text-sm font-normal text-[var(--color-heading)]">
              {section.title}
            </h3>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            {section.slots.map((slot) =>
              slot.kind === 'select' ? (
                <AdminFieldSelect
                  key={slot.key}
                  label={slot.label}
                  hint={slot.hint}
                  value={value(slot.key) || slot.options?.[0]?.value || ''}
                  onChange={(next) => onSlotChange(slot.key, next)}
                  options={slot.options ?? []}
                />
              ) : (
                <MediaLibrarySlotField
                  key={slot.key}
                  label={slot.label}
                  hint={slot.hint}
                  mediaId={value(slot.key)}
                  onMediaIdChange={(mediaId) => onSlotChange(slot.key, mediaId)}
                  kind={slotMediaKind(slot.kind)}
                  assets={mediaAssets}
                />
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
