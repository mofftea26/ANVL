import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ArrowUpRight, Ruler, User, Phone as PhoneIcon, CalendarDays, Shirt, Sparkles } from 'lucide-react'
import type { Customer, Measurements } from '@/app/config/accountContracts'
import { suggestSizeFromMeasurements } from '@/features/products/sizing/suggestSize'
import { cn } from '@/shared/lib/cn'
import { DatePicker } from '@/shared/components/ui/DatePicker'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Select, SelectItem } from '@/shared/components/ui/Select'
import {
  usePersonalInfoForm,
  useUpdateCustomerProfileMutation,
} from '@/features/storefront-account/publicAccount.core'
import { AccountBentoCard } from '@/features/storefront-account/account/AccountBentoCard'
import { AccountAvatar } from '@/features/storefront-account/account/AccountAvatar'
import { PhoneField } from '@/features/storefront-account/account/PhoneField'
import { accountCardBg } from '@/features/storefront-account/account/accountCardBg'
import { useRegisterAccountSave } from '@/features/storefront-account/account/accountSave.store'

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

/** Generated forged-emblem avatar illustrations the user can pick. */
const EMBLEM_AVATARS = [
  '/account/avatars/emblem-anvil.webp',
  '/account/avatars/emblem-flame.webp',
  '/account/avatars/emblem-mountain.webp',
  '/account/avatars/emblem-lion.webp',
]

export function PersonalPanel({ customer }: { customer: Customer | undefined }) {
  const form = usePersonalInfoForm(customer)
  const mutation = useUpdateCustomerProfileMutation()
  const [measurements, setMeasurements] = useState<Measurements>(customer?.measurements ?? {})
  const [avatarUrl, setAvatarUrl] = useState<string>(customer?.avatarUrl ?? '')
  const suggestion = suggestSizeFromMeasurements(measurements)

  // `customer` loads asynchronously and is often still undefined on first
  // render, so the lazy useState initializers above miss it. Sync once the
  // profile (including a Google-backfilled avatar) actually arrives — keyed on
  // id so it fires exactly once per session, never clobbering in-progress edits.
  useEffect(() => {
    if (!customer) return
    setMeasurements(customer.measurements ?? {})
    setAvatarUrl(customer.avatarUrl ?? '')
  }, [customer?.id])

  const phone = form.watch('phone') ?? ''
  const gender = form.watch('gender') ?? ''
  const preferredSize = form.watch('preferredSize') ?? ''
  const birthdate = form.watch('birthdate') ?? ''

  const setM = (key: keyof Measurements, raw: string) => {
    const n = raw === '' ? undefined : Number(raw)
    setMeasurements((prev) => {
      const next = { ...prev }
      if (n === undefined || Number.isNaN(n)) delete next[key]
      else next[key] = n
      return next
    })
  }

  const submit = useCallback(() => {
    void form.handleSubmit((values) => {
      mutation.mutate(
        {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || undefined,
          birthdate: values.birthdate || null,
          gender: values.gender || '',
          preferredSize: values.preferredSize || '',
          measurements,
          avatarUrl,
        },
        {
          onSuccess: () => toast.success('Profile saved.'),
          onError: () => toast.error('Could not save your profile.'),
        },
      )
    })()
  }, [form, mutation.mutate, measurements, avatarUrl])
  useRegisterAccountSave('personal', submit, mutation.isPending)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-4"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Identity */}
        <AccountBentoCard bg={accountCardBg('steel')} eyebrow="Identity" icon={<User size={15} />} className="sm:col-span-2 lg:col-span-2">
          <div className="mb-3 mt-1 flex items-center gap-3">
            <AccountAvatar
              firstName={customer?.firstName}
              lastName={customer?.lastName}
              email={customer?.email}
              src={avatarUrl || undefined}
              className="h-14 w-14 text-base"
            />
            <div className="min-w-0">
              <p className="anvl-heading truncate text-lg text-[var(--color-heading)]">
                {[customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'Your name'}
              </p>
              <p className="anvl-micro truncate text-[var(--color-text-muted)]">{customer?.email}</p>
            </div>
          </div>
          {/* Avatar picker — initials, your Google picture (if signed in with Google), or a forged emblem. */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Use initials"
              aria-pressed={!avatarUrl}
              onClick={() => setAvatarUrl('')}
              className={cn(
                'focus-ring grid h-9 w-9 place-items-center rounded-full text-[10px] ring-2 transition',
                !avatarUrl ? 'ring-[var(--color-accent)]' : 'opacity-70 ring-transparent hover:opacity-100',
              )}
            >
              <AccountAvatar
                firstName={customer?.firstName}
                lastName={customer?.lastName}
                email={customer?.email}
                className="h-9 w-9 text-[10px]"
              />
            </button>
            {customer?.googleAvatarUrl ? (
              <button
                type="button"
                aria-label="Use Google profile picture"
                aria-pressed={avatarUrl === customer.googleAvatarUrl}
                onClick={() => setAvatarUrl(customer.googleAvatarUrl!)}
                className={cn(
                  'focus-ring h-9 w-9 overflow-hidden rounded-full ring-2 transition',
                  avatarUrl === customer.googleAvatarUrl
                    ? 'ring-[var(--color-accent)]'
                    : 'opacity-70 ring-transparent hover:opacity-100',
                )}
              >
                <img src={customer.googleAvatarUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ) : null}
            {EMBLEM_AVATARS.map((src) => (
              <button
                key={src}
                type="button"
                aria-label="Use emblem avatar"
                aria-pressed={avatarUrl === src}
                onClick={() => setAvatarUrl(src)}
                className={cn(
                  'focus-ring h-9 w-9 overflow-hidden rounded-full ring-2 transition',
                  avatarUrl === src ? 'ring-[var(--color-accent)]' : 'opacity-70 ring-transparent hover:opacity-100',
                )}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
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
            <DatePicker
              id="pi-dob"
              value={birthdate}
              onChange={(v) => form.setValue('birthdate', v, { shouldDirty: true })}
              maxDate={new Date()}
            />
          </FormField>
          <FormField label="Gender" htmlFor="pi-gender">
            <Select
              id="pi-gender"
              value={gender || 'preferNotToSay'}
              onValueChange={(v) =>
                form.setValue('gender', v as typeof gender, { shouldDirty: true })
              }
            >
              <SelectItem value="preferNotToSay">Prefer not to say</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </Select>
          </FormField>
        </AccountBentoCard>

        {/* Fit / preferred size */}
        <AccountBentoCard bg={accountCardBg('gold')} eyebrow="Fit" icon={<Shirt size={15} />}>
          <FormField label="Preferred size" htmlFor="pi-size">
            <Select
              id="pi-size"
              value={preferredSize || 'none'}
              onValueChange={(v) =>
                form.setValue('preferredSize', v === 'none' ? '' : v, { shouldDirty: true })
              }
            >
              <SelectItem value="none">No preference</SelectItem>
              {SIZES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </Select>
          </FormField>
          <p className="anvl-micro mt-2 text-[var(--color-text-muted)]">
            We&rsquo;ll use your measurements to suggest sizes on products.
          </p>
        </AccountBentoCard>

        {/* Suggested size (live from measurements) */}
        <AccountBentoCard bg={accountCardBg('ember')} eyebrow="Suggested size" icon={<Sparkles size={15} />}>
          <div className="flex h-full flex-1 flex-col justify-between">
            <div>
              {suggestion ? (
                <>
                  <p className="anvl-heading mt-1 text-4xl text-[var(--color-heading)]">{suggestion.size}</p>
                  <p className="anvl-micro text-[var(--color-text-muted)]">based on your {suggestion.basis}</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Add your chest or height below and we&rsquo;ll recommend a size.
                </p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[var(--color-line)] pt-3">
              <Link
                to="/size-guide"
                className="anvl-micro focus-ring inline-flex items-center gap-1.5 text-[var(--color-text)] no-underline transition-colors hover:text-[var(--color-accent)]"
              >
                Size guide
                <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
              <Link
                to="/care-guide"
                className="anvl-micro focus-ring inline-flex items-center gap-1.5 text-[var(--color-text)] no-underline transition-colors hover:text-[var(--color-accent)]"
              >
                Care guide
                <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>
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
    </form>
  )
}
