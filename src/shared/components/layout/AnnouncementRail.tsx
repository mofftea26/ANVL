import type { LandingAnnouncementBar } from '@/features/cms/landing/landingPageCms.types'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { cn } from '@/shared/lib/cn'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import type { PremiumNavTopbarVariant } from '@/shared/components/layout/usePremiumNavPhase'

export function AnnouncementRail({
  announcement,
  variant = 'solid',
}: {
  announcement?: LandingAnnouncementBar
  variant?: PremiumNavTopbarVariant
}) {
  if (!announcement?.enabled || !announcement.message.trim()) {
    return null
  }

  const message = stripAngleBracketTags(announcement.message)
  const isTransparent = variant === 'transparent'

  return (
    <div
      className={cn(
        'border-b py-2 transition-colors',
        isTransparent
          ? 'border-white/10 bg-transparent'
          : 'border-[var(--color-line)] bg-[var(--color-surface)]/80 backdrop-blur-sm',
      )}
      data-premium-announcement
    >
      <Container className="flex items-center justify-center gap-3 sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <AnvlCompactMark
            aria-hidden="true"
            className={cn(
              'h-3.5 w-auto shrink-0',
              isTransparent
                ? 'text-[var(--color-heading)]/60'
                : 'text-[var(--color-heading)] opacity-70',
            )}
          />
          {announcement.href ? (
            <SafeLink
              href={announcement.href}
              className={cn(
                'focus-ring anvl-micro truncate text-[10px] font-medium sm:text-xs',
                isTransparent
                  ? 'text-[var(--color-heading)]/90 underline-offset-4 hover:underline'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-heading)]',
              )}
            >
              {message}
            </SafeLink>
          ) : (
            <p
              className={cn(
                'anvl-micro truncate text-[10px] sm:text-xs',
                isTransparent
                  ? 'text-[var(--color-heading)]/80'
                  : 'text-[var(--color-text-muted)]',
              )}
            >
              {message}
            </p>
          )}
        </div>
      </Container>
    </div>
  )
}
