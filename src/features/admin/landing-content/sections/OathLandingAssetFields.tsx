import { useMemo } from 'react'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import {
  type AssetSlotSection,
} from '@/features/admin/site-assets/AssetSlotAssignmentPanel'
import type { MediaPickerKind } from '@/features/admin/media/mediaPickerKind.types'
import { OATH_ASSET_SLOTS } from '@/features/landingPages/pages/TheOathLanding/theOathAssetSlots'
import type { AssetSlotDefinition } from '@/features/landingPages/assetSlots'
import { ContentSection } from './ContentSection'

export type LandingPageAssetAssignments = Record<string, string>

function buildSlotSections(
  slots: typeof OATH_ASSET_SLOTS,
): AssetSlotSection[] {
  const sections: AssetSlotSection[] = []
  for (const slot of slots) {
    const title = slot.section ?? null
    const last = sections[sections.length - 1]
    if (last && last.title === title) {
      last.slots.push(slot)
    } else {
      sections.push({ title, slots: [slot] })
    }
  }
  return sections
}

function slotKindToPickerKind(slot: AssetSlotDefinition): MediaPickerKind {
  if (slot.kind === 'video') return 'video'
  if (slot.kind === 'image' || slot.kind === 'svg') return 'image'
  return 'any'
}

/**
 * Non-tenet landing asset slots — writes to the same `asset_config.drops` map
 * as the Assets admin page (bidirectional sync).
 */
export function OathLandingAssetFields({
  assignments,
  onAssignmentChange,
}: {
  assignments: LandingPageAssetAssignments
  onAssignmentChange: (slotKey: string, mediaId: string) => void
}) {
  const mediaQuery = useMediaAssetsQuery()
  const mediaAssets = mediaQuery.data ?? []

  const slots = useMemo(() => {
    const value = (key: string) => assignments[key] ?? ''
    return OATH_ASSET_SLOTS.filter((slot) => {
      if (!slot.visibleWhen) return true
      const current = value(slot.visibleWhen.key) || 'video'
      return current === slot.visibleWhen.equals
    })
  }, [assignments])

  const slotSections = useMemo(() => buildSlotSections(slots), [slots])

  return (
    <ContentSection
      title="Scene media"
      hint="Assign hero, creed, and product renders here or in Assets — both surfaces share the same slot map."
    >
      {slotSections.map((section, sectionIndex) => (
        <div
          key={section.title ?? `section-${sectionIndex}`}
          className="space-y-4 sm:col-span-2"
        >
          {section.title ? (
            <h3 className="anvl-heading text-sm font-normal text-[var(--color-heading)]">
              {section.title}
            </h3>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {section.slots.map((slot) =>
              slot.kind === 'select' ? (
                <AdminFieldSelect
                  key={slot.key}
                  label={slot.label}
                  value={assignments[slot.key] || slot.options?.[0]?.value || ''}
                  onChange={(value) => onAssignmentChange(slot.key, value)}
                  options={slot.options ?? []}
                  hint={slot.hint}
                />
              ) : (
                <MediaLibrarySlotField
                  key={slot.key}
                  label={slot.label}
                  hint={slot.hint}
                  mediaId={assignments[slot.key] ?? ''}
                  kind={slotKindToPickerKind(slot)}
                  assets={mediaAssets}
                  onMediaIdChange={(mediaId) => onAssignmentChange(slot.key, mediaId)}
                />
              ),
            )}
          </div>
        </div>
      ))}
    </ContentSection>
  )
}
