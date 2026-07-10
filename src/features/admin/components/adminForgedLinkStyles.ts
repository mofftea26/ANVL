import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

/** Primary pill CTA — dashboard tiles and empty-state actions. */
export const adminForgedCtaLinkClass = cn(
  buttonVariants({ variant: 'primary', size: 'md', density: 'compact' }),
  'no-underline',
)

/** Secondary outline chip link (edit, preview, back). */
export const adminOutlineLinkClass = cn(
  buttonVariants({ variant: 'secondary', size: 'md', density: 'compact' }),
  'no-underline',
)

/** Square icon-only chip (e.g. create drop). */
export const adminForgedIconLinkClass = cn(
  buttonVariants({ variant: 'primary', size: 'icon', density: 'compact' }),
  'no-underline',
)
