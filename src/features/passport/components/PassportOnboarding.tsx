import { useEffect, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGSAP } from '@gsap/react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Product } from '@/features/products/types/product.types'
import { useCustomerProfileQuery } from '@/features/storefront-account/publicAccount.core'
import { Button } from '@/shared/components/ui/Button'
import { ColorSwatch } from '@/shared/components/ui/ColorSwatch'
import { Input } from '@/shared/components/ui/Input'
import { SizeSelector } from '@/shared/components/ui/SizeSelector'
import { gsap } from '@/shared/lib/gsap'
import { useClaimPassportMutation } from '../hooks/usePassport'
import type {
  ClaimPassportError,
  PassportView,
} from '../schemas/passport.schema'
import { ForgeSerialPlate } from './ForgeSerialPlate'
import { PassportAtmosphere } from './PassportAtmosphere'

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
 * Signed-in, unclaimed: the oath step. The piece stands on the left (its
 * render over the shared atmosphere); the claim ritual — colorway, size,
 * name on the plate — on the right. Staggered GSAP entrance everywhere,
 * snapped visible under reduced motion.
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
  const scopeRef = useRef<HTMLDivElement>(null)
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

  // Entrance: image rises from the forge glow, ritual steps stagger in.
  // Simple tween timeline (mobile-safe, no ScrollTrigger); reduced motion snaps.
  useGSAP(
    () => {
      const root = scopeRef.current
      if (!root) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(root.querySelectorAll('[data-onb]'), { clearProps: 'all' })
      })
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // fromTo (never from) — StrictMode-safe entrance (see usePassportReveal).
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.fromTo(
          '[data-onb-image]',
          { autoAlpha: 0, y: 44, scale: 1.04, filter: 'blur(10px)' },
          { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.2 },
        ).fromTo(
          '[data-onb]',
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.09 },
          '-=0.75',
        )
        return () => {
          tl.kill()
        }
      })
      return () => mm.revert()
    },
    { scope: scopeRef },
  )

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
  const heroImage =
    (color ? product?.shop?.imagesByColorName?.[color]?.[0] : undefined) ??
    product?.images[0]

  return (
    <div
      ref={scopeRef}
      className="relative min-h-[calc(100svh-var(--anvl-header-h))] overflow-hidden bg-[var(--color-bg)]"
    >
      <PassportAtmosphere imageSrc={product?.images[0]?.src} />

      <div className="relative mx-auto grid min-h-[calc(100svh-var(--anvl-header-h))] max-w-6xl items-center gap-10 px-6 py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        {/* The piece ----------------------------------------------------- */}
        <div data-onb-image className="relative mx-auto w-full max-w-sm lg:max-w-none">
          {heroImage ? (
            <div className="relative overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--color-highlight)_25%,var(--color-line))] shadow-[0_40px_120px_-40px_color-mix(in_oklab,var(--color-highlight)_35%,transparent)]">
              <img
                src={heroImage.src}
                alt={heroImage.alt || view.productName}
                width={1200}
                height={1500}
                decoding="async"
                className="h-auto w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[color-mix(in_oklab,var(--color-bg)_75%,transparent)] to-transparent"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
              <span className="anvl-heading text-2xl text-[var(--color-text-muted)]">
                {view.productName}
              </span>
            </div>
          )}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
            <ForgeSerialPlate
              serialNumber={view.serialNumber}
              editionTotal={view.editionTotal}
              size="sm"
            />
          </div>
        </div>

        {/* The ritual ---------------------------------------------------- */}
        <form onSubmit={onSubmit} data-passport-onboarding className="pt-6 lg:pt-0">
          <p data-onb className="anvl-micro text-[var(--color-highlight-bright)]">
            Claim your piece
          </p>
          <h1
            data-onb
            className="anvl-heading mt-3 text-3xl text-[var(--color-heading)] sm:text-4xl md:text-5xl"
          >
            {view.productName}
          </h1>
          <p data-onb className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
            Forge number {view.serialNumber} of {view.editionTotal}. Tell the ledger
            which unit you hold — then it carries your name, forever.
          </p>

          <div className="mt-9 space-y-7">
            <fieldset data-onb>
              <legend className="anvl-micro mb-3 text-[var(--color-text-muted)]">
                Your colorway
              </legend>
              {colorways.length > 0 ? (
                <div className="flex flex-wrap items-center gap-3">
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
                <Input placeholder="e.g. Charcoal" aria-label="Colorway" {...form.register('color')} />
              )}
              <FieldError message={form.formState.errors.color?.message} />
            </fieldset>

            <fieldset data-onb>
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

            <div data-onb>
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

          <div data-onb className="mt-9">
            <Button type="submit" variant="primary" size="lg" loading={claim.isPending}>
              {claim.isPending ? 'Forging…' : 'Forge it to my name'}
            </Button>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              One claim, permanent. This QR will belong to your account only.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-2 text-xs text-[var(--color-danger)]">{message}</p>
}
