import { AnvlCompactMark } from '@/shared/assets/brand'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'

export function AnnouncementBar({
  message,
  ctaLabel,
  ctaHref,
}: {
  message: string
  ctaLabel: string
  ctaHref: string
}) {
  return (
    <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)] py-2">
      <Container className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <AnvlCompactMark
            aria-hidden="true"
            className="h-4 w-auto shrink-0 text-[var(--color-heading)] opacity-70"
          />
          <p className="anvl-micro truncate text-[10px] sm:text-xs">{message}</p>
        </div>
        <SafeLink
          href={ctaHref}
          className="anvl-micro focus-ring text-[10px] underline sm:text-xs"
        >
          {ctaLabel}
        </SafeLink>
      </Container>
    </div>
  )
}
