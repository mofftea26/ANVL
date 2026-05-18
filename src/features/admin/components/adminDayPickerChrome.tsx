import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ComponentProps } from 'react'

import { IconButton } from '@/shared/components/ui/IconButton'
import { cn } from '@/shared/lib/cn'

/** `MMM yyyy` caption consistent with admin forge pickers. */
export function adminFormatMonthYearCaption(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })
}

type MonthNavButtonProps = ComponentProps<'button'>

export function AdminDayPickerPreviousMonthButton({
  className,
  children: _children,
  ...rest
}: MonthNavButtonProps) {
  return (
    <IconButton
      {...rest}
      className={cn(
        'h-9 w-9 border-transparent bg-transparent shadow-none hover:bg-[var(--color-chip)]',
        '[&[aria-disabled=true]]:pointer-events-none [&[aria-disabled=true]]:opacity-40',
        className,
      )}
    >
      <ChevronLeft size={18} className="shrink-0 opacity-90" aria-hidden />
    </IconButton>
  )
}

export function AdminDayPickerNextMonthButton({
  className,
  children: _children,
  ...rest
}: MonthNavButtonProps) {
  return (
    <IconButton
      {...rest}
      className={cn(
        'h-9 w-9 border-transparent bg-transparent shadow-none hover:bg-[var(--color-chip)]',
        '[&[aria-disabled=true]]:pointer-events-none [&[aria-disabled=true]]:opacity-40',
        className,
      )}
    >
      <ChevronRight size={18} className="shrink-0 opacity-90" aria-hidden />
    </IconButton>
  )
}

export const adminDayPickerNavComponents = {
  PreviousMonthButton: AdminDayPickerPreviousMonthButton,
  NextMonthButton: AdminDayPickerNextMonthButton,
} as const
