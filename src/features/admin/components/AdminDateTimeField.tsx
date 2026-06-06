import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react'
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react'
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
import {
  AdminPopover,
  AdminPopoverContent,
  AdminPopoverTrigger,
} from '@/features/admin/components/AdminPopover'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from '@/features/admin/components/AdminSelect'
import {
  adminFieldClearButtonClass,
  adminFieldControlClass,
  fieldErrorClass,
} from '@/shared/lib/cmsFieldStyles'
import {
  coerceToDate,
  isoToDatetimeLocalValue,
  localStartOfToday,
  setLocalClock,
  snapMinuteOfHour,
} from '@/features/admin/lib/adminDateTime'
import { cn } from '@/shared/lib/cn'

/** 24‑hour compact display aligned with retired `datetime-local` ordering. */
function formatTwentyFourHourLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const s = isoToDatetimeLocalValue(d.toISOString())
  const [ymd, hm] = s.split('T')
  return hm ? `${ymd} · ${hm}` : ymd ?? ''
}

export type AdminDateTimeFieldProps = {
  id?: string
  'aria-labelledby'?: string
  className?: string
  /** UTC ISO string or `Date`. */
  value?: string | Date | undefined
  onChange: (next: string | undefined) => void
  disabled?: boolean
  /** Minute step for the time row (default `1`). */
  timeStepMinutes?: number
  /** Optional clear control for nullable fields. */
  clear?: boolean
  placeholder?: string
  error?: boolean
  'aria-label'?: string
}

export const AdminDateTimeField = memo(function AdminDateTimeField({
  id,
  'aria-labelledby': ariaLabelledBy,
  className,
  value,
  onChange,
  disabled,
  timeStepMinutes = 1,
  clear = false,
  placeholder = 'Select date & time',
  error,
  'aria-label': ariaLabel,
}: AdminDateTimeFieldProps) {
  const autoId = useId()
  const triggerId = id ?? autoId
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => coerceToDate(value), [value])
  const [month, setMonth] = useState(() => selected ?? new Date())

  useEffect(() => {
    const d = coerceToDate(value)
    if (d) setMonth(d)
  }, [value])

  const anchorDay = selected ?? localStartOfToday()

  const { hourOpts, minuteOpts } = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => h)
    const minutes: number[] = []
    for (let m = 0; m < 60; m += Math.max(1, timeStepMinutes)) {
      minutes.push(m)
    }
    return { hourOpts: hours, minuteOpts: minutes }
  }, [timeStepMinutes])

  const h = anchorDay.getHours()
  const m = snapMinuteOfHour(
    anchorDay.getMinutes(),
    Math.max(1, timeStepMinutes),
  )

  const commitClock = useCallback(
    (nextH: number, nextM: number) => {
      const baseDay = coerceToDate(value) ?? localStartOfToday()
      const sm = snapMinuteOfHour(nextM, Math.max(1, timeStepMinutes))
      onChange(setLocalClock(baseDay, nextH, sm).toISOString())
    },
    [value, onChange, timeStepMinutes],
  )

  const onSelectDay = useCallback(
    (day: Date | undefined) => {
      if (!day) return
      const preserved = coerceToDate(value)
      const nextH = preserved?.getHours() ?? 0
      const rawM = preserved?.getMinutes() ?? 0
      const sm = snapMinuteOfHour(rawM, Math.max(1, timeStepMinutes))
      onChange(setLocalClock(day, nextH, sm).toISOString())
    },
    [value, onChange, timeStepMinutes],
  )

  const goToday = useCallback(() => {
    const t = localStartOfToday()
    setMonth(t)
    onSelectDay(t)
  }, [onSelectDay])

  const labelText = selected
    ? formatTwentyFourHourLabel(selected.toISOString())
    : ''

  const onClearInner = () => {
    onChange(undefined)
    setOpen(false)
  }

  const monthYearFormatters = useMemo(
    () => ({
      formatCaption: (d: Date) => adminFormatMonthYearCaption(d),
    }),
    [],
  )

  return (
    <AdminPopover open={open} onOpenChange={setOpen}>
      <div className="flex w-full items-stretch gap-1">
        <AdminPopoverTrigger asChild>
          <button
            type="button"
            id={triggerId}
            aria-labelledby={ariaLabelledBy}
            aria-label={
              ariaLabel ??
              (ariaLabelledBy ? undefined : 'Select date and time')
            }
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              'mt-1',
              adminFieldControlClass,
              // Match `AdminInput`: `adminFieldControlClass` py-2 + text-sm; no extra min-height.
              'flex items-center gap-2.5 pr-3 text-left',
              error ? fieldErrorClass : null,
              disabled ? 'opacity-60' : null,
              className,
            )}
          >
            <CalendarIcon
              size={18}
              className="shrink-0 self-center opacity-70"
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-[var(--color-text)]">
              {labelText || (
                <span className="text-[var(--color-text-muted)]">
                  {placeholder}
                </span>
              )}
            </span>
            <ChevronDown
              size={18}
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
              !selected ? 'pointer-events-none opacity-30' : null,
            )}
            disabled={disabled || !selected}
            aria-label="Clear date and time"
            onClick={(e) => {
              e.stopPropagation()
              onClearInner()
            }}
          >
            <X size={16} aria-hidden />
          </button>
        ) : null}
      </div>
      <AdminPopoverContent
        aria-labelledby={triggerId}
        collisionPadding={12}
        className="w-[min(100vw-1.25rem,20rem)] flex-col gap-2.5"
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

        <div className="shrink-0 space-y-2 border-t border-[var(--color-line)] pt-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            Time (24h)
            {timeStepMinutes > 1 ? ` · ${timeStepMinutes}-min steps` : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <AdminSelect
              value={String(h)}
              onValueChange={(v) =>
                commitClock(Number.parseInt(v, 10), m)
              }
              disabled={disabled}
            >
              <AdminSelectTrigger
                label="Hour"
                className="w-full min-w-0"
                disabled={disabled}
                aria-label="Hour"
              >
                <AdminSelectValue />
              </AdminSelectTrigger>
              <AdminSelectContent>
                {hourOpts.map((hr) => (
                  <AdminSelectItem key={hr} value={String(hr)}>
                    {String(hr).padStart(2, '0')}
                  </AdminSelectItem>
                ))}
              </AdminSelectContent>
            </AdminSelect>
            <AdminSelect
              value={String(m)}
              onValueChange={(v) =>
                commitClock(h, Number.parseInt(v, 10))
              }
              disabled={disabled}
            >
              <AdminSelectTrigger
                label="Min"
                className="w-full min-w-0"
                disabled={disabled}
                aria-label="Minute"
              >
                <AdminSelectValue />
              </AdminSelectTrigger>
              <AdminSelectContent>
                {minuteOpts.map((min) => (
                  <AdminSelectItem key={min} value={String(min)}>
                    {String(min).padStart(2, '0')}
                  </AdminSelectItem>
                ))}
              </AdminSelectContent>
            </AdminSelect>
          </div>
        </div>

        <p className="text-[9px] leading-snug text-[var(--color-text-muted)]">
          Stored value is UTC ISO; calendar and clocks use this browser&apos;s
          local timezone (same semantics as legacy{' '}
          <code className="rounded bg-[var(--color-chip)] px-1 font-mono text-[9px]">
            datetime-local
          </code>
          ).
        </p>

        {clear && selected ? (
          <div className="flex justify-end">
            <button
              type="button"
              className={cn(
                'focus-ring rounded-md border border-transparent px-2 py-1 text-xs font-medium text-[var(--color-text-muted)]',
                'hover:bg-[var(--color-chip)] hover:text-[var(--color-text)]',
              )}
              onClick={onClearInner}
            >
              Clear selection
            </button>
          </div>
        ) : null}
      </AdminPopoverContent>
    </AdminPopover>
  )
})
