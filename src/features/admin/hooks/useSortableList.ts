import { useState, type DragEvent } from 'react'

interface UseSortableListOptions {
  length: number
  /** Reorder callback — RHF `useFieldArray().move` fits directly. */
  onMove: (from: number, to: number) => void
}

export interface SortableHandleProps {
  draggable: true
  onDragStart: (event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
}

export interface SortableItemProps {
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDragLeave: () => void
  onDrop: (event: DragEvent<HTMLElement>) => void
  'data-drag-over'?: '' | undefined
}

/**
 * Native HTML5 drag-reorder for a single vertical admin list — no dependency.
 * Attach `getHandleProps(i)` to the drag handle (keeps text inputs selectable)
 * and `getItemProps(i)` to the row container (the drop target; style via
 * `data-drag-over`). Always pair with the `moveUp`/`moveDown` keyboard
 * fallback buttons — drag alone is not accessible.
 */
export function useSortableList({ length, onMove }: UseSortableListOptions) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const reset = () => {
    setDragIndex(null)
    setOverIndex(null)
  }

  function getHandleProps(index: number): SortableHandleProps {
    return {
      draggable: true,
      onDragStart: (event) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(index))
        setDragIndex(index)
      },
      onDragEnd: reset,
    }
  }

  function getItemProps(index: number): SortableItemProps {
    const showTarget = dragIndex !== null && overIndex === index && dragIndex !== index
    return {
      onDragOver: (event) => {
        if (dragIndex === null) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setOverIndex(index)
      },
      onDragLeave: () => {
        setOverIndex((current) => (current === index ? null : current))
      },
      onDrop: (event) => {
        if (dragIndex === null) return
        event.preventDefault()
        if (dragIndex !== index) onMove(dragIndex, index)
        reset()
      },
      'data-drag-over': showTarget ? '' : undefined,
    }
  }

  const moveUp = (index: number) => {
    if (index > 0) onMove(index, index - 1)
  }
  const moveDown = (index: number) => {
    if (index < length - 1) onMove(index, index + 1)
  }

  return {
    getHandleProps,
    getItemProps,
    moveUp,
    moveDown,
    isDragging: dragIndex !== null,
  }
}
