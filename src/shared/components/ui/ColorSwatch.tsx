import { cn } from '@/shared/lib/cn'

export function ColorSwatch({
  color,
  active,
  label,
  onClick,
}: {
  color: string
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'focus-ring h-9 w-9 rounded-full border-2 transition',
        active ? 'border-[var(--color-accent)]' : 'border-[var(--color-line)]',
      )}
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={label}
      title={label}
    />
  )
}
