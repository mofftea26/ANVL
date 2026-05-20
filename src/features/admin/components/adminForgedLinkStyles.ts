import {
  adminChipButtonVariants,
  adminTopbarChipButtonClassName,
} from '@/features/admin/components/adminChipButtonStyles'
import { cn } from '@/shared/lib/cn'

/** Primary pill CTA — dashboard tiles and empty-state actions. */
export const adminForgedCtaLinkClass = cn(
  adminChipButtonVariants({ variant: 'primary', size: 'default' }),
  'no-underline',
)

/** Secondary outline chip link (edit, preview, back). */
export const adminOutlineLinkClass = cn(
  adminTopbarChipButtonClassName,
  'no-underline',
)

/** Square icon-only chip (e.g. create drop). */
export const adminForgedIconLinkClass = cn(
  adminChipButtonVariants({ variant: 'primary', size: 'icon' }),
  'no-underline',
)
