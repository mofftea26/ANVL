import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { buildSeoMeta } from '@/app/seo/meta'
import { AuthPageChrome, sanitizeInternalRedirect } from '@/features/storefront-account'
import { getStorefrontSupabaseClient, isStorefrontAuthEnabled } from '@/features/storefront-account/auth'
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
    const client = getStorefrontSupabaseClient()
    if (!client) {
      window.location.assign('/auth/sign-in')
      return
    }
    let done = false
    const go = (userId: string) => {
      if (done) return
      done = true
      setSessionCustomerId(userId)
      window.location.assign(sanitizeInternalRedirect(redirect))
    }
    void client.auth.getSession().then(({ data }) => {
      if (data.session?.user) go(data.session.user.id)
    })
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
      if (session?.user) go(session.user.id)
    })
    const timeout = window.setTimeout(() => {
      if (!done) setFailed(true)
    }, 8000)
    return () => {
      sub.subscription.unsubscribe()
      window.clearTimeout(timeout)
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
