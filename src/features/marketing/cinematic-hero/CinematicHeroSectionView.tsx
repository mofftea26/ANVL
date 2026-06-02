import type { CinematicButtonVariant, CinematicHeroSection } from './cinematicHero.types'
import { CampaignMark } from '@/shared/components/brand/CampaignMark'
import { buttonVariants } from '@/shared/components/ui/Button'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { cn } from '@/shared/lib/cn'

type CinematicHeroSectionViewProps = {
  section: CinematicHeroSection
  className?: string
  stacked?: boolean
  /** Desktop pinned stage: first beat stays visible before GSAP hydrates. */
  isFirst?: boolean
}

function storefrontButtonVariant(
  variant: CinematicButtonVariant,
): 'primary' | 'secondary' | 'ghost' {
  if (variant === 'outline') return 'secondary'
  return variant
}

function textAlign(position?: string) {
  if (position === 'left') return 'text-left items-start'
  if (position === 'right') return 'text-right items-end'
  return 'text-center items-center'
}

export function CinematicHeroSectionView({
  section,
  className,
  stacked = false,
  isFirst = false,
}: CinematicHeroSectionViewProps) {
  const align = textAlign(section.textPosition)

  return (
    <div
      data-cinematic-beat={stacked ? undefined : section.id}
      data-cinematic-beat-first={stacked || !isFirst ? undefined : ''}
      data-cinematic-scroll-section={stacked ? '' : undefined}
      className={cn(
        'flex min-h-[100svh] w-full flex-col justify-center px-6 md:px-10',
        stacked
          ? 'relative py-[var(--anvl-header-h)] opacity-100'
          : cn(
              'absolute inset-0 isolate',
              isFirst
                ? 'z-[2] opacity-100 pointer-events-auto'
                : 'z-[1] opacity-0 pointer-events-none invisible',
            ),
        align,
        className,
      )}
    >
      {section.emblemSrc ? (
        <span data-cinematic-copy className="mb-6 block">
          <CampaignMark
            src={section.emblemSrc}
            onDark
            className="mx-auto h-auto w-[min(42vw,10rem)] max-h-[12rem]"
          />
        </span>
      ) : null}
      {section.foreground?.imageUrl ? (
        <img
          data-cinematic-copy
          src={section.foreground.imageUrl}
          alt={section.foreground.alt ?? ''}
          className="mb-8 max-h-[38vh] w-auto object-contain drop-shadow-2xl"
        />
      ) : null}
      {section.eyebrow ? (
        <p
          data-cinematic-copy
          className="anvl-micro mb-4 text-[length:var(--act-eyebrow-size,0.72rem)] text-[var(--color-text-muted)]"
        >
          {section.eyebrow}
        </p>
      ) : null}
      {section.heading ? (
        <h2
          data-cinematic-copy
          className="anvl-heading max-w-4xl text-[clamp(2.25rem,8vw,4.5rem)] leading-[0.92]"
        >
          {section.heading}
        </h2>
      ) : null}
      {section.body ? (
        <p
          data-cinematic-copy
          className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg"
        >
          {section.body}
        </p>
      ) : null}
      {section.buttons && section.buttons.length > 0 ? (
        <div
          data-cinematic-copy
          className={cn(
            'mt-8 flex flex-wrap gap-3',
            section.textPosition === 'center' && 'justify-center',
          )}
        >
          {section.buttons.map((btn) => (
            <SafeLink
              key={`${btn.label}-${btn.href}`}
              href={btn.href}
              target={btn.target}
              className={cn(buttonVariants({ variant: storefrontButtonVariant(btn.variant) }))}
            >
              {btn.label}
            </SafeLink>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function CinematicHeroReducedStack({ sections }: { sections: CinematicHeroSection[] }) {
  return (
    <div data-cinematic-reduced-stack className="relative z-10 md:hidden">
      {sections.map((section) => (
        <CinematicHeroSectionView key={section.id} section={section} stacked />
      ))}
    </div>
  )
}
