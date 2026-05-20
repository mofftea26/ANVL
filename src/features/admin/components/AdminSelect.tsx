import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react'
import {
  adminSelectContentClass,
  adminSelectItemClass,
  adminSelectTriggerClass,
} from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'

export const AdminSelect = SelectPrimitive.Root

export const AdminSelectGroup = SelectPrimitive.Group

export const AdminSelectValue = SelectPrimitive.Value

export const AdminSelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    /** Optional visible label above trigger (fieldset-style). */
    label?: string
    disabled?: boolean
  }
>(function AdminSelectTrigger({ className, label, disabled, children, ...props }, ref) {
  return (
    <div className="space-y-1">
      {label ? (
        <span className="block text-xs text-[var(--color-text-muted)]">{label}</span>
      ) : null}
      <SelectPrimitive.Trigger
        ref={ref}
        disabled={disabled}
        className={cn(adminSelectTriggerClass, className)}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={14} className="shrink-0 opacity-70" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    </div>
  )
})

export const AdminSelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function AdminSelectContent({ className, children, position = 'popper', ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={6}
        collisionPadding={8}
        className={cn(
          adminSelectContentClass,
          position === 'popper' &&
            'w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(position === 'popper' && 'p-1')}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})

export const AdminSelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function AdminSelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(adminSelectItemClass, className)}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={14} aria-hidden="true" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})

export const AdminSelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function AdminSelectSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-[var(--color-line)]', className)}
      {...props}
    />
  )
})
