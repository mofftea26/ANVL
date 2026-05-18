import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react'
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
        className={cn(
          'focus-ring flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-left text-sm text-[var(--color-text)] outline-none transition-colors',
          'hover:border-[color:color-mix(in_srgb,var(--anvl-bone)_22%,transparent)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[placeholder]:text-[var(--color-text-muted)]',
          className,
        )}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={16} className="shrink-0 opacity-70" aria-hidden="true" />
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
          'z-[85] max-h-[min(360px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] shadow-[inset_0_1px_0_rgba(231,228,223,0.06),0_16px_42px_rgba(0,0,0,0.55)] outline-none',
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
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none transition-colors',
        'focus:bg-[var(--color-chip)] focus:text-[var(--color-text)]',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        className,
      )}
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
