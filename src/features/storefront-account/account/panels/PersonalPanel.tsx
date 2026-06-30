import { useState } from 'react'
import { toast } from 'sonner'
import { Ruler, User, Phone as PhoneIcon, CalendarDays, Shirt } from 'lucide-react'
import type { Customer, Measurements } from '@/app/config/accountContracts'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import {
  usePersonalInfoForm,
  useUpdateCustomerProfileMutation,
} from '@/features/storefront-account/publicAccount.core'
import { AccountBentoCard } from '@/features/storefront-account/account/AccountBentoCard'
import { AccountAvatar } from '@/features/storefront-account/account/AccountAvatar'
import { PhoneField } from '@/features/storefront-account/account/PhoneField'
import { accountCardBg } from '@/features/storefront-account/account/accountCardBg'

const SELECT =
  'h-11 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-base md:text-sm text-[var(--color-text)] focus-ring'

const MEASUREMENT_FIELDS: { key: keyof Measurements; label: string; unit: string }[] = [
  { key: 'heightCm', label: 'Height', unit: 'cm' },
  { key: 'weightKg', label: 'Weight', unit: 'kg' },
  { key: 'chestCm', label: 'Chest', unit: 'cm' },
  { key: 'waistCm', label: 'Waist', unit: 'cm' },
  { key: 'hipsCm', label: 'Hips', unit: 'cm' },
  { key: 'shoulderCm', label: 'Shoulder', unit: 'cm' },
  { key: 'inseamCm', label: 'Inseam', unit: 'cm' },
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function PersonalPanel({ customer }: { customer: Customer | undefined }) {
  const form = usePersonalInfoForm(customer)
  const mutation = useUpdateCustomerProfileMutation()
  const [measurements, setMeasurements] = useState<Measurements>(customer?.measurements ?? {})

  const phone = form.watch('phone') ?? ''

  const setM = (key: keyof Measurements, raw: string) => {
    const n = raw === '' ? undefined : Number(raw)
    setMeasurements((prev) => {
      const next = { ...prev }
      if (n === undefined || Number.isNaN(n)) delete next[key]
      else next[key] = n
      return next
    })
  }

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        birthdate: values.birthdate || null,
        gender: values.gender || '',
        preferredSize: values.preferredSize || '',
        measurements,
      },
      {
        onSuccess: () => toast.success('Profile saved.'),
        onError: () => toast.error('Could not save your profile.'),
      },
    )
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Identity */}
        <AccountBentoCard bg={accountCardBg('steel')} eyebrow="Identity" icon={<User size={15} />} className="sm:col-span-2 lg:row-span-1">
          <div className="mb-4 mt-1 flex items-center gap-3">
            <AccountAvatar name={`${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`} email={customer?.email} src={customer?.avatarUrl} className="h-14 w-14 text-base" />
            <div className="min-w-0">
              <p className="anvl-heading truncate text-lg text-[var(--color-heading)]">
                {[customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'Your name'}
              </p>
              <p className="anvl-micro truncate text-[var(--color-text-muted)]">{customer?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="First name" error={form.formState.errors.firstName?.message} htmlFor="pi-first">
              <Input id="pi-first" autoComplete="given-name" {...form.register('firstName')} />
            </FormField>
            <FormField label="Last name" error={form.formState.errors.lastName?.message} htmlFor="pi-last">
              <Input id="pi-last" autoComplete="family-name" {...form.register('lastName')} />
            </FormField>
          </div>
        </AccountBentoCard>

        {/* Contact */}
        <AccountBentoCard bg={accountCardBg('carbon')} eyebrow="Contact" icon={<PhoneIcon size={15} />}>
          <FormField label="Phone" htmlFor="pi-phone">
            <PhoneField id="pi-phone" value={phone} onChange={(v) => form.setValue('phone', v, { shouldDirty: true })} />
          </FormField>
          <p className="anvl-micro mt-2 text-[var(--color-text-muted)]">Used for delivery updates only.</p>
        </AccountBentoCard>

        {/* Details */}
        <AccountBentoCard bg={accountCardBg('stone')} eyebrow="Details" icon={<CalendarDays size={15} />}>
          <FormField label="Date of birth" htmlFor="pi-dob">
            <Input id="pi-dob" type="date" {...form.register('birthdate')} />
          </FormField>
          <FormField label="Gender" htmlFor="pi-gender">
            <select id="pi-gender" className={SELECT} {...form.register('gender')}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FormField>
        </AccountBentoCard>

        {/* Fit / preferred size */}
        <AccountBentoCard bg={accountCardBg('gold')} eyebrow="Fit" icon={<Shirt size={15} />}>
          <FormField label="Preferred size" htmlFor="pi-size">
            <select id="pi-size" className={SELECT} {...form.register('preferredSize')}>
              <option value="">No preference</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <p className="anvl-micro mt-2 text-[var(--color-text-muted)]">
            We&rsquo;ll use your measurements below to suggest sizes on products.
          </p>
        </AccountBentoCard>

        {/* Measurements */}
        <AccountBentoCard bg={accountCardBg('smoke')} eyebrow="Measurements" icon={<Ruler size={15} />} className="sm:col-span-2 lg:col-span-3">
          <p className="anvl-micro mb-3 text-[var(--color-text-muted)]">
            Optional — power smarter size recommendations. Leave blank to skip.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {MEASUREMENT_FIELDS.map((f) => (
              <FormField key={f.key} label={`${f.label} (${f.unit})`} htmlFor={`m-${f.key}`}>
                <Input
                  id={`m-${f.key}`}
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={measurements[f.key] ?? ''}
                  onChange={(e) => setM(f.key, e.target.value)}
                />
              </FormField>
            ))}
          </div>
        </AccountBentoCard>
      </div>

      <div className="sticky bottom-3 z-20 flex justify-end">
        <Button type="submit" disabled={mutation.isPending} className="shadow-[0_12px_30px_-12px_rgba(0,0,0,0.9)]">
          {mutation.isPending ? 'Saving…' : 'Save profile'}
        </Button>
      </div>
    </form>
  )
}
