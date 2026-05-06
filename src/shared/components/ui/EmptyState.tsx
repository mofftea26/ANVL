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
    <article className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center">
      <h2 className="anvl-heading text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{description}</p>
      <Button className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    </article>
  )
}
