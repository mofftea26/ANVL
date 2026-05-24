import { useRef } from 'react'
import { previewWaitlistFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { useWaitlistForm } from '@/features/marketing/hooks/useWaitlistForm'
import { submitWaitlistMock } from '@/features/marketing/data/waitlist.mock'
import { useCartAnalytics } from '@/features/analytics/hooks/useCartAnalytics'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Button, Container, FormField, Input } from '@/shared/components/ui'
import { toast } from 'sonner'
import { gsap } from '@/shared/lib/gsap'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Split waitlist — copy + emblem left, form right. */
export function SplitWaitlistFormPreset({
  landing,
  row,
  products,
  emblemSrc,
}: ActPresetProps) {
  const content = previewWaitlistFields(landing.waitlist, row)
  const root = useRef<HTMLElement | null>(null)
  const waitlistForm = useWaitlistForm()
  const { trackWaitlist } = useCartAnalytics()

  useActScrollReveal(root, {
    snapSelectors: ['[data-split-wait-copy]', '[data-split-wait-form]'],
    onAnimate: (host) => {
      const copy = host.querySelector('[data-split-wait-copy]')
      const form = host.querySelector('[data-split-wait-form]')
      gsap.set(copy, { opacity: 0, x: -24 })
      gsap.set(form, { opacity: 0, x: 24 })
      gsap
        .timeline({
          scrollTrigger: { trigger: host, start: 'top 78%', toggleActions: 'play none none reverse' },
        })
        .to(copy, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }, 0)
        .to(form, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }, 0.12)
    },
  })

  const onSubmit = waitlistForm.handleSubmit(async (values) => {
    await submitWaitlistMock(values)
    trackWaitlist(values.email, values.preferredProduct)
    toast.success(content.form.successToast)
    waitlistForm.reset()
  })

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16 md:py-24"
      aria-label="Waitlist"
    >
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div data-split-wait-copy>
          <DropEmblemDecor src={emblemSrc} className="mb-8 h-20 w-20" alt="" />
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {content.actLabel}
          </p>
          <h2 className="anvl-display mb-4 text-[clamp(1.75rem,3.5vw,2.5rem)]">
            {content.heading}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">{content.intro}</p>
          <p className="mt-6 text-xs text-[var(--color-text-muted)]">
            {products.length} pieces · {content.rightLabel}
          </p>
        </div>
        <form data-split-wait-form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-[var(--color-line)] p-6">
          <FormField label={content.form.emailLabel} error={waitlistForm.formState.errors.email?.message}>
            <Input type="email" autoComplete="email" {...waitlistForm.register('email')} />
          </FormField>
          <Button type="submit" className="w-full">
            {content.form.submitLabel}
          </Button>
        </form>
      </Container>
    </section>
  )
}
