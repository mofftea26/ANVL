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

const CSP_REPORT_ONLY = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: ${SUPABASE_ORIGIN} ${SHOPIFY_CDN_ORIGIN}`,
  `font-src 'self' data:`,
  `connect-src 'self' ${SUPABASE_ORIGIN} ${SHOPIFY_API_ORIGIN} ${SHOPIFY_CDN_ORIGIN}`,
  `media-src 'self' ${SUPABASE_ORIGIN}`,
  `worker-src 'self' blob:`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  // Collected by src/routes/api/csp-report.ts — server-console logging only
  // for now, ahead of switching this policy to enforcing.
  `report-uri /api/csp-report`,
].join('; ')

function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

const securityHeadersMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const result = await next()
    const headers = new Headers(result.response.headers)

    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    headers.set('X-Frame-Options', 'DENY')
    headers.set('Content-Security-Policy-Report-Only', CSP_REPORT_ONLY)
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
      const isProduction = process.env.NODE_ENV === 'production'
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
