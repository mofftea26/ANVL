import { useEffect, useRef } from 'react'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { matchesMediaKind } from '@/features/admin/media/filterMediaLibraryItems'
import { hasDraggedMedia, readDraggedMediaId } from '@/features/admin/media/mediaDrag'
import type { MediaPickerKind } from '@/features/admin/media/mediaPickerKind.types'
import type { AssetSlotDefinition, AssetSlotKind } from '@/features/landingPages/assetSlots'
import { cn } from '@/shared/lib/cn'

export const ASSET_SLOT_UNASSIGNED = '__unassigned__'

export type AssetSlotSection = {
  title: string | null
  slots: AssetSlotDefinition[]
}

export type AssetScopeOption = {
  value: string
  label: string
}

export type AssetSlotMediaOption = {
  id: string
  filename: string
  mime: string
}

/** SVG slots want image files; 'select' slots never reach the media list. */
function slotMediaKind(kind: AssetSlotKind): MediaPickerKind {
  if (kind === 'svg') return 'image'
  if (kind === 'image' || kind === 'video' || kind === 'model') return kind
  return 'any'
}

export interface AssetSlotAssignmentPanelProps {
  scope: string
  onScopeChange: (scope: string) => void
  scopeOptions: AssetScopeOption[]
  slotSections: AssetSlotSection[]
  assignments: Record<string, string>
  assignmentValue: (key: string) => string
  onSlotChange: (slotKey: string, mediaId: string) => void
  mediaAssets: AssetSlotMediaOption[]
  /** Slot to scroll into view + highlight (deep link from other editors). */
  focusSlotKey?: string
}

/**
 * Slot assignment controls for the Assets editor — scope picker plus every
 * code-defined slot for the active scope. Intended for the {@link AdminWorkspace}
 * side rail on wide screens; stacks below the media library on smaller widths.
 */
export function AssetSlotAssignmentPanel({
  scope,
  onScopeChange,
  scopeOptions,
  slotSections,
  assignments,
  assignmentValue,
  onSlotChange,
  mediaAssets,
  focusSlotKey,
}: AssetSlotAssignmentPanelProps) {
  const focusRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!focusSlotKey) return
    focusRef.current?.scrollIntoView({ block: 'center' })
  }, [focusSlotKey])

  return (
    <AdminRailPanel
      title="Slot assignments"
      description="Map uploaded media to code-defined slots. Unassigned slots use built-in fallbacks."
      testId="asset-slot-assignment-panel"
    >
      <div className="space-y-5">
        <AdminFieldSelect
          label="Scope"
          value={scope}
          onChange={onScopeChange}
          options={scopeOptions}
        />

        <div className="space-y-5">
          {slotSections.map((section, sectionIndex) => (
            <div key={section.title ?? `section-${sectionIndex}`} className="space-y-3">
              {section.title ? (
                <h3 className="anvl-heading text-sm font-normal text-[var(--color-heading)]">
                  {section.title}
                </h3>
              ) : null}
              <div className="space-y-4">
                {section.slots.map((slot) => {
                  const currentId = assignments[slot.key]
                  const kindMatches = mediaAssets.filter((asset) =>
                    matchesMediaKind(asset.mime, slotMediaKind(slot.kind)),
                  )
                  // Always keep an already-assigned asset selectable even if it
                  // no longer matches the slot's kind (avoids silently orphaning
                  // a valid, older assignment when filtering was tightened).
                  const current = currentId ? mediaAssets.find((a) => a.id === currentId) : undefined
                  const mediaOptions =
                    current && !kindMatches.some((a) => a.id === current.id)
                      ? [current, ...kindMatches]
                      : kindMatches

                  const isFocused = focusSlotKey === slot.key
                  const acceptsDrop = slot.kind !== 'select'

                  return (
                  <div
                    key={slot.key}
                    ref={isFocused ? focusRef : undefined}
                    onDragOver={
                      acceptsDrop
                        ? (e) => {
                            if (!hasDraggedMedia(e.dataTransfer)) return
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'copy'
                            e.currentTarget.setAttribute('data-drag-over', '')
                          }
                        : undefined
                    }
                    onDragLeave={
                      acceptsDrop
                        ? (e) => e.currentTarget.removeAttribute('data-drag-over')
                        : undefined
                    }
                    onDrop={
                      acceptsDrop
                        ? (e) => {
                            if (!hasDraggedMedia(e.dataTransfer)) return
                            e.preventDefault()
                            e.currentTarget.removeAttribute('data-drag-over')
                            const id = readDraggedMediaId(e.dataTransfer)
                            if (id) onSlotChange(slot.key, id)
                          }
                        : undefined
                    }
                    className={cn(
                      'space-y-1.5 rounded-lg transition-shadow data-[drag-over]:shadow-[0_0_0_2px_var(--color-accent)]',
                      isFocused &&
                        'p-2 -m-2 shadow-[0_0_0_1.5px_var(--color-accent)]',
                    )}
                  >
                    {slot.kind === 'select' ? (
                      <AdminFieldSelect
                        label={slot.label}
                        value={assignmentValue(slot.key) || slot.options?.[0]?.value || ''}
                        onChange={(value) => onSlotChange(slot.key, value)}
                        options={slot.options ?? []}
                      />
                    ) : (
                      <AdminFieldSelect
                        label={slot.label}
                        value={
                          assignments[slot.key]
                            ? assignments[slot.key]
                            : ASSET_SLOT_UNASSIGNED
                        }
                        onChange={(value) =>
                          onSlotChange(
                            slot.key,
                            value === ASSET_SLOT_UNASSIGNED ? '' : value,
                          )
                        }
                        options={[
                          { value: ASSET_SLOT_UNASSIGNED, label: '— Not assigned —' },
                          ...mediaOptions.map((asset) => ({
                            value: asset.id,
                            label: asset.filename,
                          })),
                        ]}
                      />
                    )}
                    {slot.hint ? (
                      <p className="text-xs leading-snug text-[var(--color-text-muted)]">
                        {slot.hint}
                      </p>
                    ) : null}
                  </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminRailPanel>
  )
}
