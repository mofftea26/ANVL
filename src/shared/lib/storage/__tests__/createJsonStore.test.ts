/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  createJsonStore,
  createLocalStorageChannel,
} from '@/shared/lib/storage'

const schema = z.object({
  version: z.literal(1),
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().int().nonnegative(),
    }),
  ),
})

function makeStore(opts?: { onInvalid?: (e: unknown) => void }) {
  const channel = createLocalStorageChannel({
    key: 'TEST_JSON_STORE',
    changeEvent: 'test:json:change',
  })
  return {
    channel,
    store: createJsonStore({ channel, schema, onInvalid: opts?.onInvalid }),
  }
}

describe('createJsonStore (Phase C1 / SEC-07)', () => {
  it('round-trips a valid value', () => {
    const { store } = makeStore()
    const payload = { version: 1 as const, items: [{ id: 'a', quantity: 2 }] }
    store.write(payload)
    expect(store.read()).toEqual(payload)
  })

  it('returns null when nothing is stored', () => {
    const { store } = makeStore()
    expect(store.read()).toBeNull()
  })

  it('returns null when the stored JSON is malformed', () => {
    const { channel, store } = makeStore()
    channel.write('{not-json}')
    expect(store.read()).toBeNull()
  })

  it('returns null when the parsed JSON fails the schema (tamper guard)', () => {
    const { channel, store } = makeStore()
    channel.write(
      JSON.stringify({ version: 999, items: [{ id: 'a', quantity: -1 }] }),
    )
    expect(store.read()).toBeNull()
  })

  it('invokes onInvalid for both parse errors and schema rejects', () => {
    const onInvalid = vi.fn()
    const { channel, store } = makeStore({ onInvalid })
    channel.write('{not-json}')
    expect(store.read()).toBeNull()
    expect(onInvalid).toHaveBeenCalledTimes(1)
    channel.write(JSON.stringify({ version: 2, items: [] }))
    expect(store.read()).toBeNull()
    expect(onInvalid).toHaveBeenCalledTimes(2)
  })

  it('clear() removes the stored value', () => {
    const { store } = makeStore()
    store.write({ version: 1, items: [] })
    expect(store.read()).not.toBeNull()
    store.clear()
    expect(store.read()).toBeNull()
  })

  it('subscribe() relays writes and cross-tab events', () => {
    const { store, channel } = makeStore()
    const listener = vi.fn()
    store.subscribe(listener)
    store.write({ version: 1, items: [] })
    expect(listener).toHaveBeenCalledTimes(1)
    window.dispatchEvent(
      new StorageEvent('storage', { key: channel.key, newValue: 'x' }),
    )
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('transform runs after a successful parse', () => {
    const channel = createLocalStorageChannel({
      key: 'TEST_JSON_TRANSFORM',
      changeEvent: 'test:transform:change',
    })
    const store = createJsonStore({
      channel,
      schema,
      transform: (parsed) => ({
        ...parsed,
        items: parsed.items.map((it) => ({ ...it, quantity: it.quantity + 1 })),
      }),
    })
    channel.write(JSON.stringify({ version: 1, items: [{ id: 'a', quantity: 1 }] }))
    expect(store.read()?.items[0]?.quantity).toBe(2)
  })
})
