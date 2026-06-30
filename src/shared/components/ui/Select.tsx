import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { inputBaseClass } from '@/shared/components/ui/Input'
import { cn } from '@/shared/lib/cn'

/** Modern select — shares {@link Input} chrome with a chevron affordance. */
export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(inputBaseClass, 'cursor-pointer appearance-none pr-10', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
    </div>
  )
}
