import { cn } from '@/shared/lib/cn'

export function ColorSwatch({
  color,
  active,
  label,
  unavailable,
  onClick,
}: {
  color: string
  active: boolean
  label: string
  unavailable?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'focus-ring h-9 w-9 rounded-full border-2 transition',
        active ? 'border-[var(--color-accent)]' : 'border-[var(--color-line)]',
        unavailable && 'opacity-40 ring-2 ring-dashed ring-[var(--color-text-muted)]',
      )}
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={unavailable ? `${label} (no in-stock sizes)` : label}
    />
  )
}
