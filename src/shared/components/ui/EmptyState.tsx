import { AnvlCompactMark } from '@/shared/assets/brand'
import { Button } from './Button'

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center">
      <AnvlCompactMark
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-auto text-[var(--color-heading)] opacity-[0.04] md:h-48"
      />
      <div className="relative">
        <AnvlCompactMark className="mx-auto h-12 w-auto text-[var(--color-text-muted)] opacity-50" />
        <h2 className="anvl-heading mt-4 text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{description}</p>
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </article>
  )
}
