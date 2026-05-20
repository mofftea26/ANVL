import { cn } from '@/shared/lib/cn'

/** Forged plate CTA — dashboard tiles, primary admin links on dark chrome. */
export const adminForgedCtaLinkClass = cn(
  'focus-ring relative inline-flex min-h-11 shrink-0 items-center justify-center overflow-hidden rounded-lg no-underline',
  'border border-[color-mix(in_oklab,var(--color-accent)_48%,transparent)]',
  'bg-[var(--color-surface)] text-sm font-semibold tracking-wide text-[var(--color-heading)]',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.26),0_2px_8px_-2px_rgba(0,0,0,0.48)]',
  'transition-[border-color,background-color,box-shadow,color]',
  'hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-accent)]',
  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.11),inset_0_-1px_0_rgba(0,0,0,0.26),0_12px_28px_-14px_rgba(0,0,0,0.6)]',
  'active:border-[color-mix(in_oklab,var(--color-accent)_65%,transparent)] active:bg-[var(--color-surface)] active:text-[var(--color-heading)]',
  'active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.38)]',
)

/** Secondary outline row-height link (edit, preview, back). */
export const adminOutlineLinkClass = cn(
  'focus-ring inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--color-line)] px-4',
  'text-xs font-semibold text-[var(--color-heading)] no-underline',
  'transition-[border-color,background-color,box-shadow]',
  'hover:border-[color-mix(in_srgb,var(--anvl-bone)_28%,transparent)] hover:bg-[var(--color-surface-elevated)]',
)

/** Square icon-only forged control (e.g. create drop). */
export const adminForgedIconLinkClass = cn(
  adminForgedCtaLinkClass,
  'h-11 min-w-11 px-0',
)
