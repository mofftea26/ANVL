import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  EMPTY_TECHPACK_DOCUMENT,
  type TechpackDocument,
} from '@/features/techpacks/schema/techpack.zod'

import type { AutoImportRunResult } from '../import/autoImportPlan'
import type { TechpackResult } from '../techpacks.service'
import type { TechpackIngestResult } from '../techpackIngest'

/**
 * Where the unattended import is FIRED from — the two defects that made it not
 * fire at all.
 *
 * A. Picking a product on the upload panel writes `product_slug` at INSERT, so
 *    the row is born assigned and the detail panel's slug TRANSITION never
 *    happens. The commonest flow imported nothing and said nothing.
 * B. The detail panel fired it from `mutate(vars, { onSuccess })`, which
 *    React Query only runs while the observer still has listeners. Navigating
 *    away between Save and the save resolving dropped the whole import.
 *
 * Both are fixed by moving the call into the MUTATION-level `onSuccess`, which
 * `Mutation.execute()` awaits regardless of who is still watching.
 */

const h = vi.hoisted(() => ({
  runAutoImport: vi.fn(),
  publishAutoImportTargets: vi.fn(),
  updateTechpack: vi.fn(),
  ingestTechpack: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}))

vi.mock('../import/autoImportRun', () => ({
  runAutoImport: h.runAutoImport,
  publishAutoImportTargets: h.publishAutoImportTargets,
}))

vi.mock('../techpacks.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../techpacks.service')>()
  return { ...actual, updateTechpack: h.updateTechpack }
})

vi.mock('../techpackIngest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../techpackIngest')>()
  return { ...actual, ingestTechpack: h.ingestTechpack }
})

import { useIngestTechpackMutation, useUpdateTechpackMutation } from '../useTechpacks'

const DOCUMENT: TechpackDocument = structuredClone(EMPTY_TECHPACK_DOCUMENT)

const RAN: AutoImportRunResult = {
  proposalCount: 4,
  blockedCount: 0,
  alreadyFilledCount: 0,
  totalFields: 4,
  countsByTarget: { passport: 4, sizeGuide: 0, pdp: 0 },
  savedTargets: ['passport'],
  deferredTargets: [],
  failure: null,
}

function ingested(): TechpackResult<TechpackIngestResult> {
  return {
    ok: true,
    data: {
      id: 'pack-1',
      document: DOCUMENT,
      extracts: [],
      imagesStored: 0,
      imagesSkipped: 0,
      sourceSkipped: '',
    },
  }
}

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

function pdf(): File {
  return new File([new Uint8Array(4)], 'pack.pdf', { type: 'application/pdf' })
}

beforeEach(() => {
  h.runAutoImport.mockReset()
  h.runAutoImport.mockResolvedValue(RAN)
  h.publishAutoImportTargets.mockReset()
  h.updateTechpack.mockReset()
  h.updateTechpack.mockResolvedValue({ ok: true, data: null })
  h.ingestTechpack.mockReset()
  h.ingestTechpack.mockResolvedValue(ingested())
})

/* ------------------------------- defect A -------------------------------- */

describe('useIngestTechpackMutation — the product was picked before the parse', () => {
  it('imports after the parse, and the detail panel does not then import it twice', async () => {
    const view = renderHook(() => useIngestTechpackMutation(), { wrapper: wrapper() })

    await act(async () => {
      await view.result.current.mutateAsync({ file: pdf(), productSlug: 'oversized-tee' })
    })

    await waitFor(() => expect(h.runAutoImport).toHaveBeenCalledTimes(1))
    expect(h.runAutoImport).toHaveBeenCalledWith({
      doc: DOCUMENT,
      productSlug: 'oversized-tee',
    })

    // The row was born with its product, so the detail panel's Save sees
    // previous === next. That is the only thing standing between this fix and
    // a second unattended write over the same three CMS blobs.
    const panel = renderHook(() => useUpdateTechpackMutation(), { wrapper: wrapper() })
    await act(async () => {
      await panel.result.current.mutateAsync({
        id: 'pack-1',
        title: 'Pack',
        productSlug: 'oversized-tee',
        status: 'parsed',
        notes: '',
        autoImport: {
          previousSlug: 'oversized-tee',
          nextSlug: 'oversized-tee',
          status: 'parsed',
          document: DOCUMENT,
        },
      })
    })

    expect(h.runAutoImport).toHaveBeenCalledTimes(1)
  })

  it('imports nothing when the upload left the product unassigned', async () => {
    const view = renderHook(() => useIngestTechpackMutation(), { wrapper: wrapper() })

    await act(async () => {
      await view.result.current.mutateAsync({ file: pdf() })
    })

    expect(h.runAutoImport).not.toHaveBeenCalled()
  })

  it('imports nothing when the ingest itself failed', async () => {
    h.ingestTechpack.mockResolvedValue({ ok: false, error: 'Could not parse this techpack.' })
    const view = renderHook(() => useIngestTechpackMutation(), { wrapper: wrapper() })

    await act(async () => {
      await view.result.current
        .mutateAsync({ file: pdf(), productSlug: 'oversized-tee' })
        .catch(() => undefined)
    })

    expect(h.runAutoImport).not.toHaveBeenCalled()
  })
})

/* ------------------------------- defect B -------------------------------- */

describe('useUpdateTechpackMutation — the panel is gone before the save lands', () => {
  it('still runs the import when the observer has been unsubscribed', async () => {
    // Built up front, not inside `mockImplementation`: React Query calls the
    // mutation fn a microtask after `mutate`, so a handle assigned in there is
    // still null when this test wants to unblock the save.
    let release!: () => void
    const inFlight = new Promise<TechpackResult<null>>((resolve) => {
      release = () => resolve({ ok: true, data: null })
    })
    h.updateTechpack.mockReturnValue(inFlight)

    const observerOnSuccess = vi.fn()
    const view = renderHook(() => useUpdateTechpackMutation(), { wrapper: wrapper() })

    act(() => {
      view.result.current.mutate(
        {
          id: 'pack-1',
          title: 'Pack',
          productSlug: 'oversized-tee',
          status: 'parsed',
          notes: '',
          autoImport: {
            previousSlug: '',
            nextSlug: 'oversized-tee',
            status: 'parsed',
            document: DOCUMENT,
          },
        },
        { onSuccess: observerOnSuccess },
      )
    })

    // Navigating away, or selecting a different techpack, mid-save.
    view.unmount()

    await act(async () => {
      release()
      await inFlight
    })

    await waitFor(() => expect(h.runAutoImport).toHaveBeenCalledTimes(1))
    // …and the proof that the import could never have lived in that callback:
    // React Query drops it the moment the last listener goes.
    expect(observerOnSuccess).not.toHaveBeenCalled()
  })

  it('does not import when the assignment itself was refused', async () => {
    h.updateTechpack.mockResolvedValue({ ok: false, error: 'That techpack was not saved.' })
    const view = renderHook(() => useUpdateTechpackMutation(), { wrapper: wrapper() })

    await act(async () => {
      await view.result.current
        .mutateAsync({
          id: 'pack-1',
          title: 'Pack',
          productSlug: 'oversized-tee',
          status: 'parsed',
          notes: '',
          autoImport: {
            previousSlug: '',
            nextSlug: 'oversized-tee',
            status: 'parsed',
            document: DOCUMENT,
          },
        })
        .catch(() => undefined)
    })

    expect(h.runAutoImport).not.toHaveBeenCalled()
  })
})
