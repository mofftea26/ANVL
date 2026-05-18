/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import {
  createDraftDrop,
  resetAllLocalCmsKeys,
} from '@/features/admin/drops/drops.service'
import { useDropsList } from '@/features/admin/drops/useDrops'

describe('useDropsList snapshot cache', () => {
  beforeEach(() => {
    resetAllLocalCmsKeys()
  })

  it('re-reads storage after persist when no subscriber was mounted', () => {
    const { result, unmount } = renderHook(() => useDropsList())
    const countBefore = result.current.length
    unmount()

    const draft = createDraftDrop()

    const { result: next } = renderHook(() => useDropsList())
    expect(next.current.some((d) => d.id === draft.id)).toBe(true)
    expect(next.current.length).toBe(countBefore + 1)
  })
})
