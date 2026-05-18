import * as PopoverPrimitive from '@radix-ui/react-popover'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react'
import { cn } from '@/shared/lib/cn'

export const AdminPopover = PopoverPrimitive.Root

export const AdminPopoverTrigger = PopoverPrimitive.Trigger

export const AdminPopoverAnchor = PopoverPrimitive.Anchor

export const AdminPopoverClose = PopoverPrimitive.Close

/** Date pickers merge `flex flex-col` + section gaps; shell avoids `overflow-y-auto`+`overflow-hidden` fights. */
const contentShell =
  'z-[85] flex max-h-[min(520px,var(--radix-popover-content-available-height))] flex-col overflow-y-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] p-3 shadow-[inset_0_1px_0_rgba(231,228,223,0.06),0_16px_42px_rgba(0,0,0,0.55)] outline-none'

export const AdminPopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function AdminPopoverContent({ className, sideOffset = 6, collisionPadding = 8, ...props }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(contentShell, className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
