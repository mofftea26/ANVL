import { ArrowDownUp, ChevronDown, ChevronUp, Plus, Trash2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import { Button } from '@/shared/components/ui/Button'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'

interface StringListFieldProps {
  /** The current list — one single-line string per row. */
  items: string[]
  onChange: (next: string[]) => void
  /** Label for the "add" button (e.g. "Add line"). */
  addLabel?: string
  /** Placeholder for each row's text input. */
  placeholder?: string
  /** Singular noun for a row, used in aria-labels (e.g. "line"). */
  itemLabel?: string
  /** Optional cap — the add button is disabled once reached. */
  maxItems?: number
  /** Optional empty-state hint shown when there are no rows yet. */
  emptyHint?: string
}

/**
 * Reorderable list editor for single-line **string** items — add / edit /
 * delete plus native drag-reorder with a keyboard up/down fallback (see
 * {@link useSortableList}). The house-style row chrome (drag handle, up/down,
 * trash, "Add X" button, `data-[drag-over]` ring) matches {@link SectionListField}
 * and {@link CareSelector}. This is the target for plain bullet lists that used
 * to be one-item-per-line textareas.
 */
export function StringListField({
  items,
  onChange,
  addLabel = 'Add item',
  placeholder,
  itemLabel = 'item',
  maxItems,
  emptyHint,
}: StringListFieldProps) {
  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved!)
    onChange(next)
  }
  const { getHandleProps, getItemProps, moveUp, moveDown } = useSortableList({
    length: items.length,
    onMove: move,
  })

  const patch = (index: number, value: string) =>
    onChange(items.map((item, i) => (i === index ? value : item)))
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))
  const add = () => {
    if (maxItems !== undefined && items.length >= maxItems) return
    onChange([...items, ''])
  }

  const atMax = maxItems !== undefined && items.length >= maxItems

  return (
    <div className="space-y-2">
      {items.length === 0 && emptyHint ? (
        <p className="text-xs text-[var(--color-text-muted)]">{emptyHint}</p>
      ) : null}
      {items.map((item, index) => (
        <div
          key={index}
          {...getItemProps(index)}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-2 data-[drag-over]:border-[var(--color-accent)]"
        >
          <button
            type="button"
            {...getHandleProps(index)}
            aria-label={`Drag to reorder ${itemLabel} ${index + 1}`}
            className="focus-ring inline-flex shrink-0 cursor-grab items-center rounded px-1 text-[var(--color-text-muted)] active:cursor-grabbing"
          >
            <ArrowDownUp size={ICON_SIZE.sm} aria-hidden="true" />
          </button>
          <Input
            density="compact"
            className="min-w-0 flex-1"
            placeholder={placeholder}
            aria-label={`${itemLabel} ${index + 1}`}
            value={item}
            onChange={(e) => patch(index, e.target.value)}
          />
          <div className="flex shrink-0 items-center gap-1">
            <IconButton
              type="button"
              size="sm"
              aria-label={`Move ${itemLabel} ${index + 1} up`}
              disabled={index === 0}
              onClick={() => moveUp(index)}
            >
              <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
            </IconButton>
            <IconButton
              type="button"
              size="sm"
              aria-label={`Move ${itemLabel} ${index + 1} down`}
              disabled={index === items.length - 1}
              onClick={() => moveDown(index)}
            >
              <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
            </IconButton>
            <IconButton
              type="button"
              size="sm"
              aria-label={`Remove ${itemLabel} ${index + 1}`}
              onClick={() => remove(index)}
            >
              <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        density="compact"
        disabled={atMax}
        onClick={add}
      >
        <Plus size={ICON_SIZE.sm} aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  )
}
