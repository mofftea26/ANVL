import { useState } from 'react'
import { ArrowDownUp, ChevronDown, ChevronUp, Plus, Trash2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import { makeSectionId } from '@/features/admin/components/SectionListField'
import {
  CARE_INSTRUCTION_PRESETS,
  findCarePresetByName,
  getCarePreset,
  type CareInstructionPreset,
} from '@/features/cms/support/carePresets'
import type { CareItem } from '@/features/cms/support/supportContent.zod'
import { CARE_ICON_COMPONENTS } from '@/features/support/components/careIcons'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'
import { Select, SelectItem } from '@/shared/components/ui/Select'

const CUSTOM_KEY = 'custom'

interface CareSelectorProps {
  items: CareItem[]
  onChange: (next: CareItem[]) => void
}

function blankItem(): CareItem {
  return { id: makeSectionId('care'), icon: 'generic', name: '', value: '', note: '' }
}

/** The preset a stored item re-opens as (matched by display name), if any. */
function presetForItem(item: CareItem): CareInstructionPreset | undefined {
  return findCarePresetByName(item.name)
}

/** True when applying `name`+`value` at `index` would duplicate another row. */
function wouldDuplicate(items: CareItem[], index: number, name: string, value: string): boolean {
  const nameKey = name.trim().toLowerCase()
  const valueKey = value.trim().toLowerCase()
  return items.some(
    (other, i) =>
      i !== index &&
      other.name.trim().toLowerCase() === nameKey &&
      other.value.trim().toLowerCase() === valueKey,
  )
}

/**
 * Structured care-instruction list editor: each row picks a preset from the
 * {@link CARE_INSTRUCTION_PRESETS} catalog (icon + name, keyboard typeahead in
 * the dropdown), reveals a contextual value input when the preset needs one
 * (wash temperature in °C, iron level), and carries an optional note. Rows
 * drag-reorder (with keyboard up/down fallback). The same instruction can
 * repeat only with a different value.
 */
export function CareSelector({ items, onChange }: CareSelectorProps) {
  const [dupeMessage, setDupeMessage] = useState<string | null>(null)

  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...items]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  const { getHandleProps, getItemProps, moveUp, moveDown } = useSortableList({
    length: items.length,
    onMove: move,
  })

  const patch = (index: number, patchValue: Partial<CareItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patchValue } : item)))
  const remove = (index: number) => {
    setDupeMessage(null)
    onChange(items.filter((_, i) => i !== index))
  }

  const setPreset = (index: number, presetKey: string) => {
    const item = items[index]
    if (!item) return
    if (presetKey === CUSTOM_KEY) {
      setDupeMessage(null)
      patch(index, { icon: 'generic' })
      return
    }
    const preset = getCarePreset(presetKey)
    if (!preset) return
    const nextValue = preset.needsValue ? item.value || preset.defaultValue || '' : ''
    if (wouldDuplicate(items, index, preset.name, nextValue)) {
      setDupeMessage(
        `"${preset.name}" is already in the list${preset.needsValue ? ' with that value — give it a different value first' : ''}.`,
      )
      return
    }
    setDupeMessage(null)
    patch(index, { icon: preset.icon, name: preset.name, value: nextValue })
  }

  const setValue = (index: number, value: string) => {
    const item = items[index]
    if (!item) return
    setDupeMessage(null)
    patch(index, { value })
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const preset = presetForItem(item)
        const selectValue = preset?.key ?? (item.name.trim() ? CUSTOM_KEY : '')
        const Icon = CARE_ICON_COMPONENTS[item.icon]
        return (
          <div
            key={item.id || index}
            {...getItemProps(index)}
            className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 data-[drag-over]:border-[var(--color-accent)]"
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                {...getHandleProps(index)}
                aria-label={`Drag to reorder instruction ${index + 1}`}
                className="focus-ring inline-flex cursor-grab items-center gap-1.5 rounded px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] active:cursor-grabbing"
              >
                <ArrowDownUp size={ICON_SIZE.sm} aria-hidden="true" />
                <Icon size={ICON_SIZE.sm} aria-hidden="true" />
                Instruction {index + 1}
              </button>
              <div className="flex items-center gap-1">
                <IconButton
                  type="button"
                  size="sm"
                  aria-label={`Move instruction ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => moveUp(index)}
                >
                  <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
                </IconButton>
                <IconButton
                  type="button"
                  size="sm"
                  aria-label={`Move instruction ${index + 1} down`}
                  disabled={index === items.length - 1}
                  onClick={() => moveDown(index)}
                >
                  <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
                </IconButton>
                <IconButton
                  type="button"
                  size="sm"
                  aria-label={`Remove instruction ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
                </IconButton>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Instruction" labelStyle="micro">
                <Select
                  aria-label={`Instruction ${index + 1} preset`}
                  density="compact"
                  value={selectValue}
                  onValueChange={(v) => setPreset(index, v)}
                  placeholder="Choose instruction…"
                  valueLabel={preset?.name ?? (item.name.trim() ? 'Custom instruction' : undefined)}
                >
                  {CARE_INSTRUCTION_PRESETS.map((p) => {
                    const PresetIcon = CARE_ICON_COMPONENTS[p.icon]
                    return (
                      <SelectItem key={p.key} value={p.key} density="compact">
                        <span className="flex items-center gap-2">
                          <PresetIcon size={ICON_SIZE.sm} aria-hidden="true" />
                          {p.name}
                        </span>
                      </SelectItem>
                    )
                  })}
                  <SelectItem value={CUSTOM_KEY} density="compact">
                    Custom instruction
                  </SelectItem>
                </Select>
              </FormField>

              {preset?.needsValue ? (
                <FormField
                  label={preset.needsValue === 'temperature' ? 'Temperature (°C)' : 'Level'}
                  labelStyle="micro"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      density="compact"
                      inputMode={preset.needsValue === 'temperature' ? 'decimal' : undefined}
                      placeholder={preset.defaultValue ?? (preset.needsValue === 'temperature' ? '30' : 'low')}
                      value={item.value}
                      onChange={(e) => setValue(index, e.target.value)}
                      aria-label={`Instruction ${index + 1} ${preset.needsValue === 'temperature' ? 'temperature in degrees Celsius' : 'level'}`}
                    />
                    {preset.needsValue === 'temperature' ? (
                      <span aria-hidden="true" className="shrink-0 text-xs text-[var(--color-text-muted)]">
                        °C
                      </span>
                    ) : null}
                  </div>
                </FormField>
              ) : null}

              {!preset ? (
                <FormField label="Custom text" labelStyle="micro">
                  <Input
                    density="compact"
                    placeholder="e.g. Reshape while damp"
                    value={item.name}
                    onChange={(e) => {
                      setDupeMessage(null)
                      patch(index, { name: e.target.value })
                    }}
                    aria-label={`Instruction ${index + 1} custom text`}
                  />
                </FormField>
              ) : null}
            </div>

            <FormField label="Note" hint="Optional extra context shown under the instruction." labelStyle="micro">
              <Input
                density="compact"
                value={item.note}
                onChange={(e) => patch(index, { note: e.target.value })}
                aria-label={`Instruction ${index + 1} note`}
              />
            </FormField>
          </div>
        )
      })}

      {dupeMessage ? (
        <p role="alert" className="text-xs text-[color:var(--color-danger)]">
          {dupeMessage}
        </p>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        density="compact"
        onClick={() => {
          setDupeMessage(null)
          onChange([...items, blankItem()])
        }}
      >
        <Plus size={ICON_SIZE.sm} aria-hidden="true" />
        Add instruction
      </Button>
    </div>
  )
}
