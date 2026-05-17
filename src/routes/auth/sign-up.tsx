import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { buildSeoMeta } from '@/app/seo/meta'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import {
  AuthPageChrome,
  sanitizeInternalRedirect,
  useDemoSignUpMutation,
  useHydrateStorefrontAccountSession,
  useSignUpForm,
  useStorefrontAccountSession,
} from '@/features/storefront-account'

type SignUpSearch = { redirect?: string }

export const Route = createFileRoute('/auth/sign-up')({
  validateSearch: (search: Record<string, unknown>): SignUpSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  head: () =>
    buildSeoMeta({
      title: 'Create account | ANVL Athletics',
      description: 'Create your ANVL Athletics customer account.',
      path: '/auth/sign-up',
      noIndex: true,
    }),
  component: SignUpPage,
})

function SignUpPage() {
  useHydrateStorefrontAccountSession()
  const { redirect } = Route.useSearch() as SignUpSearch
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const mutation = useDemoSignUpMutation()
  const form = useSignUpForm()

  useEffect(() => {
    if (customerId) {
      window.location.assign(sanitizeInternalRedirect(redirect))
    }
  }, [customerId, redirect])

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(
      {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      },
      {
        onSuccess: () => {
          toast.success('Welcome to ANVL.')
          window.location.assign(sanitizeInternalRedirect(redirect))
        },
        // SEC-13 — never disclose whether the email is already registered.
        // Both the "email taken" branch and any other failure surface the
        // same neutral message; an attacker can't enumerate accounts from
        // sign-up responses. Real auth (Phase J1) should also match
        // success-response *timing* server-side.
        onError: () => {
          toast.error(
            'Could not create account. Check your details and try again.',
          )
        },
      },
    )
  })

  return (
    <AuthPageChrome
      title="Create account"
      subtitle="Optional — you can still check out as a guest."
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField label="First name" error={form.formState.errors.firstName?.message} htmlFor="su-first">
          <Input id="su-first" autoComplete="given-name" {...form.register('firstName')} />
        </FormField>
        <FormField label="Last name" error={form.formState.errors.lastName?.message} htmlFor="su-last">
          <Input id="su-last" autoComplete="family-name" {...form.register('lastName')} />
        </FormField>
        <FormField label="Email" error={form.formState.errors.email?.message} htmlFor="su-email">
          <Input id="su-email" type="email" autoComplete="email" {...form.register('email')} />
        </FormField>
        <FormField label="Password" error={form.formState.errors.password?.message} htmlFor="su-pass">
          <Input id="su-pass" type="password" autoComplete="new-password" {...form.register('password')} />
        </FormField>
        <FormField
          label="Confirm password"
          error={form.formState.errors.confirmPassword?.message}
          htmlFor="su-pass2"
        >
          <Input
            id="su-pass2"
            type="password"
            autoComplete="new-password"
            {...form.register('confirmPassword')}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        <a className="underline" href="/auth/sign-in">
          Already have an account?
        </a>
      </p>
    </AuthPageChrome>
  )
}
