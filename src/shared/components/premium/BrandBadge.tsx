import { cn } from '@/shared/lib/cn'

export function BrandBadge({
  children,
  tone = 'default',
  className,
}: {
  children: string
  tone?: 'default' | 'accent' | 'muted'
  className?: string
}) {
  const tones = {
    default: 'border-[var(--color-line)] text-[var(--color-text)]',
    accent: 'border-[var(--color-accent)]/40 text-[var(--color-accent)]',
    muted: 'border-[var(--color-line)]/60 text-[var(--color-text-muted)]',
  }
  return (
    <span
      className={cn(
        'anvl-micro inline-flex rounded-full border px-3 py-1 text-[10px] tracking-[0.18em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
