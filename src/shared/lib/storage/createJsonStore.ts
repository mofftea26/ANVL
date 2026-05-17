/**
 * Zod-validated JSON store on top of a `LocalStorageChannel`.
 *
 * Why this exists (audit Phase C / SEC-07, REU-05):
 *   - `JSON.parse` + `as` casts were the dominant pattern across admin
 *     persistence (`products.service.ts`, `websiteLayout.service.ts`,
 *     `globalBrand.service.ts`, …). A tampered `localStorage` blob would
 *     drive admin and storefront state with no guard.
 *   - This factory pairs a channel with a Zod schema and returns a
 *     narrow read/write API. Reads always run through `safeParse`;
 *     malformed data falls back to `null` (callers usually return their
 *     `createDefault*()` value).
 *
 * Strict mode: pass `schema.strict()` (or `.passthrough()` if you
 * deliberately want to allow extras). The factory does not coerce.
 */

import type { ZodTypeAny, z } from 'zod'
import type { LocalStorageChannel } from './createLocalStorageChannel'

export type JsonStore<T> = {
  /** Returns the parsed value or null if absent / malformed / wrong shape. */
  read(): T | null
  /** Writes the value as JSON. No validation on write — callers are
   * expected to construct values that match the schema. */
  write(value: T): void
  clear(): void
  subscribe(listener: () => void): () => void
}

export type CreateJsonStoreOptions<TSchema extends ZodTypeAny> = {
  channel: LocalStorageChannel
  schema: TSchema
  /**
   * Optional one-shot transform applied after `safeParse`. Useful for
   * lightweight version upgrades.
   */
  transform?: (parsed: z.infer<TSchema>) => z.infer<TSchema>
  /**
   * Optional `console.warn` hook — fires when reads reject malformed
   * input. Default: silent. Pass `console.warn.bind(console)` in dev if
   * you want visibility.
   */
  onInvalid?: (error: unknown) => void
}

export function createJsonStore<TSchema extends ZodTypeAny>(
  options: CreateJsonStoreOptions<TSchema>,
): JsonStore<z.infer<TSchema>> {
  const { channel, schema, transform, onInvalid } = options

  function read(): z.infer<TSchema> | null {
    const raw = channel.read()
    if (raw === null || raw === '') return null
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      onInvalid?.(err)
      return null
    }
    const result = schema.safeParse(parsed)
    if (!result.success) {
      onInvalid?.(result.error)
      return null
    }
    return transform ? transform(result.data) : result.data
  }

  function write(value: z.infer<TSchema>): void {
    channel.write(JSON.stringify(value))
  }

  function clear(): void {
    channel.remove()
  }

  return {
    read,
    write,
    clear,
    subscribe: channel.subscribe,
  }
}
