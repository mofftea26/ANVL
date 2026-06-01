import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AdminButton } from './AdminButton'
import { cn } from '@/shared/lib/cn'

export type EditableListItem = { id: string; [key: string]: unknown }

type AdminEditableListProps<T extends EditableListItem> = {
  items: T[]
  onChange: (items: T[]) => void
  createItem: () => T
  renderLabel: (item: T) => string
  renderEditor: (
    item: T,
    onPatch: (patch: Partial<T>) => void,
    onClose: () => void,
  ) => React.ReactNode
  addLabel?: string
  emptyLabel?: string
  className?: string
  maxItems?: number
}

export function AdminEditableList<T extends EditableListItem>({
  items,
  onChange,
  createItem,
  renderLabel,
  renderEditor,
  addLabel = 'Add item',
  emptyLabel = 'No items yet.',
  className,
  maxItems = 24,
}: AdminEditableListProps<T>) {
  const [editingId, setEditingId] = useState<string | null>(null)

  function addItem() {
    if (items.length >= maxItems) return
    const next = createItem()
    onChange([...items, next])
    setEditingId(next.id)
  }

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function patchItem(id: string, patch: Partial<T>) {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--admin-muted)]">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded border border-[var(--admin-line)] bg-[var(--admin-surface)]"
            >
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--admin-fg)]">
                  {renderLabel(item)}
                </span>
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Edit"
                  onClick={() =>
                    setEditingId(editingId === item.id ? null : item.id)
                  }
                >
                  <Pencil className="size-3.5" />
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Remove"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="size-3.5" />
                </AdminButton>
              </div>
              {editingId === item.id ? (
                <div className="border-t border-[var(--admin-line)] px-2 py-2">
                  {renderEditor(
                    item,
                    (patch) => patchItem(item.id, patch),
                    () => setEditingId(null),
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <AdminButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={items.length >= maxItems}
        onClick={addItem}
      >
        <Plus className="size-3.5" />
        {addLabel}
      </AdminButton>
    </div>
  )
}
