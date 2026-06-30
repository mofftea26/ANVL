import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { buildSeoMeta } from '@/app/seo/meta'
import { Button } from '@/shared/components/ui/Button'
import { AuthPageChrome } from '@/features/storefront-account'
import { resendVerificationStorefront } from '@/features/storefront-account/auth'

type VerifySearch = { email?: string }

export const Route = createFileRoute('/auth/verify-email')({
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  head: () =>
    buildSeoMeta({
      title: 'Verify your email | ANVL Athletics',
      description: 'Confirm your email to activate your ANVL account.',
      path: '/auth/verify-email',
      noIndex: true,
    }),
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { email } = Route.useSearch() as VerifySearch
  const [pending, setPending] = useState(false)

  const resend = async () => {
    if (!email) {
      toast.error('Missing email — sign up again to receive a link.')
      return
    }
    setPending(true)
    const res = await resendVerificationStorefront(email)
    setPending(false)
    toast[res.ok ? 'success' : 'error'](
      res.ok ? 'Verification email sent.' : res.error ?? 'Could not resend right now.',
    )
  }

  return (
    <AuthPageChrome
      title="Check your inbox"
      subtitle={
        email
          ? `We sent a confirmation link to ${email}. Click it to activate your account.`
          : 'We sent you a confirmation link. Click it to activate your account.'
      }
    >
      <div className="space-y-4">
        <p className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
          The link opens ANVL and signs you in automatically. It may take a minute to arrive —
          remember to check spam.
        </p>
        <Button type="button" variant="secondary" className="w-full" onClick={() => void resend()} disabled={pending}>
          {pending ? 'Resending…' : 'Resend verification email'}
        </Button>
        <p className="text-center text-xs text-[var(--color-text-muted)]">
          <a className="underline" href="/auth/sign-in">
            Back to sign in
          </a>
        </p>
      </div>
    </AuthPageChrome>
  )
}
