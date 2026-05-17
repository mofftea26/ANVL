import { describe, expect, it } from 'vitest'
import {
  persistedDropSchema,
  dropsPersistedPayloadSchema,
} from '@/features/admin/drops/drops.persistence.zod'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'

describe('persistedDropSchema (SEC-07 tamper guard)', () => {
  it('accepts the default Oath drop', () => {
    const drop = createDefaultTheOathDrop()
    const result = persistedDropSchema.safeParse(drop)
    expect(result.success).toBe(true)
  })

  it('rejects an unknown status string', () => {
    const drop = { ...createDefaultTheOathDrop(), status: 'super-active' }
    const result = persistedDropSchema.safeParse(drop)
    expect(result.success).toBe(false)
  })

  it('rejects when a required field is missing', () => {
    const { slug: _slug, ...incomplete } = createDefaultTheOathDrop()
    const result = persistedDropSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
  })

  it('rejects when productIds is not an array', () => {
    const drop = {
      ...createDefaultTheOathDrop(),
      productIds: 'not-an-array',
    }
    const result = persistedDropSchema.safeParse(drop)
    expect(result.success).toBe(false)
  })
})

describe('dropsPersistedPayloadSchema', () => {
  it('rejects an empty drops list (storage must always hold at least one)', () => {
    expect(dropsPersistedPayloadSchema.safeParse({ drops: [] }).success).toBe(
      false,
    )
  })

  it('accepts a payload with at least one drop entry', () => {
    expect(
      dropsPersistedPayloadSchema.safeParse({
        drops: [createDefaultTheOathDrop()],
      }).success,
    ).toBe(true)
  })
})
