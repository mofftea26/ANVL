import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { adminFieldControlClass } from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'

export const AdminInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function AdminInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn('mt-1', adminFieldControlClass, className)}
      {...props}
    />
  )
})

export const AdminTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function AdminTextarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn('mt-1', adminFieldControlClass, className)}
      {...props}
    />
  )
})
