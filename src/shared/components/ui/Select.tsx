import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { adminFieldControlClass } from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          adminFieldControlClass,
          'h-11 appearance-none rounded-xl pr-9',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
    </div>
  )
}
