import { Container } from '@/shared/components/ui/Container'

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
        <p className="anvl-micro text-[10px] sm:text-xs">{message}</p>
        <a className="anvl-micro text-[10px] underline sm:text-xs" href={ctaHref}>
          {ctaLabel}
        </a>
      </Container>
    </div>
  )
}
