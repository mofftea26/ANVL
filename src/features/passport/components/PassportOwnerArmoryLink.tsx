import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

/**
 * "View the owner's Armory" — the second action on the public authenticity
 * view, shown ONLY when `get_passport_by_token` released `owner_armory_handle`
 * (the passport shows its owner AND the owner shared their armory). The handle
 * must never be derived from any other source — a private passport stays
 * unlinkable to its owner.
 *
 * Mounted by `PassportPage` as an overlay into the authenticity view's
 * reserved bottom band (`PassportMobile`'s `pb-20` keeps that strip empty on
 * every viewport). Ghost prominence — "View this product" stays the primary
 * action of the public view.
 */
export function PassportOwnerArmoryLink({ handle }: { handle: string }) {
  return (
    <div className="absolute inset-x-0 bottom-6 z-[1] flex justify-center px-6">
      <Link
        to="/armory/$handle"
        params={{ handle }}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'no-underline')}
      >
        View the owner&rsquo;s Armory
      </Link>
    </div>
  )
}
