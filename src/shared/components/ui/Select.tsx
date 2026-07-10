import * as SelectPrimitive from '@radix-ui/react-select'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { ICON_SIZE } from '@/shared/lib/iconSize'

const selectTriggerClass = cva(
  'group flex w-full min-w-0 items-center justify-between gap-2 text-left text-[var(--color-text)] outline-none transition-[border-color,background-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-[var(--color-text-muted)]',
  {
    variants: {
      density: {
        comfortable:
          'h-11 rounded-xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)] px-3.5 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-line))] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-accent)_30%,transparent)] md:text-sm',
        compact:
          'focus-ring h-9 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-3 text-xs transition-colors hover:bg-[var(--color-surface-elevated)]',
      },
    },
    defaultVariants: { density: 'comfortable' },
  },
)

const selectItemClass = cva(
  'relative flex cursor-pointer select-none items-center rounded-lg pl-8 pr-3 leading-snug text-[var(--color-text)] outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-[var(--color-chip)]',
  {
    variants: {
      density: {
        comfortable:
          'py-2.5 text-sm data-[state=checked]:font-semibold data-[state=checked]:text-[var(--color-heading)] md:text-[0.85rem]',
        compact:
          'flex-col items-start gap-0.5 py-2.5 text-xs data-[highlighted]:text-[var(--color-text)] data-[state=checked]:bg-[var(--color-accent)]/10 data-[state=checked]:text-[var(--color-heading)]',
      },
    },
    defaultVariants: { density: 'comfortable' },
  },
)

type SelectDensity = VariantProps<typeof selectTriggerClass>['density']

/**
 * Modern, fully custom dropdown (Radix UI primitive under the hood — native
 * `<select>` options can't be styled cross-browser). `density="comfortable"`
 * (default) matches {@link Input}'s touch-friendly chrome; `density="compact"`
 * is admin's dense utility chrome. Controlled: pass `value` + `onValueChange`,
 * and `SelectItem`s as children.
 */
export function Select({
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  id,
  name,
  density,
  className,
  children,
  valueLabel,
  'aria-label': ariaLabel,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  name?: string
  density?: SelectDensity
  className?: string
  children: ReactNode
  /** Overrides the closed trigger's displayed content (default: Radix clones the selected item's own content, which can be too rich for a single-line trigger — e.g. an item with a description). */
  valueLabel?: ReactNode
  'aria-label'?: string
}) {
  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(selectTriggerClass({ density }), className)}
      >
        <span className="min-w-0 truncate">
          <SelectPrimitive.Value placeholder={placeholder}>{valueLabel}</SelectPrimitive.Value>
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            size={15}
            aria-hidden="true"
            className="shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={8}
          collisionPadding={8}
          className="z-[85] max-h-[min(22rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_20px_50px_-14px_rgba(0,0,0,0.65)] outline-none backdrop-blur-md data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1"
        >
          <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-[var(--color-text-muted)]">
            <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="space-y-0.5">
            {children}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-[var(--color-text-muted)]">
            <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { density?: SelectDensity }
>(function SelectItem({ className, density, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(selectItemClass({ density }), className)}
      {...props}
    >
      <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={13} aria-hidden="true" className="text-[var(--color-accent)]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
