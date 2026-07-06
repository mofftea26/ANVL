import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useAdminDirtyRegistry, useIsAnyAdminEditorDirty } from '../useAdminDirtyRegistry'
import { useRegisterAdminDirty } from '../useRegisterAdminDirty'

afterEach(() => {
  useAdminDirtyRegistry.setState({ dirtyIds: {} })
})

describe('useAdminDirtyRegistry', () => {
  it('starts with nothing dirty', () => {
    expect(useAdminDirtyRegistry.getState().dirtyIds).toEqual({})
  })

  it('marks an id dirty and reports any-dirty true', () => {
    useAdminDirtyRegistry.getState().setDirty('theme', true)
    expect(useAdminDirtyRegistry.getState().dirtyIds).toEqual({ theme: true })
  })

  it('clears an id and reports any-dirty false once empty', () => {
    useAdminDirtyRegistry.getState().setDirty('theme', true)
    useAdminDirtyRegistry.getState().setDirty('theme', false)
    expect(useAdminDirtyRegistry.getState().dirtyIds).toEqual({})
  })

  it('stays dirty while any registered editor is dirty, even if others clear', () => {
    useAdminDirtyRegistry.getState().setDirty('theme', true)
    useAdminDirtyRegistry.getState().setDirty('shop', true)
    useAdminDirtyRegistry.getState().setDirty('theme', false)
    expect(useAdminDirtyRegistry.getState().dirtyIds).toEqual({ shop: true })
  })
})

describe('useIsAnyAdminEditorDirty', () => {
  it('reflects the registry state reactively', () => {
    const { result, rerender } = renderHook(() => useIsAnyAdminEditorDirty())
    expect(result.current).toBe(false)

    useAdminDirtyRegistry.getState().setDirty('fonts', true)
    rerender()
    expect(result.current).toBe(true)

    useAdminDirtyRegistry.getState().setDirty('fonts', false)
    rerender()
    expect(result.current).toBe(false)
  })
})

describe('useRegisterAdminDirty', () => {
  it('registers the editor as dirty while mounted with isDirty=true', () => {
    const { rerender, unmount } = renderHook(
      ({ isDirty }) => useRegisterAdminDirty('pdp-content', isDirty),
      { initialProps: { isDirty: false } },
    )
    expect(useAdminDirtyRegistry.getState().dirtyIds['pdp-content']).toBeUndefined()

    rerender({ isDirty: true })
    expect(useAdminDirtyRegistry.getState().dirtyIds['pdp-content']).toBe(true)

    rerender({ isDirty: false })
    expect(useAdminDirtyRegistry.getState().dirtyIds['pdp-content']).toBeUndefined()

    unmount()
    expect(useAdminDirtyRegistry.getState().dirtyIds['pdp-content']).toBeUndefined()
  })

  it('clears its own dirty flag on unmount even if it was left dirty', () => {
    const { unmount } = renderHook(() => useRegisterAdminDirty('about', true))
    expect(useAdminDirtyRegistry.getState().dirtyIds.about).toBe(true)

    unmount()
    expect(useAdminDirtyRegistry.getState().dirtyIds.about).toBeUndefined()
  })

  it('does not clear a different editor\'s dirty flag on unmount', () => {
    useAdminDirtyRegistry.getState().setDirty('theme', true)
    const { unmount } = renderHook(() => useRegisterAdminDirty('shop', true))

    unmount()
    expect(useAdminDirtyRegistry.getState().dirtyIds).toEqual({ theme: true })
  })
})
