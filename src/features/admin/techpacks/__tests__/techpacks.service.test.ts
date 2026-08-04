import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The three orderings that are expensive to get wrong:
 *
 * - `setTechpackFinal` must go through the RPC. Writing `is_final` from the
 *   client races the partial unique index and can leave a product with zero
 *   finals, which nobody would notice until a storefront read came back empty.
 * - `deleteTechpack` must remove storage BEFORE the row. The row cascade takes
 *   `techpack_images` with it, and once those rows are gone nothing points at
 *   the objects in the private bucket.
 * - `uploadTechpackImage` must remove the object when the catalogue insert
 *   fails, for the same reason in miniature.
 */

const state = vi.hoisted(() => {
  interface Op {
    kind: string
    table?: string
    payload?: unknown
  }

  const s = {
    ops: [] as Op[],
    rpcCalls: [] as Array<{ fn: string; args: unknown }>,
    rpcResult: { ok: true } as { ok?: boolean; error?: string },
    rpcError: null as { message: string } | null,
    sourceRow: { source_path: 'source/pack-1.pdf' } as Record<string, unknown> | null,
    imageRows: [
      { storage_path: 'images/pack-1/p1-i0.webp' },
      { storage_path: 'images/pack-1/p2-i0.webp' },
    ] as Array<Record<string, unknown>>,
    removed: [] as string[][],
    uploadError: null as { message: string } | null,
    insertError: null as { message: string } | null,
    insertedRow: null as Record<string, unknown> | null,
    deleteReturns: [{ id: 'pack-1' }] as Array<Record<string, unknown>>,
    updateReturns: [{ id: 'pack-1' }] as Array<Record<string, unknown>>,
  }

  /** Thenable stand-in for a PostgREST builder — chains, then resolves. */
  function chain(value: { data: unknown; error: unknown }) {
    const builder: Record<string, unknown> = {}
    for (const method of ['select', 'eq', 'in', 'order', 'limit']) {
      builder[method] = () => builder
    }
    builder.maybeSingle = async () => value
    builder.single = async () => value
    builder.then = (
      resolve: (v: unknown) => unknown,
      reject: (e: unknown) => unknown,
    ) => Promise.resolve(value).then(resolve, reject)
    return builder
  }

  // `supabase` closes over `s`, so the object returned MUST be `s` itself —
  // spreading it here would hand the tests a copy and every mutation in
  // `beforeEach` would silently miss the mock.
  const supabase = {
    auth: {
      getSession: async () => ({
        data: {
          session: {
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user: { id: 'user-1' },
          },
        },
      }),
    },
    rpc: async (fn: string, args: unknown) => {
      s.rpcCalls.push({ fn, args })
      return { data: s.rpcResult, error: s.rpcError }
    },
    from: (table: string) => ({
      select: () =>
        chain({
          data: table === 'techpacks' ? s.sourceRow : s.imageRows,
          error: null,
        }),
      insert: () => ({
        select: () => ({
          single: async () => {
            s.ops.push({ kind: 'insert', table })
            if (s.insertError) return { data: null, error: s.insertError }
            return { data: s.insertedRow, error: null }
          },
        }),
      }),
      update: (payload: unknown) => {
        s.ops.push({ kind: 'update', table, payload })
        return chain({ data: s.updateReturns, error: null })
      },
      delete: () => {
        s.ops.push({ kind: 'delete', table })
        return chain({ data: s.deleteReturns, error: null })
      },
    }),
    storage: {
      from: () => ({
        remove: async (paths: string[]) => {
          s.ops.push({ kind: 'storage.remove', payload: paths })
          s.removed.push(paths)
          return { data: null, error: null }
        },
        upload: async () => {
          s.ops.push({ kind: 'storage.upload' })
          return { data: null, error: s.uploadError }
        },
      }),
    },
  }

  return Object.assign(s, { supabase })
})

vi.mock('@/features/admin/auth/adminSupabaseBrowserClient', () => ({
  getAdminSupabaseBrowserClient: () => state.supabase,
}))

import {
  uploadTechpackImage,
  uploadTechpackPdf,
} from '@/features/admin/techpacks/techpackFiles.service'
import {
  deleteTechpack,
  setTechpackFinal,
  updateTechpack,
} from '@/features/admin/techpacks/techpacks.service'

beforeEach(() => {
  state.ops.length = 0
  state.rpcCalls.length = 0
  state.removed.length = 0
  state.rpcResult = { ok: true }
  state.rpcError = null
  state.insertError = null
  state.uploadError = null
  state.deleteReturns = [{ id: 'pack-1' }]
  state.updateReturns = [{ id: 'pack-1' }]
  state.sourceRow = { source_path: 'source/pack-1.pdf' }
  state.imageRows = [
    { storage_path: 'images/pack-1/p1-i0.webp' },
    { storage_path: 'images/pack-1/p2-i0.webp' },
  ]
})

describe('setTechpackFinal', () => {
  it('goes through the RPC and never writes is_final directly', async () => {
    const res = await setTechpackFinal('pack-1')
    expect(res.ok).toBe(true)
    expect(state.rpcCalls).toEqual([
      { fn: 'set_techpack_final', args: { p_id: 'pack-1' } },
    ])
    expect(state.ops.filter((op) => op.kind === 'update')).toEqual([])
  })

  it('maps the RPC error codes to operator-readable copy', async () => {
    state.rpcResult = { ok: false, error: 'no_product' }
    const res = await setTechpackFinal('pack-1')
    expect(res).toEqual({
      ok: false,
      error: 'Assign a product before marking this techpack final.',
    })
  })
})

/**
 * Defect C. Assigning a product is now a trigger: the caller writes three CMS
 * blobs the moment this reports success. An UPDATE that matched zero rows —
 * because the row was deleted from under the operator, or because RLS filtered
 * it away — returns NO error from PostgREST, so without asking which rows were
 * touched the service reported `ok` for an assignment that never happened and
 * the import ran against a pairing the database had refused.
 */
describe('updateTechpack', () => {
  it('reports failure when the UPDATE changed no row', async () => {
    state.updateReturns = []

    const res = await updateTechpack('pack-1', { productSlug: 'oversized-tee' })

    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.error).toContain('not saved')
  })

  it('reports success when a row was actually changed', async () => {
    const res = await updateTechpack('pack-1', { productSlug: 'oversized-tee' })
    expect(res.ok).toBe(true)
  })

  it('never writes is_final or document, whatever it is handed', async () => {
    await updateTechpack('pack-1', { title: '  Oversized tee pack  ', status: 'reviewed' })

    const update = state.ops.find((op) => op.kind === 'update')
    const payload = update?.payload as Record<string, unknown>
    expect(payload.title).toBe('Oversized tee pack')
    expect(payload).not.toHaveProperty('is_final')
    expect(payload).not.toHaveProperty('document')
  })
})

describe('deleteTechpack', () => {
  it('removes every storage object before deleting the row', async () => {
    const res = await deleteTechpack('pack-1')
    expect(res.ok).toBe(true)

    const kinds = state.ops.map((op) => op.kind)
    expect(kinds.indexOf('storage.remove')).toBeGreaterThanOrEqual(0)
    expect(kinds.indexOf('storage.remove')).toBeLessThan(kinds.indexOf('delete'))

    expect(state.removed[0]).toEqual([
      'source/pack-1.pdf',
      'images/pack-1/p1-i0.webp',
      'images/pack-1/p2-i0.webp',
    ])
  })

  it('still deletes the row when the pack has no stored objects', async () => {
    state.sourceRow = { source_path: '' }
    state.imageRows = []
    const res = await deleteTechpack('pack-1')
    expect(res.ok).toBe(true)
    expect(state.removed).toEqual([])
    expect(state.ops.some((op) => op.kind === 'delete')).toBe(true)
  })

  it('reports failure when the DELETE removed nothing', async () => {
    // The reported bug. A DELETE filtered out by RLS affects zero rows and
    // returns NO error, so the old code toasted "Techpack deleted." for a
    // techpack that was still sitting in the table.
    state.deleteReturns = []
    const res = await deleteTechpack('pack-1')
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.error).toContain('not deleted')
  })

  it('deletes the row even when storage removal fails, and says what was orphaned', async () => {
    // Aborting on a storage error left the operator with a techpack they could
    // not delete AND files they could not reach. An orphaned object is
    // recoverable; a row that will not die is not.
    const original = state.supabase.storage.from
    state.supabase.storage.from = () =>
      ({
        remove: async (paths: string[]) => {
          state.ops.push({ kind: 'storage.remove', payload: paths })
          return { data: null, error: { message: 'storage exploded' } }
        },
        upload: async () => ({ data: null, error: null }),
      }) as unknown as ReturnType<typeof original>

    try {
      const res = await deleteTechpack('pack-1')
      expect(state.ops.some((op) => op.kind === 'delete')).toBe(true)
      expect(res.ok).toBe(false)
      if (res.ok) return
      expect(res.error).toContain('orphaned')
    } finally {
      state.supabase.storage.from = original
    }
  })
})

describe('uploadTechpackImage', () => {
  const blob = () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' })

  it('rolls the storage object back when the catalogue insert fails', async () => {
    state.insertError = { message: 'RLS says no' }
    const res = await uploadTechpackImage('pack-1', 'p3-i1', blob(), {
      page: 3,
      width: 800,
      height: 1200,
    })

    expect(res.ok).toBe(false)
    expect(state.removed).toEqual([['images/pack-1/p3-i1.webp']])
    const kinds = state.ops.map((op) => op.kind)
    expect(kinds.indexOf('storage.upload')).toBeLessThan(kinds.indexOf('storage.remove'))
  })

  it('leaves the object in place when the row lands', async () => {
    state.insertedRow = {
      id: 'img-1',
      techpack_id: 'pack-1',
      ref_id: 'p3-i1',
      page: 3,
      role: 'unknown',
      storage_path: 'images/pack-1/p3-i1.webp',
      mime: 'image/webp',
      width: 800,
      height: 1200,
      byte_size: 3,
      promoted_media_id: null,
      promoted_at: null,
      created_at: new Date().toISOString(),
    }
    const res = await uploadTechpackImage('pack-1', 'p3-i1', blob(), {
      page: 3,
      width: 800,
      height: 1200,
    })

    expect(res.ok).toBe(true)
    expect(state.removed).toEqual([])
  })
})

/**
 * A 60 MB pack was refused with "larger than the 100 MB techpack limit" — a
 * message that is both wrong and unactionable. The bucket does allow 100 MB;
 * Supabase caps every bucket by a PROJECT-WIDE upload limit that the bucket
 * setting cannot see, and that cap was the binding one.
 *
 * Two behaviours are pinned here. The message must not quote a limit it cannot
 * verify, and — more importantly — a size rejection must not kill the ingest:
 * the stored PDF only buys the ability to re-parse later, while every fact the
 * feature publishes is extracted in the browser from the file the operator
 * already has.
 */
describe('uploadTechpackPdf — storage refuses the file as too large', () => {
  const pdf = () =>
    new File([new Uint8Array(8)], 'MensOversizedTee_FinalPack.pdf', {
      type: 'application/pdf',
    })

  it('succeeds anyway, with no stored path and an explanation', async () => {
    state.uploadError = { message: 'The object exceeded the maximum allowed size' }

    const result = await uploadTechpackPdf(pdf())

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.path).toBe('')
    expect(result.data.sourceSkipped).toContain('not kept')
    expect(result.data.sourceSkipped).toContain('parsed in full')
    // The operator needs the file's own size to judge the limit to set.
    expect(result.data.sourceSkipped).toMatch(/\d+\.\d MB/)
  })

  it('still reports the filename and size so the record is complete', async () => {
    state.uploadError = { message: 'Payload too large' }

    const result = await uploadTechpackPdf(pdf())

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.filename).toBe('mensoversizedtee-finalpack.pdf')
    expect(result.data.byteSize).toBe(8)
  })

  it('does NOT swallow a genuine failure', async () => {
    // Only the size case degrades; anything else must still stop the ingest.
    state.uploadError = { message: 'new row violates row-level security policy' }

    const result = await uploadTechpackPdf(pdf())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('editor or admin')
  })

  it('reports a clean upload with no warning', async () => {
    state.uploadError = null

    const result = await uploadTechpackPdf(pdf())

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.path).toMatch(/^source\/.+\.pdf$/)
    expect(result.data.sourceSkipped).toBe('')
  })
})
