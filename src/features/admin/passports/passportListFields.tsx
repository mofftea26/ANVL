import { useEffect, useState, type ReactNode } from 'react'
import { ArrowDownUp, ChevronDown, ChevronUp, Plus, Trash2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import {
  useSortableList,
  type SortableHandleProps,
  type SortableItemProps,
} from '@/features/admin/hooks/useSortableList'
import { Button } from '@/shared/components/ui/Button'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'

/**
 * Inline add/edit/delete/reorder list editors for the passport content tabs —
 * the structured replacements for the old "one per line" textareas. Kept local
 * to the passports feature (a shared `StringListField` is owned by a separate
 * workstream). All are fully controlled by their parent draft; reorder uses the
 * shared {@link useSortableList} (native DnD + keyboard up/down fallback).
 */

/** Drag handle + up/down + delete controls shared by every row below. */
function SortableRow({
  index,
  total,
  label,
  getHandleProps,
  getItemProps,
  moveUp,
  moveDown,
  onRemove,
  children,
}: {
  index: number
  total: number
  label: string
  getHandleProps: (i: number) => SortableHandleProps
  getItemProps: (i: number) => SortableItemProps
  moveUp: (i: number) => void
  moveDown: (i: number) => void
  onRemove: (i: number) => void
  children: ReactNode
}) {
  return (
    <div
      {...getItemProps(index)}
      className="space-y-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-3 data-[drag-over]:border-[var(--color-accent)]"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          {...getHandleProps(index)}
          aria-label={`Drag to reorder ${label} ${index + 1}`}
          className="focus-ring inline-flex cursor-grab items-center gap-1.5 rounded px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] active:cursor-grabbing"
        >
          <ArrowDownUp size={ICON_SIZE.sm} aria-hidden="true" />
          {label} {index + 1}
        </button>
        <div className="flex items-center gap-1">
          <IconButton
            type="button"
            size="sm"
            aria-label={`Move ${label} ${index + 1} up`}
            disabled={index === 0}
            onClick={() => moveUp(index)}
          >
            <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
          </IconButton>
          <IconButton
            type="button"
            size="sm"
            aria-label={`Move ${label} ${index + 1} down`}
            disabled={index === total - 1}
            onClick={() => moveDown(index)}
          >
            <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
          </IconButton>
          <IconButton
            type="button"
            size="sm"
            aria-label={`Remove ${label} ${index + 1}`}
            onClick={() => onRemove(index)}
          >
            <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
          </IconButton>
        </div>
      </div>
      {children}
    </div>
  )
}

/** Single-value string rows — e.g. design facts (was a newline textarea). */
export function StringRowsField({
  values,
  onChange,
  label = 'Item',
  addLabel = 'Add item',
  placeholder,
}: {
  values: string[]
  onChange: (next: string[]) => void
  label?: string
  addLabel?: string
  placeholder?: string
}) {
  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...values]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  const { getHandleProps, getItemProps, moveUp, moveDown } = useSortableList({
    length: values.length,
    onMove: move,
  })

  return (
    <div className="space-y-3">
      {values.map((value, index) => (
        <SortableRow
          key={index}
          index={index}
          total={values.length}
          label={label}
          getHandleProps={getHandleProps}
          getItemProps={getItemProps}
          moveUp={moveUp}
          moveDown={moveDown}
          onRemove={(i) => onChange(values.filter((_, j) => j !== i))}
        >
          <Input
            density="compact"
            aria-label={`${label} ${index + 1}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) =>
              onChange(values.map((v, i) => (i === index ? e.target.value : v)))
            }
          />
        </SortableRow>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        density="compact"
        onClick={() => onChange([...values, ''])}
      >
        <Plus size={ICON_SIZE.sm} aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  )
}

/**
 * Two-column "Label | Value" rows serialized to `"Label|Value"` strings — e.g.
 * the fit measurements list. The stored shape (an array of `Label|Value`
 * strings) is unchanged; only the authoring UI moved off the textarea.
 */
export function LabelValueRowsField({
  values,
  onChange,
  label = 'Row',
  addLabel = 'Add row',
  labelPlaceholder = 'Label',
  valuePlaceholder = 'Value',
}: {
  values: string[]
  onChange: (next: string[]) => void
  label?: string
  addLabel?: string
  labelPlaceholder?: string
  valuePlaceholder?: string
}) {
  const parse = (line: string): { label: string; value: string } => {
    const [head, ...rest] = line.split('|')
    return { label: head ?? '', value: rest.join('|') }
  }
  const serialize = (label: string, value: string) => `${label}|${value}`

  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...values]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  const { getHandleProps, getItemProps, moveUp, moveDown } = useSortableList({
    length: values.length,
    onMove: move,
  })

  const patchRow = (index: number, key: 'label' | 'value', v: string) => {
    onChange(
      values.map((line, i) => {
        if (i !== index) return line
        const parsed = parse(line)
        return key === 'label' ? serialize(v, parsed.value) : serialize(parsed.label, v)
      }),
    )
  }

  return (
    <div className="space-y-3">
      {values.map((line, index) => {
        const parsed = parse(line)
        return (
          <SortableRow
            key={index}
            index={index}
            total={values.length}
            label={label}
            getHandleProps={getHandleProps}
            getItemProps={getItemProps}
            moveUp={moveUp}
            moveDown={moveDown}
            onRemove={(i) => onChange(values.filter((_, j) => j !== i))}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                density="compact"
                aria-label={`${label} ${index + 1} ${labelPlaceholder}`}
                placeholder={labelPlaceholder}
                value={parsed.label}
                onChange={(e) => patchRow(index, 'label', e.target.value)}
              />
              <Input
                density="compact"
                aria-label={`${label} ${index + 1} ${valuePlaceholder}`}
                placeholder={valuePlaceholder}
                value={parsed.value}
                onChange={(e) => patchRow(index, 'value', e.target.value)}
              />
            </div>
          </SortableRow>
        )
      })}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        density="compact"
        onClick={() => onChange([...values, '|'])}
      >
        <Plus size={ICON_SIZE.sm} aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  )
}

/**
 * Care ritual steps as paired rows — each row is a numbered step plus its
 * optional "why" note, kept index-aligned. Reads/writes the two parallel
 * arrays (`steps`, `notes`) the storefront already consumes.
 */
export function CareStepsField({
  steps,
  notes,
  onChange,
}: {
  steps: string[]
  notes: string[]
  onChange: (next: { steps: string[]; notes: string[] }) => void
}) {
  const move = (from: number, to: number) => {
    if (from === to) return
    const nextSteps = [...steps]
    const [s] = nextSteps.splice(from, 1)
    nextSteps.splice(to, 0, s)
    // Notes may be shorter than steps — pad so the moved note tracks its step.
    const padded = steps.map((_, i) => notes[i] ?? '')
    const [n] = padded.splice(from, 1)
    padded.splice(to, 0, n)
    onChange({ steps: nextSteps, notes: padded })
  }
  const { getHandleProps, getItemProps, moveUp, moveDown } = useSortableList({
    length: steps.length,
    onMove: move,
  })

  const patchStep = (index: number, value: string) =>
    onChange({ steps: steps.map((s, i) => (i === index ? value : s)), notes })
  const patchNote = (index: number, value: string) => {
    const padded = steps.map((_, i) => notes[i] ?? '')
    padded[index] = value
    onChange({ steps, notes: padded })
  }
  const remove = (index: number) =>
    onChange({
      steps: steps.filter((_, i) => i !== index),
      notes: steps.map((_, i) => notes[i] ?? '').filter((_, i) => i !== index),
    })
  const add = () => onChange({ steps: [...steps, ''], notes: [...notes, ''] })

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <SortableRow
          key={index}
          index={index}
          total={steps.length}
          label="Step"
          getHandleProps={getHandleProps}
          getItemProps={getItemProps}
          moveUp={moveUp}
          moveDown={moveDown}
          onRemove={remove}
        >
          <Input
            density="compact"
            aria-label={`Step ${index + 1}`}
            placeholder="Care step"
            value={step}
            onChange={(e) => patchStep(index, e.target.value)}
          />
          <Input
            density="compact"
            aria-label={`Step ${index + 1} note`}
            placeholder="Why (optional — shown when the step is expanded)"
            value={notes[index] ?? ''}
            onChange={(e) => patchNote(index, e.target.value)}
          />
        </SortableRow>
      ))}
      <Button type="button" variant="secondary" size="sm" density="compact" onClick={add}>
        <Plus size={ICON_SIZE.sm} aria-hidden="true" />
        Add step
      </Button>
    </div>
  )
}

/**
 * The size-equivalence map (this product's size → a canonical body size) as
 * add/edit/delete rows. A record has no inherent order, so rows are held in
 * local state (seeded from the record, reseeded when `resetKey` — the product
 * slug — changes) and the record is rebuilt on every edit.
 */
export function SizeMapRowsField({
  value,
  onChange,
  resetKey,
}: {
  value: Record<string, string>
  onChange: (next: Record<string, string>) => void
  /** Reseed local rows when this changes (e.g. the selected product slug). */
  resetKey: string
}) {
  const [rows, setRows] = useState<Array<{ size: string; canonical: string }>>(() =>
    Object.entries(value).map(([size, canonical]) => ({ size, canonical })),
  )

  useEffect(() => {
    setRows(Object.entries(value).map(([size, canonical]) => ({ size, canonical })))
    // Reseed only on product change — editing must not clobber in-progress rows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const push = (next: Array<{ size: string; canonical: string }>) => {
    setRows(next)
    const record: Record<string, string> = {}
    for (const { size, canonical } of next) {
      const s = size.trim()
      const c = canonical.trim()
      if (s && c) record[s] = c
    }
    onChange(record)
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <Input
            density="compact"
            aria-label={`Size ${index + 1}`}
            placeholder="This size (e.g. M)"
            value={row.size}
            onChange={(e) =>
              push(rows.map((r, i) => (i === index ? { ...r, size: e.target.value } : r)))
            }
          />
          <Input
            density="compact"
            aria-label={`Canonical body size ${index + 1}`}
            placeholder="Canonical body size (e.g. S)"
            value={row.canonical}
            onChange={(e) =>
              push(rows.map((r, i) => (i === index ? { ...r, canonical: e.target.value } : r)))
            }
          />
          <IconButton
            type="button"
            size="sm"
            aria-label={`Remove size mapping ${index + 1}`}
            onClick={() => push(rows.filter((_, i) => i !== index))}
          >
            <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
          </IconButton>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        density="compact"
        onClick={() => push([...rows, { size: '', canonical: '' }])}
      >
        <Plus size={ICON_SIZE.sm} aria-hidden="true" />
        Add size mapping
      </Button>
    </div>
  )
}
