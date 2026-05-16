import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { buildSeoMeta } from '@/app/seo/meta'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/app/config/accountMock'
import {
  AuthPageChrome,
  sanitizeInternalRedirect,
  useDemoSignInMutation,
  useHydrateStorefrontAccountSession,
  useSignInForm,
  useStorefrontAccountSession,
} from '@/features/storefront-account'

type SignInSearch = { redirect?: string }

export const Route = createFileRoute('/auth/sign-in')({
  validateSearch: (search: Record<string, unknown>): SignInSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  head: () =>
    buildSeoMeta({
      title: 'Sign In | ANVL Athletics',
      description: 'Sign in to your ANVL Athletics account.',
      path: '/auth/sign-in',
      noIndex: true,
    }),
  component: SignInPage,
})

function SignInPage() {
  useHydrateStorefrontAccountSession()
  const { redirect } = Route.useSearch() as SignInSearch
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const mutation = useDemoSignInMutation()
  const form = useSignInForm()

  useEffect(() => {
    if (customerId) {
      window.location.assign(sanitizeInternalRedirect(redirect))
    }
  }, [customerId, redirect])

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Signed in.')
        window.location.assign(sanitizeInternalRedirect(redirect))
      },
      onError: (err: unknown) => {
        const msg =
          err instanceof Error && err.message === 'INVALID_CREDENTIALS'
            ? 'Check your email and password.'
            : 'Could not sign in.'
        toast.error(msg)
      },
    })
  })

  return (
    <AuthPageChrome
      title="Sign in"
      subtitle={`Demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`}
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField label="Email" error={form.formState.errors.email?.message} htmlFor="auth-in-email">
          <Input id="auth-in-email" type="email" autoComplete="email" {...form.register('email')} />
        </FormField>
        <FormField
          label="Password"
          error={form.formState.errors.password?.message}
          htmlFor="auth-in-password"
        >
          <Input
            id="auth-in-password"
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        <a className="underline" href="/auth/forgot-password">
          Forgot password
        </a>
        {' · '}
        <a className="underline" href="/auth/sign-up">
          Create account
        </a>
      </p>
    </AuthPageChrome>
  )
}
