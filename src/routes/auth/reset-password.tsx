import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { buildSeoMeta } from '@/app/seo/meta'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { AuthPageChrome, useNewPasswordForm } from '@/features/storefront-account'
import {
  isStorefrontAuthEnabled,
  updatePasswordStorefront,
} from '@/features/storefront-account/auth'

export const Route = createFileRoute('/auth/reset-password')({
  head: () =>
    buildSeoMeta({
      title: 'Reset password | ANVL Athletics',
      description: 'Set a new password for your ANVL account.',
      path: '/auth/reset-password',
      noIndex: true,
    }),
  component: ResetPasswordPage,
})

/**
 * Reached from the password-reset email link. Supabase establishes a temporary
 * recovery session (detectSessionInUrl) and fires PASSWORD_RECOVERY; the form
 * then sets the new password via updateUser.
 */
function ResetPasswordPage() {
  const form = useNewPasswordForm()
  const [pending, setPending] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isStorefrontAuthEnabled()) return
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    // Lazy — see the note in /auth/callback. This route and that one were the
    // last two static importers of the Supabase client, which made Rolldown
    // hoist ~200 KB of SDK into the storefront ENTRY chunk.
    void (async () => {
      const { getStorefrontSupabaseClient } = await import(
        '@/features/storefront-account/auth/storefrontSupabaseClient'
      )
      if (cancelled) return
      const client = getStorefrontSupabaseClient()
      if (!client) return
      void client.auth.getSession().then(({ data }) => {
        if (!cancelled && data.session) setReady(true)
      })
      const { data: sub } = client.auth.onAuthStateChange((event, session) => {
        if (!cancelled && (event === 'PASSWORD_RECOVERY' || session)) setReady(true)
      })
      unsubscribe = () => sub.subscription.unsubscribe()
    })()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    const res = await updatePasswordStorefront(values.password)
    setPending(false)
    if (res.ok) {
      toast.success('Password updated. You are signed in.')
      window.location.assign('/account')
    } else {
      toast.error(res.error ?? 'Could not update password. Request a new link.')
    }
  })

  return (
    <AuthPageChrome
      title="Set a new password"
      subtitle={ready ? 'Choose a strong password for your account.' : 'Open this page from your reset email link.'}
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField label="New password" error={form.formState.errors.password?.message} htmlFor="rp-pass">
          <Input id="rp-pass" type="password" autoComplete="new-password" {...form.register('password')} />
        </FormField>
        <FormField
          label="Confirm password"
          error={form.formState.errors.confirmPassword?.message}
          htmlFor="rp-pass2"
        >
          <Input id="rp-pass2" type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
        </FormField>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Updating…' : 'Update password'}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        <a className="underline" href="/auth/sign-in">
          Back to sign in
        </a>
      </p>
    </AuthPageChrome>
  )
}
