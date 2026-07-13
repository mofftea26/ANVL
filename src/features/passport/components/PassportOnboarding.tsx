import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Product } from '@/features/products/types/product.types'
import { useCustomerProfileQuery } from '@/features/storefront-account/publicAccount.core'
import { Button } from '@/shared/components/ui/Button'
import { ColorSwatch } from '@/shared/components/ui/ColorSwatch'
import { Input } from '@/shared/components/ui/Input'
import { SizeSelector } from '@/shared/components/ui/SizeSelector'
import { useClaimPassportMutation } from '../hooks/usePassport'
import type { ClaimPassportError, PassportView } from '../schemas/passport.schema'
import { ForgeSerialPlate } from './ForgeSerialPlate'

const onboardingSchema = z.object({
  color: z.string().min(1, 'Pick your colorway').max(80),
  size: z.string().min(1, 'Pick your size').max(40),
  displayName: z.string().min(1, 'Enter the name to engrave').max(120),
})

const CLAIM_ERROR_COPY: Record<ClaimPassportError, string> = {
  not_found: 'This passport no longer exists.',
  already_claimed: 'Someone claimed this piece moments ago.',
  not_authenticated: 'Your session expired — sign in again to claim.',
  invalid_input: 'Something went wrong while claiming. Try again.',
}

/**
 * Signed-in, unclaimed: the oath step. Self-reported colorway + size (the QR
 * is per product, not per variant) and the name to engrave on the plate.
 */
export function PassportOnboarding({
  token,
  view,
  product,
  onClaimed,
}: {
  token: string
  view: PassportView
  product: Product | null
  onClaimed: (claimed: PassportView) => void
}) {
  const profileQuery = useCustomerProfileQuery()
  const claim = useClaimPassportMutation()
  const colorways = product?.colorways ?? []
  const sizes = product?.sizes ?? []

  const form = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      color: colorways.length === 1 ? colorways[0].name : '',
      size: '',
      displayName: '',
    },
  })

  // Seed the engraved name from the profile once it loads (still editable).
  const customer = profileQuery.data
  useEffect(() => {
    if (!customer) return
    if (form.getValues('displayName')) return
    const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim()
    if (name) form.setValue('displayName', name)
  }, [customer, form])

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await claim.mutateAsync({ token, ...values })
    if (result.ok) {
      onClaimed(result.passport)
      return
    }
    toast.error(CLAIM_ERROR_COPY[result.error])
  })

  const color = form.watch('color')
  const size = form.watch('size')

  return (
    <div className="flex min-h-[calc(100svh-var(--anvl-header-h))] items-center justify-center bg-[var(--color-bg)] px-6 py-16">
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-lg" data-passport-onboarding>
        <p className="anvl-micro mb-4 text-center text-[var(--color-text-muted)]">
          Claim your piece
        </p>
        <h1 className="anvl-heading text-center text-3xl text-[var(--color-heading)] sm:text-4xl">
          {view.productName}
        </h1>
        <div className="mt-6 flex justify-center">
          <ForgeSerialPlate serialNumber={view.serialNumber} editionTotal={view.editionTotal} />
        </div>

        <div className="mt-10 space-y-8">
          <fieldset>
            <legend className="anvl-micro mb-3 text-[var(--color-text-muted)]">
              Your colorway
            </legend>
            {colorways.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {colorways.map((c) => (
                  <span key={c.name} className="inline-flex flex-col items-center gap-1">
                    <ColorSwatch
                      color={c.base}
                      active={color === c.name}
                      label={c.name}
                      onClick={() => form.setValue('color', c.name, { shouldValidate: true })}
                    />
                    <span className="text-[10px] text-[var(--color-text-muted)]">{c.name}</span>
                  </span>
                ))}
              </div>
            ) : (
              <Input
                placeholder="e.g. Charcoal"
                aria-label="Colorway"
                {...form.register('color')}
              />
            )}
            <FieldError message={form.formState.errors.color?.message} />
          </fieldset>

          <fieldset>
            <legend className="anvl-micro mb-3 text-[var(--color-text-muted)]">Your size</legend>
            {sizes.length > 0 ? (
              <SizeSelector
                sizes={sizes}
                value={size}
                onChange={(s) => form.setValue('size', s, { shouldValidate: true })}
              />
            ) : (
              <Input placeholder="e.g. M" aria-label="Size" {...form.register('size')} />
            )}
            <FieldError message={form.formState.errors.size?.message} />
          </fieldset>

          <div>
            <label
              htmlFor="passport-display-name"
              className="anvl-micro mb-3 block text-[var(--color-text-muted)]"
            >
              Name on the plate
            </label>
            <Input
              id="passport-display-name"
              placeholder="The name engraved on your passport"
              {...form.register('displayName')}
            />
            <FieldError message={form.formState.errors.displayName?.message} />
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Shown publicly when someone verifies this piece.
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Button type="submit" variant="primary" size="lg" loading={claim.isPending}>
            {claim.isPending ? 'Forging…' : 'Forge it to my name'}
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
          One claim, permanent. This QR will belong to your account only.
        </p>
      </form>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-2 text-xs text-[var(--color-danger)]">{message}</p>
}
