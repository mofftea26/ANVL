/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useSortableList } from '../useSortableList'

function dragEvent(): {
  preventDefault: () => void
  dataTransfer: { effectAllowed: string; dropEffect: string; setData: () => void }
} {
  return {
    preventDefault: vi.fn(),
    dataTransfer: { effectAllowed: '', dropEffect: '', setData: vi.fn() },
  }
}

describe('useSortableList', () => {
  it('moves via keyboard fallback within bounds', () => {
    const onMove = vi.fn()
    const { result } = renderHook(() => useSortableList({ length: 3, onMove }))

    act(() => result.current.moveUp(0))
    expect(onMove).not.toHaveBeenCalled()

    act(() => result.current.moveUp(2))
    expect(onMove).toHaveBeenLastCalledWith(2, 1)

    act(() => result.current.moveDown(2))
    expect(onMove).toHaveBeenCalledTimes(1)

    act(() => result.current.moveDown(0))
    expect(onMove).toHaveBeenLastCalledWith(0, 1)
  })

  it('drag start → drop on another row reorders once', () => {
    const onMove = vi.fn()
    const { result } = renderHook(() => useSortableList({ length: 3, onMove }))

    // eslint-style casts: the hook only touches preventDefault + dataTransfer.
    const startEvent = dragEvent() as unknown as Parameters<
      ReturnType<typeof result.current.getHandleProps>['onDragStart']
    >[0]
    act(() => result.current.getHandleProps(0).onDragStart(startEvent))
    expect(result.current.isDragging).toBe(true)

    const overEvent = dragEvent() as unknown as Parameters<
      ReturnType<typeof result.current.getItemProps>['onDragOver']
    >[0]
    act(() => result.current.getItemProps(2).onDragOver(overEvent))

    const dropEvent = dragEvent() as unknown as Parameters<
      ReturnType<typeof result.current.getItemProps>['onDrop']
    >[0]
    act(() => result.current.getItemProps(2).onDrop(dropEvent))

    expect(onMove).toHaveBeenCalledExactlyOnceWith(0, 2)
    expect(result.current.isDragging).toBe(false)
  })

  it('dropping on the source row is a no-op', () => {
    const onMove = vi.fn()
    const { result } = renderHook(() => useSortableList({ length: 2, onMove }))

    const startEvent = dragEvent() as unknown as Parameters<
      ReturnType<typeof result.current.getHandleProps>['onDragStart']
    >[0]
    act(() => result.current.getHandleProps(1).onDragStart(startEvent))
    const dropEvent = dragEvent() as unknown as Parameters<
      ReturnType<typeof result.current.getItemProps>['onDrop']
    >[0]
    act(() => result.current.getItemProps(1).onDrop(dropEvent))

    expect(onMove).not.toHaveBeenCalled()
  })
})
