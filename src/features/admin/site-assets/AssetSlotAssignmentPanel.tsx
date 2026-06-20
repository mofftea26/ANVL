import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import type { AssetSlotDefinition } from '@/features/landingPages/assetSlots'

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
}: AssetSlotAssignmentPanelProps) {
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
                {section.slots.map((slot) => (
                  <div key={slot.key} className="space-y-1.5">
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
                          ...mediaAssets.map((asset) => ({
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
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminRailPanel>
  )
}
