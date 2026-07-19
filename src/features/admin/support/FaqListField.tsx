import { ArrowDownUp, ChevronDown, ChevronUp, Plus, Trash2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import { makeSectionId } from '@/features/admin/components/SectionListField'
import type { FaqItem } from '@/features/cms/support/supportContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'

interface FaqListFieldProps {
  items: FaqItem[]
  onChange: (next: FaqItem[]) => void
}

/**
 * Reorderable list editor for FAQ `{ id, question, answer }` items, with native
 * drag-reorder + keyboard up/down fallback and add/remove. `answer` is plain
 * text; a blank line starts a new paragraph.
 */
export function FaqListField({ items, onChange }: FaqListFieldProps) {
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

  const patch = (index: number, key: 'question' | 'answer', value: string) =>
    onChange(items.map((s, i) => (i === index ? { ...s, [key]: value } : s)))
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))
  const add = () =>
    onChange([...items, { id: makeSectionId('faq'), question: '', answer: '' }])

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id || index}
          {...getItemProps(index)}
          className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-3 data-[drag-over]:border-[var(--color-accent)]"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              {...getHandleProps(index)}
              aria-label={`Drag to reorder question ${index + 1}`}
              className="focus-ring inline-flex cursor-grab items-center gap-1.5 rounded px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] active:cursor-grabbing"
            >
              <ArrowDownUp size={ICON_SIZE.sm} aria-hidden="true" />
              Q{index + 1}
            </button>
            <div className="flex items-center gap-1">
              <IconButton
                type="button"
                size="sm"
                aria-label={`Move question ${index + 1} up`}
                disabled={index === 0}
                onClick={() => moveUp(index)}
              >
                <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
              <IconButton
                type="button"
                size="sm"
                aria-label={`Move question ${index + 1} down`}
                disabled={index === items.length - 1}
                onClick={() => moveDown(index)}
              >
                <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
              <IconButton
                type="button"
                size="sm"
                aria-label={`Remove question ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
            </div>
          </div>
          <FormField label="Question" labelStyle="micro">
            <Input
              density="compact"
              value={item.question}
              onChange={(e) => patch(index, 'question', e.target.value)}
            />
          </FormField>
          <FormField
            label="Answer"
            hint="Plain text — a blank line starts a new paragraph."
            labelStyle="micro"
          >
            <Textarea
              density="compact"
              rows={3}
              value={item.answer}
              onChange={(e) => patch(index, 'answer', e.target.value)}
            />
          </FormField>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" density="compact" onClick={add}>
        <Plus size={ICON_SIZE.sm} aria-hidden="true" />
        Add question
      </Button>
    </div>
  )
}
