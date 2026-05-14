import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { buildSeoMeta } from '@/app/seo/meta'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { AuthPageChrome, useDemoForgotPasswordMutation, useForgotPasswordForm } from '@/features/storefront-account'

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

function ForgotPasswordPage() {
  const mutation = useDemoForgotPasswordMutation()
  const form = useForgotPasswordForm()

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('If an account exists for that email, you will receive reset instructions.')
      },
    })
  })

  return (
    <AuthPageChrome
      title="Forgot password"
      subtitle="Demo: no email is sent yet — this confirms the flow only."
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField label="Email" error={form.formState.errors.email?.message} htmlFor="fp-email">
          <Input id="fp-email" type="email" autoComplete="email" {...form.register('email')} />
        </FormField>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Sending…' : 'Send reset link'}
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
