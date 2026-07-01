import { useCallback } from 'react'
import { useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import type { Customer } from '@/app/config/accountContracts'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import {
  useAddressesForm,
  useUpdateCustomerProfileMutation,
} from '@/features/storefront-account/publicAccount.core'
import { AccountBentoCard } from '@/features/storefront-account/account/AccountBentoCard'
import { accountCardBg, type AccountCardBgKey } from '@/features/storefront-account/account/accountCardBg'
import { useRegisterAccountSave } from '@/features/storefront-account/account/accountSave.store'

const BG_CYCLE: AccountCardBgKey[] = ['steel', 'stone', 'carbon', 'smoke', 'gold', 'ember']

export function AddressesPanel({ customer }: { customer: Customer | undefined }) {
  const mutation = useUpdateCustomerProfileMutation()
  const form = useAddressesForm(customer)
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'addresses' })

  const submit = useCallback(() => {
    void form.handleSubmit((values) => {
      mutation.mutate(
        { addresses: values.addresses },
        {
          onSuccess: () => toast.success('Addresses saved.'),
          onError: () => toast.error('Could not save addresses.'),
        },
      )
    })()
  }, [form, mutation.mutate])
  useRegisterAccountSave('addresses', submit, mutation.isPending)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-4"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {fields.map((field, index) => (
          <AccountBentoCard
            key={field.id}
            bg={accountCardBg(BG_CYCLE[index % BG_CYCLE.length]!)}
            eyebrow={`Address ${index + 1}`}
            icon={<MapPin size={15} />}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Label" htmlFor={`addr-${index}-label`}>
                  <Input id={`addr-${index}-label`} placeholder="Home, gym…" {...form.register(`addresses.${index}.label`)} />
                </FormField>
                <FormField label="Full name" htmlFor={`addr-${index}-name`}>
                  <Input id={`addr-${index}-name`} autoComplete="name" {...form.register(`addresses.${index}.name`)} />
                </FormField>
              </div>
              <FormField label="Street" error={form.formState.errors.addresses?.[index]?.line1?.message} htmlFor={`addr-${index}-line1`}>
                <Input id={`addr-${index}-line1`} autoComplete="address-line1" {...form.register(`addresses.${index}.line1`)} />
              </FormField>
              <FormField label="Apt, floor (optional)" htmlFor={`addr-${index}-line2`}>
                <Input id={`addr-${index}-line2`} autoComplete="address-line2" {...form.register(`addresses.${index}.line2`)} />
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="City" error={form.formState.errors.addresses?.[index]?.city?.message} htmlFor={`addr-${index}-city`}>
                  <Input id={`addr-${index}-city`} autoComplete="address-level2" {...form.register(`addresses.${index}.city`)} />
                </FormField>
                <FormField label="Country" error={form.formState.errors.addresses?.[index]?.country?.message} htmlFor={`addr-${index}-country`}>
                  <Input id={`addr-${index}-country`} autoComplete="country-name" {...form.register(`addresses.${index}.country`)} />
                </FormField>
              </div>
              {fields.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="focus-ring inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[color:var(--color-danger)] hover:opacity-80"
                >
                  <Trash2 size={13} /> Remove
                </button>
              ) : null}
            </div>
          </AccountBentoCard>
        ))}
      </div>

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
          <Plus size={15} /> Add address
        </Button>
      </div>
    </form>
  )
}
