import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { buildSeoMeta } from '@/app/seo/meta'
import { AuthPageChrome, sanitizeInternalRedirect } from '@/features/storefront-account'
import { isStorefrontAuthEnabled } from '@/features/storefront-account/auth'
import { setSessionCustomerId } from '@/app/config/accountSession'

type CallbackSearch = { redirect?: string }

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>): CallbackSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  head: () =>
    buildSeoMeta({
      title: 'Signing you in | ANVL Athletics',
      description: 'Completing sign-in.',
      path: '/auth/callback',
      noIndex: true,
    }),
  component: CallbackPage,
})

/**
 * Lands here after an OAuth provider redirect or an email-confirmation link.
 * The storefront Supabase client has `detectSessionInUrl: true`, so it parses
 * the token from the URL; we wait for the session, then redirect to the
 * intended destination (or /account).
 */
function CallbackPage() {
  const { redirect } = Route.useSearch() as CallbackSearch
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!isStorefrontAuthEnabled()) {
      window.location.assign('/auth/sign-in')
      return
    }
    let done = false
    let cancelled = false
    // Assigned once the lazy import resolves; the cleanup below may run first.
    let cleanup: (() => void) | undefined

    const go = (userId: string) => {
      if (done) return
      done = true
      setSessionCustomerId(userId)
      window.location.assign(sanitizeInternalRedirect(redirect))
    }

    // Lazy: this route and /auth/reset-password were the last two static
    // importers of the Supabase client. Two lazy route chunks sharing a module
    // makes Rolldown hoist it into the ENTRY chunk, so ~200 KB of SDK was
    // fetched on every storefront page. Deferring it here costs one dynamic
    // import on a page that exists to talk to Supabase anyway.
    void (async () => {
      const { getStorefrontSupabaseClient } = await import(
        '@/features/storefront-account/auth/storefrontSupabaseClient'
      )
      if (cancelled) return
      const client = getStorefrontSupabaseClient()
      if (!client) {
        window.location.assign('/auth/sign-in')
        return
      }
      void client.auth.getSession().then(({ data }) => {
        if (!cancelled && data.session?.user) go(data.session.user.id)
      })
      const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
        if (!cancelled && session?.user) go(session.user.id)
      })
      const timeout = window.setTimeout(() => {
        if (!done) setFailed(true)
      }, 8000)
      cleanup = () => {
        sub.subscription.unsubscribe()
        window.clearTimeout(timeout)
      }
    })()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [redirect])

  return (
    <AuthPageChrome
      title={failed ? 'Sign-in incomplete' : 'Signing you in…'}
      subtitle={failed ? 'We could not complete sign-in.' : 'One moment while we finish up.'}
    >
      {failed ? (
        <p className="text-center text-sm text-[var(--color-text-muted)]">
          <a className="underline" href="/auth/sign-in">
            Return to sign in
          </a>
        </p>
      ) : (
        <p className="anvl-micro text-center text-[var(--color-text-muted)]">Completing your session…</p>
      )}
    </AuthPageChrome>
  )
}
