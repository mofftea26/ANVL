import { Link } from '@tanstack/react-router'
import { Fingerprint } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { formatForgeSerial } from '../schemas/passport.schema'
import type { PassportView } from '../schemas/passport.schema'
import { ForgeSerialPlate } from './ForgeSerialPlate'

/**
 * Unclaimed passport, signed-out visitor: the cinematic hook. Shows what the
 * piece is and pushes to sign-in; the redirect brings them straight back here.
 */
export function PassportTeaser({
  token,
  view,
  product,
}: {
  token: string
  view: PassportView
  product: Product | null
}) {
  const image = product?.images[0]
  return (
    <div className="relative flex min-h-[calc(100svh-var(--anvl-header-h))] items-center justify-center overflow-hidden bg-[var(--color-bg)] px-6 py-16">
      {image ? (
        <img
          src={image.src}
          alt=""
          aria-hidden="true"
          width={900}
          height={1200}
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14] blur-[2px]"
        />
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-bg)_78%)]"
      />
      <div className="relative mx-auto max-w-lg text-center" data-passport-teaser>
        <Fingerprint
          aria-hidden="true"
          className="mx-auto mb-6 h-9 w-9 text-[var(--color-highlight-bright)]"
        />
        <p className="anvl-micro mb-4 text-[var(--color-text-muted)]">
          Unclaimed passport · {formatForgeSerial(view.serialNumber, view.editionTotal)}
        </p>
        <h1 className="anvl-heading text-4xl text-[var(--color-heading)] sm:text-5xl">
          {view.productName}
        </h1>
        <div className="mt-8 flex justify-center">
          <ForgeSerialPlate
            serialNumber={view.serialNumber}
            editionTotal={view.editionTotal}
          />
        </div>
        <p className="mt-8 text-sm leading-relaxed text-[var(--color-text-muted)]">
          This exact piece has never been claimed. Sign in to forge it to your name —
          one owner, forever.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            to="/auth/sign-in"
            search={{ redirect: `/p/${token}` }}
            className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'no-underline')}
          >
            Sign in to claim
          </Link>
          <p className="text-xs text-[var(--color-text-muted)]">
            New to ANVL?{' '}
            <Link
              to="/auth/sign-up"
              search={{ redirect: `/p/${token}` }}
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
