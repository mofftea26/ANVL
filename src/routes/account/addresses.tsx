import { createFileRoute } from '@tanstack/react-router'
import { useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { buildSeoMeta } from '@/app/seo/meta'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import {
  useAddressesForm,
  useCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
} from '@/features/storefront-account'

export const Route = createFileRoute('/account/addresses')({
  head: () =>
    buildSeoMeta({
      title: 'Addresses | ANVL Athletics',
      description: 'Manage shipping addresses for ANVL Athletics orders.',
      path: '/account/addresses',
      noIndex: true,
    }),
  component: AddressesPage,
})

function AddressesPage() {
  const { data: customer, isLoading } = useCustomerProfileQuery()
  const mutation = useUpdateCustomerProfileMutation()
  const form = useAddressesForm(customer)
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'addresses' })

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
  }

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(
      { addresses: values.addresses },
      {
        onSuccess: () => toast.success('Addresses saved.'),
        onError: () => toast.error('Could not save addresses.'),
      },
    )
  })

  return (
    <div>
      <h2 className="anvl-heading text-3xl">Addresses</h2>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Used as defaults at checkout. Lebanon deliveries prioritize Beirut and major cities.
      </p>

      <form className="mt-8 space-y-8" onSubmit={onSubmit} noValidate>
        {fields.map((field, index) => (
          <fieldset
            key={field.id}
            className="space-y-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <legend className="px-1 text-sm font-semibold text-[var(--color-heading)]">
              Address {index + 1}
            </legend>
            <FormField
              label="Label"
              error={form.formState.errors.addresses?.[index]?.label?.message}
              htmlFor={`addr-${index}-label`}
            >
              <Input id={`addr-${index}-label`} placeholder="Home, gym…" {...form.register(`addresses.${index}.label`)} />
            </FormField>
            <FormField
              label="Full name"
              error={form.formState.errors.addresses?.[index]?.name?.message}
              htmlFor={`addr-${index}-name`}
            >
              <Input id={`addr-${index}-name`} autoComplete="name" {...form.register(`addresses.${index}.name`)} />
            </FormField>
            <FormField
              label="Street"
              error={form.formState.errors.addresses?.[index]?.line1?.message}
              htmlFor={`addr-${index}-line1`}
            >
              <Input id={`addr-${index}-line1`} autoComplete="address-line1" {...form.register(`addresses.${index}.line1`)} />
            </FormField>
            <FormField
              label="Apt, floor (optional)"
              error={form.formState.errors.addresses?.[index]?.line2?.message}
              htmlFor={`addr-${index}-line2`}
            >
              <Input id={`addr-${index}-line2`} autoComplete="address-line2" {...form.register(`addresses.${index}.line2`)} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="City"
                error={form.formState.errors.addresses?.[index]?.city?.message}
                htmlFor={`addr-${index}-city`}
              >
                <Input id={`addr-${index}-city`} autoComplete="address-level2" {...form.register(`addresses.${index}.city`)} />
              </FormField>
              <FormField
                label="Country"
                error={form.formState.errors.addresses?.[index]?.country?.message}
                htmlFor={`addr-${index}-country`}
              >
                <Input id={`addr-${index}-country`} autoComplete="country-name" {...form.register(`addresses.${index}.country`)} />
              </FormField>
            </div>
            <FormField
              label="Phone (optional)"
              error={form.formState.errors.addresses?.[index]?.phone?.message}
              htmlFor={`addr-${index}-phone`}
            >
              <Input id={`addr-${index}-phone`} type="tel" autoComplete="tel" {...form.register(`addresses.${index}.phone`)} />
            </FormField>
            {fields.length > 1 ? (
              <Button type="button" variant="ghost" className="text-red-400" onClick={() => remove(index)}>
                Remove address
              </Button>
            ) : null}
          </fieldset>
        ))}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              append({
                id: `addr-${Math.random().toString(36).slice(2, 10)}`,
                line1: '',
                city: '',
                country: 'Lebanon',
              })
            }
          >
            Add address
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save addresses'}
          </Button>
        </div>
      </form>
    </div>
  )
}
