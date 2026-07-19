import { ArrowDownUp, ChevronDown, ChevronUp, Plus, Trash2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'

/** A `{ id, heading, body }` content section — shared by legal + support pages. */
export interface EditableSection {
  id: string
  heading: string
  body: string
}

/** Stable client-side id for a freshly-added section (SSR-safe: editor only). */
export function makeSectionId(prefix = 'section'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

interface SectionListFieldProps {
  sections: EditableSection[]
  onChange: (next: EditableSection[]) => void
  /** Label for the "add" button (e.g. "Add section", "Add paragraph"). */
  addLabel?: string
  headingPlaceholder?: string
  bodyPlaceholder?: string
  /** Prefix for generated ids on new rows. */
  idPrefix?: string
  /** Hint under the heading label (e.g. "Blank line = new paragraph."). */
  bodyHint?: string
}

/**
 * Reorderable list editor for `{ id, heading, body }` content sections, with
 * native drag-reorder + keyboard up/down fallback (see `useSortableList`) and
 * add/remove. Used by the Legal and Support editors for their section lists;
 * `body` is plain text where a blank line starts a new paragraph.
 */
export function SectionListField({
  sections,
  onChange,
  addLabel = 'Add section',
  headingPlaceholder = 'Section heading',
  bodyPlaceholder = 'Section body — a blank line starts a new paragraph.',
  idPrefix = 'section',
  bodyHint,
}: SectionListFieldProps) {
  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...sections]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  const { getHandleProps, getItemProps, moveUp, moveDown } = useSortableList({
    length: sections.length,
    onMove: move,
  })

  const patch = (index: number, key: 'heading' | 'body', value: string) =>
    onChange(sections.map((s, i) => (i === index ? { ...s, [key]: value } : s)))
  const remove = (index: number) => onChange(sections.filter((_, i) => i !== index))
  const add = () =>
    onChange([...sections, { id: makeSectionId(idPrefix), heading: '', body: '' }])

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <div
          key={section.id || index}
          {...getItemProps(index)}
          className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-3 data-[drag-over]:border-[var(--color-accent)]"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              {...getHandleProps(index)}
              aria-label={`Drag to reorder section ${index + 1}`}
              className="focus-ring inline-flex cursor-grab items-center gap-1.5 rounded px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] active:cursor-grabbing"
            >
              <ArrowDownUp size={ICON_SIZE.sm} aria-hidden="true" />
              Section {index + 1}
            </button>
            <div className="flex items-center gap-1">
              <IconButton
                type="button"
                size="sm"
                aria-label={`Move section ${index + 1} up`}
                disabled={index === 0}
                onClick={() => moveUp(index)}
              >
                <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
              <IconButton
                type="button"
                size="sm"
                aria-label={`Move section ${index + 1} down`}
                disabled={index === sections.length - 1}
                onClick={() => moveDown(index)}
              >
                <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
              <IconButton
                type="button"
                size="sm"
                aria-label={`Remove section ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
            </div>
          </div>
          <FormField label="Heading" labelStyle="micro">
            <Input
              density="compact"
              placeholder={headingPlaceholder}
              value={section.heading}
              onChange={(e) => patch(index, 'heading', e.target.value)}
            />
          </FormField>
          <FormField label="Body" hint={bodyHint} labelStyle="micro">
            <Textarea
              density="compact"
              rows={4}
              placeholder={bodyPlaceholder}
              value={section.body}
              onChange={(e) => patch(index, 'body', e.target.value)}
            />
          </FormField>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" density="compact" onClick={add}>
        <Plus size={ICON_SIZE.sm} aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  )
}
