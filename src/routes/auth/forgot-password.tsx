import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { buildSeoMeta } from '@/app/seo/meta'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { AuthPageChrome, useDemoForgotPasswordMutation, useForgotPasswordForm } from '@/features/storefront-account'
import { isStorefrontAuthEnabled, sendPasswordResetStorefront } from '@/features/storefront-account/auth'

export const Route = createFileRoute('/auth/forgot-password')({
  head: () =>
    buildSeoMeta({
      title: 'Forgot password | ANVL Athletics',
      description: 'Reset your ANVL Athletics account password.',
      path: '/auth/forgot-password',
      noIndex: true,
    }),
  component: ForgotPasswordPage,
})

// SEC-13 — always show the same neutral confirmation, never reveal if the email exists.
const NEUTRAL = 'If an account exists for that email, you will receive reset instructions.'

function ForgotPasswordPage() {
  const supabaseAuth = isStorefrontAuthEnabled()
  const mutation = useDemoForgotPasswordMutation()
  const form = useForgotPasswordForm()
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = form.handleSubmit(async (values) => {
    if (supabaseAuth) {
      setPending(true)
      await sendPasswordResetStorefront(values.email) // ignore result (neutral UX)
      setPending(false)
      setSent(true)
      toast.success(NEUTRAL)
      return
    }
    mutation.mutate(values, {
      onSuccess: () => {
        setSent(true)
        toast.success(NEUTRAL)
      },
    })
  })

  const busy = pending || mutation.isPending

  return (
    <AuthPageChrome
      title="Forgot password"
      subtitle={supabaseAuth ? 'We will email you a secure reset link.' : 'Demo: no email is sent yet — this confirms the flow only.'}
    >
      {sent ? (
        <p className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
          {NEUTRAL}
        </p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <FormField label="Email" error={form.formState.errors.email?.message} htmlFor="fp-email">
            <Input id="fp-email" type="email" autoComplete="email" {...form.register('email')} />
          </FormField>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        <a className="underline" href="/auth/sign-in">
          Back to sign in
        </a>
      </p>
    </AuthPageChrome>
  )
}
