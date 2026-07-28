import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getAdminSessionServerFn: vi.fn(),
}))

vi.mock('@/features/admin/auth/adminAuth', () => ({
  getAdminSessionServerFn: hoisted.getAdminSessionServerFn,
}))

import {
  getCachedAdminSession,
  invalidateAdminSessionCache,
} from '@/features/admin/auth/adminAuthCache'

const AUTHENTICATED_RESULT = {
  authenticated: true as const,
  user: { userId: 'u1', email: 'admin@anvl.test', displayName: 'Admin' },
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
}

/** A promise this test controls the settlement of, to assert that two
 * concurrent `getCachedAdminSession()` calls share one underlying request. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('getCachedAdminSession', () => {
  beforeEach(() => {
    hoisted.getAdminSessionServerFn.mockReset()
    invalidateAdminSessionCache()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('collapses concurrent callers onto a single in-flight request', async () => {
    const request = deferred<typeof AUTHENTICATED_RESULT>()
    hoisted.getAdminSessionServerFn.mockReturnValueOnce(request.promise)

    const callA = getCachedAdminSession()
    const callB = getCachedAdminSession()
    // Both calls happened before the request settled — only one network call.
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(1)

    request.resolve(AUTHENTICATED_RESULT)
    const [resultA, resultB] = await Promise.all([callA, callB])
    expect(resultA).toEqual(AUTHENTICATED_RESULT)
    expect(resultB).toEqual(AUTHENTICATED_RESULT)
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(1)
  })

  it('reuses the cached result within the TTL and refetches after it expires', async () => {
    vi.useFakeTimers()
    hoisted.getAdminSessionServerFn
      .mockResolvedValueOnce(AUTHENTICATED_RESULT)
      .mockResolvedValueOnce(AUTHENTICATED_RESULT)

    await getCachedAdminSession()
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(1)

    // Still within the 45s TTL — no new network call.
    await vi.advanceTimersByTimeAsync(44_000)
    await getCachedAdminSession()
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(1)

    // Past the TTL — the next call must refetch.
    await vi.advanceTimersByTimeAsync(2_000)
    await getCachedAdminSession()
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(2)
  })

  it('does not cache an unauthenticated result', async () => {
    hoisted.getAdminSessionServerFn
      .mockResolvedValueOnce({ authenticated: false })
      .mockResolvedValueOnce(AUTHENTICATED_RESULT)

    const first = await getCachedAdminSession()
    expect(first).toEqual({ authenticated: false })
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(1)

    // A second call right away must NOT reuse the failed result.
    const second = await getCachedAdminSession()
    expect(second).toEqual(AUTHENTICATED_RESULT)
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(2)
  })

  it('does not cache a rejected request', async () => {
    hoisted.getAdminSessionServerFn
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(AUTHENTICATED_RESULT)

    await expect(getCachedAdminSession()).rejects.toThrow('network down')
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(1)

    const second = await getCachedAdminSession()
    expect(second).toEqual(AUTHENTICATED_RESULT)
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(2)
  })

  it('invalidateAdminSessionCache() forces the next call to refetch', async () => {
    hoisted.getAdminSessionServerFn
      .mockResolvedValueOnce(AUTHENTICATED_RESULT)
      .mockResolvedValueOnce(AUTHENTICATED_RESULT)

    await getCachedAdminSession()
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(1)

    invalidateAdminSessionCache()
    await getCachedAdminSession()
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(2)
  })

  it('{ force: true } refetches even when a fresh cached value exists', async () => {
    hoisted.getAdminSessionServerFn
      .mockResolvedValueOnce(AUTHENTICATED_RESULT)
      .mockResolvedValueOnce(AUTHENTICATED_RESULT)

    await getCachedAdminSession()
    await getCachedAdminSession({ force: true })
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(2)
  })

  it('bypasses the cache entirely when running on the server (no window)', async () => {
    hoisted.getAdminSessionServerFn
      .mockResolvedValueOnce(AUTHENTICATED_RESULT)
      .mockResolvedValueOnce(AUTHENTICATED_RESULT)

    vi.stubGlobal('window', undefined)

    const first = await getCachedAdminSession()
    const second = await getCachedAdminSession()

    expect(first).toEqual(AUTHENTICATED_RESULT)
    expect(second).toEqual(AUTHENTICATED_RESULT)
    // A shared Worker isolate serves other users' requests too — every
    // server-side call MUST hit the network. None may be cached.
    expect(hoisted.getAdminSessionServerFn).toHaveBeenCalledTimes(2)
  })
})
