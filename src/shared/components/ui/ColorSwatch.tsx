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
  // RESP-05 — visible swatch is 36 px but the hit area is padded to ≥44 px
  // so the tap target meets WCAG 2.5.5 without inflating the design.
  return (
    <button
      type="button"
      className={cn(
        'focus-ring relative inline-flex h-11 w-11 items-center justify-center rounded-full p-1 transition',
        unavailable && 'opacity-40',
      )}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={unavailable ? `${label} (no in-stock sizes)` : label}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block h-9 w-9 rounded-full border-2 transition',
          active ? 'border-[var(--color-accent)]' : 'border-[var(--color-line)]',
          unavailable && 'ring-2 ring-dashed ring-[var(--color-text-muted)]',
        )}
        style={{ backgroundColor: color }}
      />
    </button>
  )
}
