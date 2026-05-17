import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react'
import { cn } from '@/shared/lib/cn'

export const AdminDropdownMenu = DropdownMenuPrimitive.Root

export const AdminDropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export const AdminDropdownMenuGroup = DropdownMenuPrimitive.Group

export const AdminDropdownMenuPortal = DropdownMenuPrimitive.Portal

export const AdminDropdownMenuSub = DropdownMenuPrimitive.Sub

export const AdminDropdownMenuSubTrigger = DropdownMenuPrimitive.SubTrigger

export const AdminDropdownMenuSubContent = DropdownMenuPrimitive.SubContent

export const AdminDropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

export const AdminDropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function AdminDropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-[var(--color-line)]', className)}
      {...props}
    />
  )
})

export const AdminDropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(function AdminDropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn('px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]', className)}
      {...props}
    />
  )
})

export const AdminDropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function AdminDropdownMenuContent({ className, sideOffset = 6, collisionPadding = 8, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'admin-dropdown-menu-content z-[80] min-w-[11rem] overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] p-1 shadow-[inset_0_1px_0_rgba(231,228,223,0.06),0_16px_42px_rgba(0,0,0,0.55)] outline-none',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
})

export type AdminDropdownMenuItemProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
> & {
  destructive?: boolean
}

export const AdminDropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  AdminDropdownMenuItemProps
>(function AdminDropdownMenuItem({ className, destructive, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors',
        'focus:bg-[var(--color-chip)] focus:text-[var(--color-text)]',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        destructive &&
          'text-red-300 focus:bg-red-500/15 focus:text-red-100',
        className,
      )}
      {...props}
    />
  )
})
