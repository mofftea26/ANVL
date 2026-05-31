import { useRef } from 'react'
import { previewWaitlistFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { useWaitlistForm } from '@/features/marketing/hooks/useWaitlistForm'
import { submitWaitlistMock } from '@/features/marketing/data/waitlist.mock'
import { useCartAnalytics } from '@/features/analytics/hooks/useCartAnalytics'
import { Button, Container, FormField, Input } from '@/shared/components/ui'
import { toast } from 'sonner'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Minimal centered waitlist form. */
export function MinimalWaitlistFormPreset({ landing, row, products }: ActPresetProps) {
  const content = previewWaitlistFields(landing.waitlist, row)
  const root = useRef<HTMLElement | null>(null)
  const waitlistForm = useWaitlistForm()
  const { trackWaitlist } = useCartAnalytics()

  useActPresetMotion(root, row, {
    staggerSelector: '[data-minimal-wait-field]',
    snapSelectors: ['[data-minimal-wait-heading]'],
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
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Waitlist"
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 mx-auto flex max-w-lg flex-col justify-center py-6 text-center sm:py-8">
        <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {content.actLabel}
        </p>
        <h2
          data-minimal-wait-heading
          className="anvl-display mb-4 text-[clamp(1.75rem,3.5vw,2.5rem)] text-[var(--color-heading)]"
        >
          {content.heading}
        </h2>
        <p className="mb-8 text-sm text-[var(--color-text-muted)]">{content.intro}</p>
        <form onSubmit={onSubmit} className="space-y-4 text-left">
          <FormField label={content.form.emailLabel} error={waitlistForm.formState.errors.email?.message}>
            <div data-minimal-wait-field>
              <Input type="email" autoComplete="email" {...waitlistForm.register('email')} />
            </div>
          </FormField>
          <div data-minimal-wait-field>
            <Button data-act-micro type="submit" className="w-full">
              {content.form.submitLabel}
            </Button>
          </div>
        </form>
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          {products.length} pieces in drop
        </p>
      </Container>
    </section>
  )
}
