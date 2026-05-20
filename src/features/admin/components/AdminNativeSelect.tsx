import { forwardRef, type SelectHTMLAttributes } from 'react'
import { adminStackedFieldClass } from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'

/** Native `<select>` with oath-dark admin field chrome (long / dynamic option lists). */
export const AdminNativeSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function AdminNativeSelect({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(adminStackedFieldClass, className)}
      {...props}
    >
      {children}
    </select>
  )
})
