import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  maxSerialRows: [] as Array<{ serial_number: number }>,
  insertedRows: [] as Array<Record<string, unknown>>,
  insertError: null as { message: string } | null,
}))

vi.mock('@/features/admin/auth/adminSupabaseBrowserClient', () => ({
  getAdminSupabaseBrowserClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data: state.maxSerialRows, error: null }),
          }),
        }),
      }),
      insert: async (rows: Array<Record<string, unknown>>) => {
        if (state.insertError) return { error: state.insertError }
        state.insertedRows = rows
        return { error: null }
      },
    }),
  }),
}))

import { generateBatch } from '@/features/admin/passports/passports.service'

describe('generateBatch', () => {
  beforeEach(() => {
    state.maxSerialRows = []
    state.insertedRows = []
    state.insertError = null
  })

  it('starts serials at 1 for a product with no passports', async () => {
    const res = await generateBatch({
      productSlug: 'seamless-tee',
      productName: 'Seamless Tee',
      quantity: 3,
    })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.data.from).toBe(1)
      expect(res.data.to).toBe(3)
    }
    expect(state.insertedRows.map((r) => r.serial_number)).toEqual([1, 2, 3])
    expect(state.insertedRows.every((r) => r.edition_total === 3)).toBe(true)
  })

  it('continues serials from the existing max and raises the denominator', async () => {
    state.maxSerialRows = [{ serial_number: 100 }]
    const res = await generateBatch({
      productSlug: 'seamless-tee',
      productName: 'Seamless Tee',
      quantity: 50,
    })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.data.from).toBe(101)
      expect(res.data.to).toBe(150)
    }
    expect(state.insertedRows[0]?.serial_number).toBe(101)
    expect(state.insertedRows.at(-1)?.serial_number).toBe(150)
    expect(state.insertedRows.every((r) => r.edition_total === 150)).toBe(true)
  })

  it('gives every row a unique token and one shared batch id', async () => {
    await generateBatch({
      productSlug: 'seamless-tee',
      productName: 'Seamless Tee',
      quantity: 25,
    })
    const tokens = new Set(state.insertedRows.map((r) => r.token))
    const batchIds = new Set(state.insertedRows.map((r) => r.batch_id))
    expect(tokens.size).toBe(25)
    expect(batchIds.size).toBe(1)
  })

  it('rejects invalid quantities without touching the client', async () => {
    for (const quantity of [0, -5, 501, 2.5]) {
      const res = await generateBatch({
        productSlug: 'seamless-tee',
        productName: 'Seamless Tee',
        quantity,
      })
      expect(res.ok).toBe(false)
    }
    expect(state.insertedRows).toEqual([])
  })

  it('surfaces insert errors', async () => {
    state.insertError = { message: 'RLS says no' }
    const res = await generateBatch({
      productSlug: 'seamless-tee',
      productName: 'Seamless Tee',
      quantity: 2,
    })
    expect(res).toEqual({ ok: false, error: 'RLS says no' })
  })
})
