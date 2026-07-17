import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Calendar, ChevronLeft, ChevronRight } from '@/shared/icons'
import { useMemo, useState } from 'react'
import { inputBaseClass } from '@/shared/components/ui/Input'
import { Select, SelectItem } from '@/shared/components/ui/Select'
import { cn } from '@/shared/lib/cn'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Parse a "YYYY-MM-DD" value into a local Date (avoids UTC-shift bugs). */
function parseIso(value: string | undefined): Date | null {
  const m = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** 6-week (42-day) grid starting on the Sunday on/before the 1st of the month. */
function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
}

/**
 * Modern, dependency-free date picker: an Input-styled trigger opens a small
 * calendar (Radix Popover) with quick Month/Year jumps — built for fast entry
 * of dates far in the past (e.g. date of birth) without dozens of arrow clicks.
 * Value/onChange use plain "YYYY-MM-DD" strings, matching the native
 * `<input type="date">` contract it replaces.
 */
export function DatePicker({
  value,
  onChange,
  id,
  placeholder = 'Select date',
  minYear,
  maxDate,
  disabled,
}: {
  value?: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  /** Oldest selectable year. Defaults to 100 years before today. */
  minYear?: number
  /** Latest selectable date. Defaults to today (no future dates). */
  maxDate?: Date
  disabled?: boolean
}) {
  const selected = useMemo(() => parseIso(value), [value])
  const today = useMemo(() => new Date(), [])
  const cappedMax = maxDate ?? today
  const oldestYear = minYear ?? today.getFullYear() - 100

  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? cappedMax.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? cappedMax.getMonth())

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const years = useMemo(() => {
    const out: number[] = []
    for (let y = cappedMax.getFullYear(); y >= oldestYear; y--) out.push(y)
    return out
  }, [cappedMax, oldestYear])

  const goMonth = (delta: number) => {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setViewMonth(m)
    setViewYear(y)
  }

  const pick = (d: Date) => {
    onChange(toIso(d))
    setOpen(false)
  }

  const display = selected
    ? selected.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setViewYear(selected?.getFullYear() ?? cappedMax.getFullYear())
          setViewMonth(selected?.getMonth() ?? cappedMax.getMonth())
        }
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            inputBaseClass(),
            'flex items-center justify-between gap-2 text-left',
            !display && 'text-[var(--color-text-muted)]',
          )}
        >
          <span className="min-w-0 truncate">{display || placeholder}</span>
          <Calendar size={15} aria-hidden="true" className="shrink-0 text-[var(--color-text-muted)]" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={8}
          align="start"
          className="z-[85] w-[21rem] rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_20px_50px_-14px_rgba(0,0,0,0.65)] outline-none backdrop-blur-md"
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              aria-label="Previous month"
              className="focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-chip)] hover:text-[var(--color-text)]"
            >
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <div className="flex flex-1 gap-1.5">
              <Select
                aria-label="Month"
                value={String(viewMonth)}
                onValueChange={(v) => setViewMonth(Number(v))}
                className="h-8 px-2 text-xs"
              >
                {MONTH_NAMES.map((m, i) => (
                  <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                ))}
              </Select>
              <Select
                aria-label="Year"
                value={String(viewYear)}
                onValueChange={(v) => setViewYear(Number(v))}
                className="h-8 w-[5.25rem] shrink-0 px-2 text-xs"
              >
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </Select>
            </div>
            <button
              type="button"
              onClick={() => goMonth(1)}
              aria-label="Next month"
              className="focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-chip)] hover:text-[var(--color-text)]"
            >
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((w, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="anvl-micro grid h-6 place-items-center text-[10px] text-[var(--color-text-muted)]"
              >
                {w}
              </span>
            ))}
            {grid.map((d) => {
              const inMonth = d.getMonth() === viewMonth
              const isToday = isSameDay(d, today)
              const isSelected = selected != null && isSameDay(d, selected)
              const isOutOfRange = d > cappedMax || d.getFullYear() < oldestYear
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={isOutOfRange}
                  onClick={() => pick(d)}
                  aria-current={isToday ? 'date' : undefined}
                  aria-pressed={isSelected}
                  className={cn(
                    'focus-ring aspect-square rounded-lg text-xs transition-colors',
                    !inMonth && 'text-[var(--color-text-muted)]/40',
                    inMonth && !isSelected && 'text-[var(--color-text)] hover:bg-[var(--color-chip)]',
                    isSelected && 'bg-[var(--color-accent)] font-semibold text-[color:var(--color-bg)]',
                    isToday && !isSelected && 'ring-1 ring-inset ring-[var(--color-accent)]',
                    isOutOfRange && 'pointer-events-none opacity-30',
                  )}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
