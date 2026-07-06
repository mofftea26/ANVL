import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAdminDirtyRegistry } from '../useAdminDirtyRegistry'
import { useSingletonCmsEditor } from '../useSingletonCmsEditor'

afterEach(() => {
  useAdminDirtyRegistry.setState({ dirtyIds: {} })
})

// `stored` must be a referentially stable value across re-renders within a
// test (exactly like the real `useSyncExternalStore`-backed read hooks it
// stands in for, which are all snapshot-cached — see
// cmsSiteConfig.settings.ts / shopExperience.settings.ts / pdpContent.settings.ts).
// Passed via `initialProps` + `rerender`, never recreated inline in the
// `renderHook` callback itself, otherwise the hook's `useEffect(() =>
// setConfig(stored), [stored])` sees a "changed" dependency on every render
// and loops.

describe('useSingletonCmsEditor', () => {
  it('starts clean (not dirty) and mirrors the stored value', () => {
    const stored = { a: 1 }
    const { result } = renderHook(() =>
      useSingletonCmsEditor({
        id: 'test-editor',
        stored,
        saveAsync: vi.fn().mockResolvedValue(undefined),
      }),
    )
    expect(result.current.config).toEqual({ a: 1 })
    expect(result.current.isDirty).toBe(false)
    expect(useAdminDirtyRegistry.getState().dirtyIds['test-editor']).toBeUndefined()
  })

  it('becomes dirty when local config diverges from stored, and registers with the shared guard', () => {
    const stored = { a: 1 }
    const { result } = renderHook(() =>
      useSingletonCmsEditor({
        id: 'test-editor',
        stored,
        saveAsync: vi.fn().mockResolvedValue(undefined),
      }),
    )

    act(() => {
      result.current.setConfig({ a: 2 })
    })

    expect(result.current.isDirty).toBe(true)
    expect(useAdminDirtyRegistry.getState().dirtyIds['test-editor']).toBe(true)
  })

  it('clears dirty state after a successful save resyncs from stored', async () => {
    const saveAsync = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ stored }) => useSingletonCmsEditor({ id: 'test-editor', stored, saveAsync }),
      { initialProps: { stored: { a: 1 } } },
    )

    act(() => {
      result.current.setConfig({ a: 2 })
    })
    expect(result.current.isDirty).toBe(true)

    act(() => {
      result.current.save()
    })
    await waitFor(() => expect(result.current.saving).toBe(false))
    expect(saveAsync).toHaveBeenCalledWith({ a: 2 })

    // Simulate the external store now reflecting the saved value (as the real
    // read hooks do once the write-through completes) — a single, deliberate
    // prop change via `rerender`, not a fresh literal on every render.
    rerender({ stored: { a: 2 } })
    expect(result.current.isDirty).toBe(false)
    expect(useAdminDirtyRegistry.getState().dirtyIds['test-editor']).toBeUndefined()
  })

  it('surfaces a save failure without crashing and keeps the dirty flag set', async () => {
    const stored = { a: 1 }
    const saveAsync = vi.fn().mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() =>
      useSingletonCmsEditor({ id: 'test-editor', stored, saveAsync }),
    )

    act(() => {
      result.current.setConfig({ a: 2 })
    })
    act(() => {
      result.current.save()
    })

    await waitFor(() => expect(result.current.saving).toBe(false))
    expect(result.current.isDirty).toBe(true)
    expect(useAdminDirtyRegistry.getState().dirtyIds['test-editor']).toBe(true)
  })
})
