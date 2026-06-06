import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { buildSeoMeta } from '@/app/seo/meta'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import {
  useCustomerProfileQuery,
  usePersonalInfoForm,
  useUpdateCustomerProfileMutation,
} from '@/features/storefront-account'

export const Route = createFileRoute('/account/personal')({
  head: () =>
    buildSeoMeta({
      title: 'Personal info | ANVL Athletics',
      description: 'Update your ANVL Athletics account details.',
      path: '/account/personal',
      noIndex: true,
    }),
  component: PersonalPage,
})

function PersonalPage() {
  const { data: customer, isLoading } = useCustomerProfileQuery()
  const mutation = useUpdateCustomerProfileMutation()
  const form = usePersonalInfoForm(customer)

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
  }

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
      },
      {
        onSuccess: () => toast.success('Profile updated.'),
        onError: () => toast.error('Could not save changes.'),
      },
    )
  })

  return (
    <div className="max-w-md">
      <h2 className="anvl-heading text-2xl font-normal sm:text-3xl">Personal info</h2>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">How we reach you about your orders.</p>

      <form
        className="mt-8 space-y-4 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
        onSubmit={onSubmit}
        noValidate
      >
        <FormField label="First name" error={form.formState.errors.firstName?.message} htmlFor="pi-first">
          <Input id="pi-first" autoComplete="given-name" {...form.register('firstName')} />
        </FormField>
        <FormField label="Last name" error={form.formState.errors.lastName?.message} htmlFor="pi-last">
          <Input id="pi-last" autoComplete="family-name" {...form.register('lastName')} />
        </FormField>
        <FormField label="Phone" error={form.formState.errors.phone?.message} htmlFor="pi-phone">
          <Input id="pi-phone" type="tel" autoComplete="tel" {...form.register('phone')} />
        </FormField>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </div>
  )
}
