import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react'
import { memo, useCallback, useEffect, useId, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'

import 'react-day-picker/style.css'

import {
  adminReactDayPickerClassNames,
  adminReactDayPickerRootClassName,
} from '@/features/admin/components/adminCalendarSkin'
import {
  adminDayPickerNavComponents,
  adminFormatMonthYearCaption,
} from '@/features/admin/components/adminDayPickerChrome'
import { AdminPopover, AdminPopoverContent, AdminPopoverTrigger } from '@/features/admin/components/AdminPopover'
import {
  adminFieldClearButtonClass,
  adminFieldControlClass,
  fieldErrorClass,
} from '@/shared/lib/cmsFieldStyles'
import {
  localDateFromYyyyMmDd,
  localStartOfToday,
  yyyyMmDdFromLocalDate,
} from '@/features/admin/lib/adminDateTime'
import { cn } from '@/shared/lib/cn'

export type AdminDateFieldProps = {
  id?: string
  /** `YYYY-MM-DD` or empty string when unset. */
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  placeholder?: string
  clear?: boolean
  className?: string
  /** Optional `aria-labelledby` referencing the stacked field label span. */
  'aria-labelledby'?: string
  error?: boolean
  'aria-label'?: string
}

export const AdminDateField = memo(function AdminDateField({
  id,
  value,
  onChange,
  disabled,
  placeholder = 'Select date',
  clear = false,
  className,
  'aria-labelledby': ariaLabelledBy,
  error,
  'aria-label': ariaLabel,
}: AdminDateFieldProps) {
  const autoId = useId()
  const triggerId = id ?? autoId
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => localDateFromYyyyMmDd(value), [value])
  const [month, setMonth] = useState(() => selected ?? new Date())

  useEffect(() => {
    const d = localDateFromYyyyMmDd(value)
    if (d) setMonth(d)
  }, [value])

  const onSelectDay = (day: Date | undefined) => {
    if (!day) return
    onChange(yyyyMmDdFromLocalDate(day))
  }

  const goToday = useCallback(() => {
    const t = localStartOfToday()
    setMonth(t)
    onChange(yyyyMmDdFromLocalDate(t))
  }, [onChange])

  const display = value.trim() ? value : ''

  const monthYearFormatters = useMemo(
    () => ({
      formatCaption: (d: Date) => adminFormatMonthYearCaption(d),
    }),
    [],
  )

  const onClear = () => {
    onChange('')
    setOpen(false)
  }

  return (
    <AdminPopover open={open} onOpenChange={setOpen}>
      <div className="flex w-full items-stretch gap-1">
        <AdminPopoverTrigger asChild>
          <button
            type="button"
            id={triggerId}
            aria-labelledby={ariaLabelledBy}
            aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : 'Select date')}
            disabled={disabled}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={cn(
              'mt-1',
              adminFieldControlClass,
              'flex items-center gap-2 pr-3 text-left',
              error ? fieldErrorClass : null,
              disabled ? 'opacity-60' : null,
              className,
            )}
          >
            <CalendarIcon
              size={16}
              className="shrink-0 self-center opacity-70"
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--color-text)] tracking-tight">
              {display ? (
                display
              ) : (
                <span className="font-sans text-[var(--color-text-muted)]">
                  {placeholder}
                </span>
              )}
            </span>
            <ChevronDown
              size={16}
              className="shrink-0 self-center opacity-60"
              aria-hidden
            />
          </button>
        </AdminPopoverTrigger>
        {clear ? (
          <button
            type="button"
            tabIndex={-1}
            className={cn(
              adminFieldClearButtonClass,
              !display ? 'pointer-events-none opacity-30' : null,
            )}
            disabled={disabled || !display}
            aria-label="Clear date filter"
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
          >
            <X size={16} aria-hidden />
          </button>
        ) : null}
      </div>
      <AdminPopoverContent
        aria-labelledby={triggerId}
        collisionPadding={12}
        className="w-[min(100vw-1.25rem,20rem)] flex-col gap-2"
      >
        <DayPicker
          mode="single"
          navLayout="around"
          selected={selected}
          onSelect={onSelectDay}
          month={month}
          onMonthChange={setMonth}
          disabled={disabled}
          className={adminReactDayPickerRootClassName}
          classNames={adminReactDayPickerClassNames}
          components={adminDayPickerNavComponents}
          formatters={monthYearFormatters}
          footer={
            <div className="flex justify-center px-0 pt-1">
              <button
                type="button"
                disabled={disabled}
                className={cn(
                  'focus-ring rounded-md px-2 py-1 text-xs font-medium text-[var(--color-accent)]',
                  'hover:bg-[var(--color-chip)] hover:text-[var(--color-text)]',
                  'disabled:pointer-events-none disabled:opacity-40',
                )}
                onClick={goToday}
              >
                Today
              </button>
            </div>
          }
        />
      </AdminPopoverContent>
    </AdminPopover>
  )
})
