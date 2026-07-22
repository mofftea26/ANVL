import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { ChevronDown, Search } from '@/shared/icons'
import {
  COUNTRY_DIAL_CODES,
  DEFAULT_PHONE_ISO2,
  findCountryByIso2,
  matchCountryByDigits,
  type CountryDialCode,
} from '@/shared/data/countryDialCodes'
import { cn } from '@/shared/lib/cn'
import { inputBaseClass } from './Input'

/** Normalized E.164-ish shape the input emits: `+<dial><national>`, no spaces. */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim()
  if (!/^\+[1-9]\d{6,14}$/.test(trimmed)) return false
  const country = matchCountryByDigits(trimmed.slice(1))
  if (!country) return false
  return trimmed.length - 1 - country.dial.length >= 4
}

/**
 * Split a stored phone value into its country + national digits using
 * longest-dial-prefix matching (`+1242…` → Bahamas beats `+1` → United
 * States). Unparseable input falls back to the default country with the raw
 * digits as the national part.
 */
export function parsePhoneValue(value: string): {
  country: CountryDialCode
  national: string
} {
  const fallback = findCountryByIso2(DEFAULT_PHONE_ISO2)!
  const digits = (value ?? '').replace(/\D/g, '')
  if (!digits) return { country: fallback, national: '' }
  const match = matchCountryByDigits(digits)
  if (!match) return { country: fallback, national: digits }
  return { country: match, national: digits.slice(match.dial.length) }
}

function filterCountries(query: string): CountryDialCode[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...COUNTRY_DIAL_CODES]
  const digits = q.replace(/^\+/, '')
  return COUNTRY_DIAL_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.iso2.toLowerCase() === q ||
      (/^\d+$/.test(digits) && c.dial.startsWith(digits)),
  )
}

export interface PhoneInputProps {
  /** Normalized value: `''` or `+<dial><national>` (no spaces). */
  value: string
  onChange: (next: string) => void
  id?: string
  disabled?: boolean
  placeholder?: string
  autoComplete?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/**
 * Storefront phone input: a searchable country picker (full inline dataset,
 * flag + ISO code + dial code — the ISO text carries the country on platforms
 * that don't render flag emoji) beside a national-number field. Emits a single
 * normalized `+<dial><national>` string and re-parses incoming values by
 * longest-dial-prefix. The picker is a combobox-style listbox: type to filter
 * by name or dial code, arrow keys move the active option
 * (`aria-activedescendant`), Enter selects, Escape closes.
 */
export function PhoneInput({
  value,
  onChange,
  id,
  disabled,
  placeholder = '71 123 456',
  autoComplete = 'tel-national',
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: PhoneInputProps) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLLIElement | null)[]>([])

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  // The picked country survives while its dial still prefixes the value (so
  // Canada isn't re-parsed as the US) and drives new input while empty.
  const [pickedIso2, setPickedIso2] = useState<string | null>(null)

  const digits = value.replace(/\D/g, '')
  const picked = pickedIso2 ? findCountryByIso2(pickedIso2) : undefined
  const country =
    picked && (digits === '' || digits.startsWith(picked.dial))
      ? picked
      : parsePhoneValue(value).country
  const national = digits.startsWith(country.dial) ? digits.slice(country.dial.length) : digits

  const options = useMemo(() => filterCountries(query), [query])

  const emit = (nextCountry: CountryDialCode, nextNational: string) => {
    const cleaned = nextNational.replace(/\D/g, '')
    onChange(cleaned ? `+${nextCountry.dial}${cleaned}` : '')
  }

  const close = (refocusTrigger = true) => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
    if (refocusTrigger) triggerRef.current?.focus()
  }

  const pick = (option: CountryDialCode) => {
    setPickedIso2(option.iso2)
    emit(option, national)
    close()
  }

  // Focus the search field when the picker opens.
  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  // Close on outside pointerdown.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
        setActiveIndex(0)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open) return
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) pick(option)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'Tab') {
      close(false)
    }
  }

  const activeOptionId = options[activeIndex]
    ? `${listboxId}-${options[activeIndex].iso2}`
    : undefined

  return (
    <div ref={rootRef} className="relative flex gap-2">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={`Country: ${country.name} (+${country.dial})`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className={cn(
          inputBaseClass({ density: 'comfortable' }),
          'flex w-[7.5rem] shrink-0 cursor-pointer items-center justify-between gap-1.5 whitespace-nowrap',
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden="true">{country.flag}</span>
          <span className="text-xs font-semibold">{country.iso2}</span>
          <span className="truncate text-[var(--color-text-muted)]">+{country.dial}</span>
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn('shrink-0 text-[var(--color-text-muted)] transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[100] w-[min(19rem,80vw)] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)] shadow-[0_20px_50px_-14px_rgba(0,0,0,0.65)]">
          <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-3 py-2">
            <Search size={15} aria-hidden="true" className="shrink-0 text-[var(--color-text-muted)]" />
            <input
              ref={searchRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-activedescendant={activeOptionId}
              aria-label="Search countries by name or dial code"
              placeholder="Search country or code…"
              className="w-full bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] md:text-sm"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onSearchKeyDown}
            />
          </div>
          <ul id={listboxId} role="listbox" aria-label="Countries" className="max-h-64 overflow-y-auto p-1.5">
            {options.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-[var(--color-text-muted)]">No matches.</li>
            ) : (
              options.map((option, index) => (
                <li
                  key={option.iso2}
                  ref={(el) => {
                    optionRefs.current[index] = el
                  }}
                  id={`${listboxId}-${option.iso2}`}
                  role="option"
                  aria-selected={option.iso2 === country.iso2}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[var(--color-text)]',
                    index === activeIndex && 'bg-[var(--color-chip)]',
                    option.iso2 === country.iso2 && 'font-semibold text-[var(--color-heading)]',
                  )}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => pick(option)}
                >
                  <span aria-hidden="true">{option.flag}</span>
                  <span className="w-7 shrink-0 text-xs font-semibold text-[var(--color-text-muted)]">
                    {option.iso2}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{option.name}</span>
                  <span className="shrink-0 text-xs text-[var(--color-text-muted)]">+{option.dial}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}

      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        className={cn(inputBaseClass({ density: 'comfortable' }), 'min-w-0 flex-1')}
        value={national}
        onChange={(e) => emit(country, e.target.value)}
      />
    </div>
  )
}
