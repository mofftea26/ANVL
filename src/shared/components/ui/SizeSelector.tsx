import { cn } from '@/shared/lib/cn'

export function SizeSelector({
  sizes,
  value,
  onChange,
}: {
  sizes: string[]
  value: string
  onChange: (size: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onChange(size)}
          className={cn(
            'focus-ring rounded-md border px-3 py-2 text-sm font-semibold',
            value === size
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-bg)]'
              : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)]',
          )}
        >
          {size}
        </button>
      ))}
    </div>
  )
}
