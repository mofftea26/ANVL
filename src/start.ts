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
    `img-src 'self' data: blob: ${SUPABASE_ORIGIN} ${SHOPIFY_CDN_ORIGIN}`,
    `font-src 'self' data:`,
    `connect-src 'self' blob: ${SUPABASE_ORIGIN} ${SHOPIFY_API_ORIGIN} ${SHOPIFY_CDN_ORIGIN}`,
    `media-src 'self' ${SUPABASE_ORIGIN}`,
    `worker-src 'self' blob:`,
    `frame-ancestors 'none'`,
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

const securityHeadersMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const result = await next()
    const headers = new Headers(result.response.headers)

    const isProduction = process.env.NODE_ENV === 'production'

    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    headers.set('X-Frame-Options', 'DENY')
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
