/**
 * Rate limiting for the two unauthenticated surfaces that had none (F-07):
 * admin sign-in (brute force) and the CSP report endpoint (unbounded anon
 * POSTs). Backed by Cloudflare's native Rate Limiting binding — no dependency,
 * no KV, no counters of our own.
 *
 * FAIL-OPEN, deliberately. Every failure path — binding not provisioned yet,
 * running under Node/vitest instead of workerd, the binding throwing — returns
 * `allowed: true`. The worst case is therefore exactly today's behaviour (no
 * limiting), never a site that refuses traffic because a binding is missing.
 * Failing closed on an infra detail would be a far worse regression than the
 * gap it closes.
 *
 * The bindings are declared in `wrangler.jsonc` and only exist on a deployed
 * Worker; locally this module resolves to "unavailable" and allows everything.
 */

export type RateLimitBinding = 'ADMIN_LOGIN_RATE_LIMIT' | 'CSP_REPORT_RATE_LIMIT'

export interface RateLimitOutcome {
  allowed: boolean
  /** 'unavailable' means the limiter could not run, not that the caller passed. */
  reason: 'ok' | 'limited' | 'unavailable'
}

const ALLOWED: RateLimitOutcome = { allowed: true, reason: 'unavailable' }

interface CloudflareRateLimiter {
  limit: (options: { key: string }) => Promise<{ success: boolean }>
}

/** `undefined` = not looked up yet; `null` = looked up and unavailable. */
let cachedEnv: Record<string, unknown> | null | undefined

async function workerEnv(): Promise<Record<string, unknown> | null> {
  if (cachedEnv !== undefined) return cachedEnv
  try {
    // Indirect specifier so the bundler cannot statically resolve (and fail on)
    // a workerd-only module. On any non-workerd runtime this simply throws and
    // we fall through to the fail-open path.
    const specifier = 'cloudflare:workers'
    const mod: unknown = await import(/* @vite-ignore */ specifier)
    const env = (mod as { env?: Record<string, unknown> } | null)?.env
    cachedEnv = env && typeof env === 'object' ? env : null
  } catch {
    cachedEnv = null
  }
  return cachedEnv
}

/**
 * @param key Bucket identity — the client IP. Callers pass `unknown` when the
 *   IP header is absent, which buckets all such callers together; that is
 *   intentional (a request with no `CF-Connecting-IP` is not normal traffic).
 */
export async function checkRateLimit(
  binding: RateLimitBinding,
  key: string,
): Promise<RateLimitOutcome> {
  const env = await workerEnv()
  if (!env) return ALLOWED

  const limiter = env[binding] as CloudflareRateLimiter | undefined
  if (!limiter || typeof limiter.limit !== 'function') return ALLOWED

  try {
    const { success } = await limiter.limit({ key })
    return success
      ? { allowed: true, reason: 'ok' }
      : { allowed: false, reason: 'limited' }
  } catch {
    return ALLOWED
  }
}

/** Cloudflare's real client IP, or a shared bucket when the header is absent. */
export function clientIpFromHeaders(
  get: (name: string) => string | null | undefined,
): string {
  return get('cf-connecting-ip')?.trim() || get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
