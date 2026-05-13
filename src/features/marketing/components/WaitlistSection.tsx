import { useMemo, useRef } from 'react'
import { toast } from 'sonner'
import type { LandingWaitlistContent } from '@/features/admin/landing-cms/landingCms.types'
import type { Product } from '@/features/products/types/product.types'
import { useCartAnalytics } from '@/features/analytics/hooks/useCartAnalytics'
import { useWaitlistForm } from '@/features/marketing/hooks/useWaitlistForm'
import { submitWaitlistMock } from '@/features/marketing/data/waitlist.mock'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import {
  Button,
  Container,
  FormField,
  Input,
  Select,
} from '@/shared/components/ui'
import { gsap, useGSAP } from '@/shared/lib/gsap'

interface WaitlistSectionProps {
  content: LandingWaitlistContent
  products: Product[]
  emblemSrc?: string
}

/**
 * Act VI — Join The Oath.
 *
 * Animation choreography is identical to the original inline section
 * in `routes/index.tsx`: it relies on `data-join-*` attributes to
 * find its targets, so DOM order and attributes must not change.
 */
export function WaitlistSection({
  content,
  products,
  emblemSrc,
}: WaitlistSectionProps) {
  const root = useRef<HTMLElement | null>(null)
  const waitlistForm = useWaitlistForm()
  const { trackWaitlist } = useCartAnalytics()

  const visibleBullets = useMemo(
    () => content.bullets.filter((bullet) => bullet.isVisible !== false),
    [content.bullets],
  )

  const headingWords = useMemo(() => content.heading.split(' '), [content.heading])

  const onSubmit = waitlistForm.handleSubmit(async (values) => {
    await submitWaitlistMock(values)
    trackWaitlist(values.email, values.preferredProduct)
    toast.success(content.form.successToast)
    waitlistForm.reset()
  })

  useGSAP(
    () => {
      const ctx = gsap.matchMedia()

      ctx.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const conds = context.conditions ?? {}
          if (conds.reduced) return

          const host = root.current
          if (!host) return

          const eyebrow = host.querySelector('[data-join-eyebrow]')
          const headingWordsEls = gsap.utils.toArray<HTMLElement>(
            '[data-join-word]',
            host,
          )
          const intro = host.querySelector('[data-join-intro]')
          const bullets = gsap.utils.toArray<HTMLElement>(
            '[data-join-bullet]',
            host,
          )
          const form = host.querySelector('[data-join-form]')
          const shape = host.querySelector('[data-join-shape]')

          if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 14 })
          gsap.set(headingWordsEls, { yPercent: 100, opacity: 0 })
          if (intro) gsap.set(intro, { opacity: 0, y: 14 })
          gsap.set(bullets, { opacity: 0, x: -14 })
          if (form) gsap.set(form, { opacity: 0, y: 24 })

          gsap
            .timeline({
              scrollTrigger: {
                trigger: host,
                start: 'top bottom-=120',
                toggleActions: 'play none none reverse',
              },
              defaults: { ease: 'expo.out' },
            })
            .to(eyebrow, { opacity: 1, y: 0, duration: 0.6 }, 0)
            .to(
              headingWordsEls,
              {
                yPercent: 0,
                opacity: 1,
                duration: 0.95,
                stagger: 0.08,
              },
              0.05,
            )
            .to(intro, { opacity: 1, y: 0, duration: 0.6 }, 0.35)
            .to(
              bullets,
              {
                opacity: 1,
                x: 0,
                duration: 0.5,
                stagger: 0.07,
                ease: 'power3.out',
              },
              0.45,
            )
            .to(form, { opacity: 1, y: 0, duration: 0.8 }, 0.55)

          if (shape) {
            gsap.fromTo(
              shape,
              { yPercent: -6, rotate: 0 },
              {
                yPercent: 6,
                rotate: 8,
                ease: 'none',
                scrollTrigger: {
                  trigger: host,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            )
          }
        },
        root,
      )

      return () => ctx.revert()
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      id="waitlist"
      className="anvl-screen-section relative w-full overflow-hidden border-t border-[var(--color-line)] bg-[var(--color-surface)] py-16 sm:py-20 md:py-24"
      aria-label="Join the waitlist"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-end"
      >
        <span
          data-join-shape="true"
          className="-mr-24 block will-change-transform md:-mr-16"
        >
          <DropEmblemDecor
            src={emblemSrc}
            presentationOnly
            className="h-[110svh] w-auto text-[var(--color-heading)] opacity-[0.05]"
          />
        </span>
      </div>

      <Container className="relative z-10">
        <div className="flex items-baseline justify-between gap-4">
          <p
            data-join-eyebrow="true"
            className="anvl-micro will-change-transform"
          >
            {content.actLabel}
          </p>
          <p className="anvl-micro text-[var(--color-text-muted)]">
            {content.rightLabel}
          </p>
        </div>

        <div className="mt-8 grid gap-10 sm:mt-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
          <div>
            <h2 className="anvl-heading font-normal leading-[0.88] text-[clamp(2rem,7vw,4.75rem)]">
              {headingWords.map((word, index) => (
                <span
                  key={`${word}-${index}`}
                  className="mr-2 inline-block overflow-hidden pb-[0.06em] align-baseline"
                >
                  <span
                    data-join-word="true"
                    className="inline-block will-change-transform"
                  >
                    {word}
                  </span>
                </span>
              ))}
            </h2>
            <p
              data-join-intro="true"
              className="mt-5 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] will-change-transform sm:text-base"
            >
              {content.intro}
            </p>
            <ul className="mt-6 grid gap-2 text-sm text-[var(--color-text-muted)]">
              {visibleBullets.map((bullet) => (
                <li
                  key={bullet.id}
                  data-join-bullet="true"
                  className="flex items-center gap-3 will-change-transform"
                >
                  <span className="inline-block h-px w-6 bg-[var(--color-accent)]" />
                  {bullet.text}
                </li>
              ))}
            </ul>
          </div>

          <form
            data-join-form="true"
            className="space-y-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/70 p-5 backdrop-blur will-change-transform sm:space-y-4 sm:p-7"
            onSubmit={onSubmit}
          >
            <FormField
              label={content.form.emailLabel}
              error={waitlistForm.formState.errors.email?.message}
            >
              <Input
                {...waitlistForm.register('email')}
                type="email"
                placeholder={content.form.emailPlaceholder}
              />
            </FormField>
            <FormField
              label={content.form.firstNameLabel}
              error={waitlistForm.formState.errors.firstName?.message}
            >
              <Input
                {...waitlistForm.register('firstName')}
                placeholder={content.form.firstNamePlaceholder}
              />
            </FormField>
            <FormField
              label={content.form.preferredProductLabel}
              error={waitlistForm.formState.errors.preferredProduct?.message}
            >
              <Select {...waitlistForm.register('preferredProduct')}>
                <option value="">
                  {content.form.preferredProductPlaceholder}
                </option>
                {products.map((item) => (
                  <option value={item.slug} key={item.slug}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <Button
              type="submit"
              disabled={waitlistForm.formState.isSubmitting}
            >
              {waitlistForm.formState.isSubmitting
                ? content.form.submittingLabel
                : content.form.submitLabel}
            </Button>
          </form>
        </div>
      </Container>
    </section>
  )
}
