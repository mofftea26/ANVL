import { PackageOpen, SearchX, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui'

function StateShell({
  icon,
  image,
  title,
  body,
  children,
}: {
  icon: ReactNode
  /** CMS empty-state illustration; replaces the icon badge when present. */
  image?: string
  title: string
  body: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--shop-card-border)] bg-[var(--shop-card-bg)] px-6 py-16 text-center">
      {image ? (
        <img src={image} alt="" aria-hidden="true" className="mb-6 h-32 w-auto max-w-[12rem] object-contain opacity-90" />
      ) : (
        <span className="mb-5 grid h-14 w-14 place-items-center rounded-full border border-[var(--shop-card-border)] bg-[var(--shop-surface)] text-[var(--shop-accent)]">
          {icon}
        </span>
      )}
      <p className="anvl-display text-sm tracking-[0.2em] text-[var(--shop-accent)]">{title}</p>
      <p className="mt-3 max-w-md text-sm text-[var(--shop-text-muted)]">{body}</p>
      {children ? <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div> : null}
    </div>
  )
}

/** No products exist in the catalog / selected collection at all. */
export function ShopEmptyState({
  title,
  body,
  image,
}: {
  title: string
  body: string
  image?: string
}) {
  return (
    <StateShell icon={<PackageOpen size={22} aria-hidden="true" />} image={image} title={title} body={body} />
  )
}

/** Filters/search matched nothing — offer concrete recovery actions. */
export function ShopNoResults({
  title,
  body,
  image,
  onClearAll,
}: {
  title: string
  body: string
  image?: string
  onClearAll: () => void
}) {
  return (
    <StateShell icon={<SearchX size={22} aria-hidden="true" />} image={image} title={title} body={body}>
      <Button type="button" variant="secondary" onClick={onClearAll}>
        Clear all filters
      </Button>
    </StateShell>
  )
}

/** Commerce data failed to load. */
export function ShopErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <StateShell
      icon={<TriangleAlert size={22} aria-hidden="true" />}
      title="The armory is unreachable"
      body="We couldn't load the catalog right now. Please try again in a moment."
    >
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </StateShell>
  )
}
