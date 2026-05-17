/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { createLocalStorageChannel } from '@/shared/lib/storage'

describe('createLocalStorageChannel (Phase C1 / REU-05)', () => {
  it('read/write/remove round-trip', () => {
    const ch = createLocalStorageChannel({
      key: 'TEST_CH_BASIC',
      changeEvent: 'test:basic:change',
    })
    expect(ch.read()).toBeNull()
    ch.write('hello')
    expect(window.localStorage.getItem('TEST_CH_BASIC')).toBe('hello')
    expect(ch.read()).toBe('hello')
    ch.remove()
    expect(window.localStorage.getItem('TEST_CH_BASIC')).toBeNull()
  })

  it('fires the subscribe callback on same-tab writes', () => {
    const ch = createLocalStorageChannel({
      key: 'TEST_CH_SUB',
      changeEvent: 'test:sub:change',
    })
    const listener = vi.fn()
    const unsubscribe = ch.subscribe(listener)
    ch.write('a')
    ch.write('b')
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    ch.write('c')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('fires the subscribe callback on cross-tab storage events for the key', () => {
    const ch = createLocalStorageChannel({
      key: 'TEST_CH_CROSS',
      changeEvent: 'test:cross:change',
    })
    const listener = vi.fn()
    ch.subscribe(listener)
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'TEST_CH_CROSS', newValue: 'x' }),
    )
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('ignores cross-tab storage events for unrelated keys', () => {
    const ch = createLocalStorageChannel({
      key: 'TEST_CH_FOCUSED',
      changeEvent: 'test:focused:change',
    })
    const listener = vi.fn()
    ch.subscribe(listener)
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'SOMETHING_ELSE', newValue: 'x' }),
    )
    expect(listener).not.toHaveBeenCalled()
  })

  it('alsoListenForKeys widens the storage event watchlist', () => {
    const ch = createLocalStorageChannel({
      key: 'TEST_CH_MAIN',
      changeEvent: 'test:main:change',
      alsoListenForKeys: ['TEST_CH_SIBLING'],
    })
    const listener = vi.fn()
    ch.subscribe(listener)
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'TEST_CH_SIBLING', newValue: 'x' }),
    )
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('write swallows quota errors so callers do not crash', () => {
    const ch = createLocalStorageChannel({
      key: 'TEST_CH_QUOTA',
      changeEvent: 'test:quota:change',
    })
    const original = window.localStorage.setItem
    window.localStorage.setItem = vi
      .fn()
      .mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })
    expect(() => ch.write('boom')).not.toThrow()
    window.localStorage.setItem = original
  })

  it('readKey/writeKey round-trip on sibling keys (drops + active id model)', () => {
    const ch = createLocalStorageChannel({
      key: 'TEST_CH_MAIN_K',
      changeEvent: 'test:maink:change',
      alsoListenForKeys: ['TEST_CH_SIBLING_K'],
    })
    expect(ch.readKey('TEST_CH_SIBLING_K')).toBeNull()
    ch.writeKey('TEST_CH_SIBLING_K', 'active-1')
    expect(window.localStorage.getItem('TEST_CH_SIBLING_K')).toBe('active-1')
    expect(ch.readKey('TEST_CH_SIBLING_K')).toBe('active-1')
    ch.writeKey('TEST_CH_SIBLING_K', null)
    expect(window.localStorage.getItem('TEST_CH_SIBLING_K')).toBeNull()
  })

  it('readKey/writeKey ignore keys outside the watchlist', () => {
    const ch = createLocalStorageChannel({
      key: 'TEST_CH_WATCHED',
      changeEvent: 'test:watched:change',
    })
    window.localStorage.setItem('OTHER_KEY', 'x')
    expect(ch.readKey('OTHER_KEY')).toBeNull()
    ch.writeKey('OTHER_KEY', 'y')
    expect(window.localStorage.getItem('OTHER_KEY')).toBe('x')
  })

  it('notifyChange pings subscribers without mutating storage', () => {
    const ch = createLocalStorageChannel({
      key: 'TEST_CH_NOTIFY',
      changeEvent: 'test:notify:change',
    })
    const listener = vi.fn()
    ch.subscribe(listener)
    ch.notifyChange()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(ch.read()).toBeNull()
  })
})
