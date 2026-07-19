import { createMiddleware, createStart } from '@tanstack/react-start'
import { CSRF_COOKIE_NAME, readCsrfCookieFromHeader } from '@/features/admin/auth/adminCsrf'

/**
 * Security headers applied to every server response (SSR pages, server
 * routes, and server function calls — request middleware runs on all of
 * them, per TanStack Start's middleware model).
 *
 * CSP ships in `Content-Security-Policy-Report-Only` first: the storefront
 * loads GSAP, Three.js/WebGL, Lenis, and calls out to Supabase + Shopify's
 * Storefront API + CDN, and a wrong `script-src`/`connect-src` could silently
 * break the home page's cinematic experience or checkout. Report-only lets
 * violations surface (via the browser console and the `report-uri` endpoint
 * at `src/routes/api/csp-report.ts`) without blocking anything, so the
 * policy can be tightened with real evidence before ever switching to
 * enforcing mode.
 */
const SUPABASE_ORIGIN = 'https://cptebkgyrfmokklwtrgp.supabase.co'
const SHOPIFY_API_ORIGIN = 'https://anvl-2.myshopify.com'
const SHOPIFY_CDN_ORIGIN = 'https://cdn.shopify.com'
// Google account avatars (OAuth sign-in) are served from lh3–lh6.googleusercontent.com.
const GOOGLE_AVATAR_ORIGIN = 'https://*.googleusercontent.com'

/**
 * Report-only CSP. Built per-request so the dev-only relaxations aren't baked
 * into the production policy.
 *
 * - `'wasm-unsafe-eval'` (script-src): three.js / @react-three/drei instantiate
 *   WebAssembly (Draco/KTX2/Basis decoders) for the WebGL scenes. Browsers
 *   classify WASM compilation as `wasm-eval`; without this token the models
 *   break the moment the policy is switched to enforcing. It does NOT permit
 *   JS `eval`, so it's a safe prod inclusion.
 * - `blob:` (connect-src): three.js fetches blob: URLs (worker/asset loading).
 * - `'unsafe-eval'` (script-src, DEV ONLY): Vite's HMR client and the TanStack
 *   devtools use `eval` in development. Kept out of the production policy so
 *   prod stays strict; if a real prod `eval` violation ever shows up in the
 *   report-uri logs, add it deliberately with that evidence.
 */
function buildCspReportOnly(isDev: boolean): string {
  const scriptSrc = [
    `'self'`,
    `'unsafe-inline'`,
    `'wasm-unsafe-eval'`,
    ...(isDev ? [`'unsafe-eval'`] : []),
  ].join(' ')

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${SUPABASE_ORIGIN} ${SHOPIFY_CDN_ORIGIN} ${GOOGLE_AVATAR_ORIGIN}`,
    `font-src 'self' data:`,
    `connect-src 'self' blob: ${SUPABASE_ORIGIN} ${SHOPIFY_API_ORIGIN} ${SHOPIFY_CDN_ORIGIN}`,
    `media-src 'self' ${SUPABASE_ORIGIN}`,
    `worker-src 'self' blob:`,
    // 'self' (not 'none'): the admin live-preview embeds the storefront in a
    // same-origin iframe. Third-party framing stays blocked.
    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    // Collected by src/routes/api/csp-report.ts — server-console logging only
    // for now, ahead of switching this policy to enforcing.
    `report-uri /api/csp-report`,
  ].join('; ')
}

function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

/**
 * Cache-Control for Worker responses (SSR HTML + all dynamic output). Static
 * hashed build assets are served by the Cloudflare Workers Assets binding —
 * not this Worker — and get long-lived immutable caching from `public/_headers`,
 * so they never pass through here.
 *
 * - Private / dynamic routes (admin, CMS, API, auth, account, checkout) and any
 *   non-HTML Worker response (TanStack server-function RPC, JSON): `no-store`.
 * - Public SSR HTML: `public, max-age=0, must-revalidate` — always revalidated,
 *   so a CMS change (e.g. flipping the Coming Soon toggle) shows on the next
 *   load with no stale edge/browser copy, while still allowing conditional
 *   revalidation rather than a blind refetch.
 */
const PRIVATE_PATH_PREFIXES = [
  '/admin',
  '/cms',
  '/api',
  '/auth',
  '/account',
  '/checkout',
] as const

function cacheControlForResponse(pathname: string, contentType: string): string {
  const isPrivate = PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (isPrivate) return 'no-store'
  if (contentType.includes('text/html')) return 'public, max-age=0, must-revalidate'
  // Server-function RPC, JSON, and any other dynamic Worker output.
  return 'no-store'
}

const securityHeadersMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const result = await next()
    const headers = new Headers(result.response.headers)

    const isProduction = process.env.NODE_ENV === 'production'

    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    // SAMEORIGIN (not DENY): the admin live-preview iframes the storefront on
    // our own origin; cross-site framing stays blocked.
    headers.set('X-Frame-Options', 'SAMEORIGIN')
    // Centralized cache policy for everything this Worker serves. Hashed static
    // assets are handled separately by Workers Assets + `public/_headers`.
    headers.set(
      'Cache-Control',
      cacheControlForResponse(
        new URL(request.url).pathname,
        headers.get('content-type') ?? '',
      ),
    )
    headers.set(
      'Content-Security-Policy-Report-Only',
      buildCspReportOnly(!isProduction),
    )
    // HSTS only makes sense once actually served over HTTPS in production —
    // browsers ignore it over plain HTTP (e.g. local dev), so this is safe
    // to always set.
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    )

    // Issue the CSRF double-submit cookie once per browser if it's missing.
    // Non-HttpOnly (client JS must read it to echo it back as a header, per
    // `adminCsrf.ts`) but still SameSite=Lax + Secure-in-production.
    if (!readCsrfCookieFromHeader(request.headers.get('cookie'))) {
      const attrs = [
        `${CSRF_COOKIE_NAME}=${randomToken()}`,
        'Path=/',
        'SameSite=Lax',
        ...(isProduction ? ['Secure'] : []),
      ]
      headers.append('Set-Cookie', attrs.join('; '))
    }

    return {
      ...result,
      response: new Response(result.response.body, {
        status: result.response.status,
        statusText: result.response.statusText,
        headers,
      }),
    }
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware],
}))
