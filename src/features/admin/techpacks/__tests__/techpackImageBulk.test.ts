import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TechpackImageRow } from '../techpackFiles.service'

const promoteOne = vi.fn()
const deleteOne = vi.fn()

vi.mock('../techpackFiles.service', () => ({
  promoteTechpackImage: (...args: unknown[]) => promoteOne(...args),
  deleteTechpackImage: (...args: unknown[]) => deleteOne(...args),
}))

const {
  describeBulkOutcome,
  deleteTechpackImages,
  promoteTechpackImages,
} = await import('../techpackImageBulk')

function image(id: string, overrides: Partial<TechpackImageRow> = {}): TechpackImageRow {
  return {
    id,
    techpackId: 'tp-1',
    refId: id,
    page: 1,
    role: 'product',
    storagePath: `techpacks/tp-1/${id}.webp`,
    mime: 'image/webp',
    width: 800,
    height: 800,
    promotedMediaId: null,
    createdAt: '2026-07-30T00:00:00.000Z',
    ...overrides,
  } as TechpackImageRow
}

beforeEach(() => {
  promoteOne.mockReset()
  deleteOne.mockReset()
})

describe('promoteTechpackImages', () => {
  it('publishes each selected image and names it from the product slug', async () => {
    promoteOne.mockResolvedValue({ ok: true, data: {} })

    const res = await promoteTechpackImages([image('a'), image('b')], 'oath-tee')

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.data.succeeded).toBe(2)
    expect(promoteOne).toHaveBeenCalledTimes(2)
    expect(promoteOne.mock.calls[0]?.[1]).toEqual({ filename: 'oath-tee-a.webp' })
  })

  it('skips images that are already in the library instead of re-publishing them', async () => {
    promoteOne.mockResolvedValue({ ok: true, data: {} })

    const res = await promoteTechpackImages(
      [image('a'), image('b', { promotedMediaId: 'media-1' })],
      'oath-tee',
    )

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.data).toMatchObject({ succeeded: 1, skipped: 1, failed: 0 })
    expect(promoteOne).toHaveBeenCalledTimes(1)
  })

  /**
   * The whole point of continuing past a failure: eleven of twelve landing is
   * a materially different outcome from none, and the operator has to be able
   * to tell which. Aborting at the first error leaves them guessing.
   */
  it('reports partial success rather than stopping at the first failure', async () => {
    promoteOne
      .mockResolvedValueOnce({ ok: true, data: {} })
      .mockResolvedValueOnce({ ok: false, error: 'storage down' })
      .mockResolvedValueOnce({ ok: true, data: {} })

    const res = await promoteTechpackImages([image('a'), image('b'), image('c')], '')

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.data).toMatchObject({ succeeded: 2, failed: 1 })
    expect(res.data.errors).toEqual(['storage down'])
    expect(promoteOne).toHaveBeenCalledTimes(3)
  })

  it('falls back to a generic filename stem when no product is assigned', async () => {
    promoteOne.mockResolvedValue({ ok: true, data: {} })

    await promoteTechpackImages([image('a')], '')

    expect(promoteOne.mock.calls[0]?.[1]).toEqual({ filename: 'techpack-a.webp' })
  })

  it('is a failure, not a quiet no-op, when nothing at all could be published', async () => {
    promoteOne.mockResolvedValue({ ok: false, error: 'not authorised' })

    const res = await promoteTechpackImages([image('a'), image('b')], 'oath-tee')

    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.error).toContain('not authorised')
  })

  it('caps the reported errors so the message stays readable', async () => {
    promoteOne
      .mockResolvedValueOnce({ ok: true, data: {} })
      .mockResolvedValue({ ok: false, error: 'boom' })

    const res = await promoteTechpackImages(
      ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => image(id)),
      'x',
    )

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.data.failed).toBe(5)
    expect(res.data.errors).toHaveLength(3)
  })

  /**
   * Sequential is a deliberate constraint, not an accident of the loop: each
   * promotion is several round trips and the admin client refreshes no token
   * of its own, so a parallel burst turns one expired session into N identical
   * failures. A refactor to `Promise.all` must fail here.
   */
  it('runs strictly one at a time', async () => {
    let inFlight = 0
    let peak = 0
    promoteOne.mockImplementation(async () => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await Promise.resolve()
      inFlight -= 1
      return { ok: true, data: {} }
    })

    await promoteTechpackImages(['a', 'b', 'c', 'd'].map((id) => image(id)), 'x')

    expect(peak).toBe(1)
  })
})

describe('deleteTechpackImages', () => {
  it('refuses to delete images that have already been published', async () => {
    deleteOne.mockResolvedValue({ ok: true, data: {} })

    const res = await deleteTechpackImages([
      image('a'),
      image('b', { promotedMediaId: 'media-1' }),
    ])

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.data).toMatchObject({ succeeded: 1, skipped: 1 })
    expect(deleteOne).toHaveBeenCalledTimes(1)
    expect(deleteOne.mock.calls[0]?.[0]).toMatchObject({ id: 'a' })
  })
})

describe('describeBulkOutcome', () => {
  it('mentions only the counts that actually happened', () => {
    expect(
      describeBulkOutcome({ succeeded: 9, skipped: 0, failed: 0, errors: [] }, 'published'),
    ).toBe('9 published')
    expect(
      describeBulkOutcome({ succeeded: 9, skipped: 3, failed: 1, errors: [] }, 'published'),
    ).toBe('9 published · 3 skipped · 1 failed')
  })
})
