import { Link } from '@tanstack/react-router'
import { ShieldOff } from 'lucide-react'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

/** Branded dead-end for unknown/invalid passport tokens. */
export function PassportNotFound() {
  return (
    <div className="flex min-h-[70svh] items-center justify-center bg-[var(--color-bg)] px-6">
      <div className="mx-auto max-w-md text-center">
        <ShieldOff
          aria-hidden="true"
          className="mx-auto mb-6 h-10 w-10 text-[var(--color-text-muted)]"
        />
        <p className="anvl-micro mb-3 text-[var(--color-text-muted)]">Unverified mark</p>
        <h1 className="anvl-heading text-3xl text-[var(--color-heading)] sm:text-4xl">
          This mark is not of the forge
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
          The code you scanned doesn&apos;t match any ANVL passport. Check the card that
          came with your piece, or reach out if you believe this is an error.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/shop"
            search={defaultShopUrlSearch}
            className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'no-underline')}
          >
            Enter the armory
          </Link>
        </div>
      </div>
    </div>
  )
}
