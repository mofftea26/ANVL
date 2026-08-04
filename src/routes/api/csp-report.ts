import { createFileRoute } from '@tanstack/react-router'
import { checkRateLimit, clientIpFromHeaders } from '@/rateLimit.server'

/**
 * Collects `Content-Security-Policy-Report-Only` violation reports (see
 * `src/start.ts`'s `report-uri` directive). Minimal by design: this logs to
 * the server console/stdout so violations are visible during the report-only
 * trial period ahead of switching the policy to enforcing — it does not
 * persist reports anywhere. Wiring this to a real log aggregator/alerting
 * pipeline is future work once one exists for this project; not scoped here.
 *
 * `report-uri` (not the newer `report-to` + `Reporting-Endpoints` pair) is
 * used in the CSP header specifically because it works in every browser
 * without extra headers — Safari in particular doesn't support the Reporting
 * API that `report-to` depends on.
 */
export const Route = createFileRoute('/api/csp-report')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Unauthenticated and unbounded before this (F-07): anyone could POST
        // here in a loop and flood the Worker logs. Fail-open — see
        // `rateLimit.server.ts`; a missing binding never blocks traffic.
        const ip = clientIpFromHeaders((n) => request.headers.get(n))
        const { allowed } = await checkRateLimit('CSP_REPORT_RATE_LIMIT', ip)
        if (!allowed) return new Response(null, { status: 429 })

        try {
          const report = await request.json()
          console.warn('[CSP violation]', JSON.stringify(report))
        } catch {
          // Malformed report body — nothing to log, still ack so the
          // browser doesn't retry.
        }
        return new Response(null, { status: 204 })
      },
    },
  },
})
