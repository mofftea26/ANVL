import { Link } from '@tanstack/react-router'
import { Fingerprint } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import type { PassportView } from '../schemas/passport.schema'
import { AuthenticityPlate } from './AuthenticityPlate'
import { PassportAtmosphere } from './PassportAtmosphere'

/**
 * Signed-out gate: the cinematic hook for an unclaimed passport, or the
 * hand-over invitation when a live transfer code rides in the URL. Sign-in
 * redirects straight back here (transfer code preserved).
 */
export function PassportTeaser({
  token,
  view,
  product,
  transferCode,
}: {
  token: string
  view: PassportView
  product: Product | null
  transferCode?: string
}) {
  const image = product?.images[0]
  const isTransfer = Boolean(transferCode)
  const redirect = isTransfer ? `/p/${token}?transfer=${transferCode}` : `/p/${token}`
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[var(--color-bg)] px-6 pb-20 pt-[calc(var(--anvl-header-h)+3rem)]">
      <PassportAtmosphere imageSrc={image?.src} />
      <div className="relative mx-auto max-w-lg text-center" data-passport-teaser>
        <Fingerprint
          aria-hidden="true"
          className="mx-auto mb-6 h-9 w-9 text-[var(--color-highlight-bright)]"
        />
        <p className="anvl-micro mb-4 text-[var(--color-text-muted)]">
          {isTransfer ? 'Ownership transfer' : 'Unregistered passport'}
        </p>
        <h1 className="anvl-heading text-4xl text-[var(--color-heading)] sm:text-5xl">
          {view.productName}
        </h1>
        <div className="mt-8 flex justify-center">
          <AuthenticityPlate editionTotal={view.editionTotal} />
        </div>
        <p className="mt-8 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isTransfer
            ? `${view.claimedDisplayName ?? 'The current owner'} is passing this piece to you. Sign in to accept — the plate is re-forged to your name, permanently.`
            : 'This exact piece has never been claimed. Sign in to forge it to your name — one owner, forever.'}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            to="/auth/sign-in"
            search={{ redirect }}
            className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'no-underline')}
          >
            {isTransfer ? 'Sign in to accept' : 'Sign in to claim'}
          </Link>
          <p className="text-xs text-[var(--color-text-muted)]">
            New to ANVL?{' '}
            <Link
              to="/auth/sign-up"
              search={{ redirect }}
              className="focus-ring text-[var(--color-text)] underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
