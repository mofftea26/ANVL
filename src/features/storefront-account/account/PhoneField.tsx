import { useMemo } from 'react'

/** Curated dial codes (Lebanon first, then common ANVL ship-to markets). */
const DIAL_CODES: { code: string; label: string; flag: string }[] = [
  { code: '+961', label: 'Lebanon', flag: '🇱🇧' },
  { code: '+971', label: 'UAE', flag: '🇦🇪' },
  { code: '+966', label: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', label: 'Qatar', flag: '🇶🇦' },
  { code: '+965', label: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', label: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', label: 'Oman', flag: '🇴🇲' },
  { code: '+962', label: 'Jordan', flag: '🇯🇴' },
  { code: '+20', label: 'Egypt', flag: '🇪🇬' },
  { code: '+1', label: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', label: 'United Kingdom', flag: '🇬🇧' },
  { code: '+33', label: 'France', flag: '🇫🇷' },
  { code: '+49', label: 'Germany', flag: '🇩🇪' },
  { code: '+39', label: 'Italy', flag: '🇮🇹' },
  { code: '+34', label: 'Spain', flag: '🇪🇸' },
  { code: '+31', label: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', label: 'Sweden', flag: '🇸🇪' },
  { code: '+61', label: 'Australia', flag: '🇦🇺' },
  { code: '+90', label: 'Türkiye', flag: '🇹🇷' },
]

/** Split a stored "+961 71123456" value into its dial code + local number. */
function splitPhone(value: string): { dial: string; local: string } {
  const trimmed = (value ?? '').trim()
  const match = [...DIAL_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((d) => trimmed.startsWith(d.code))
  if (match) return { dial: match.code, local: trimmed.slice(match.code.length).trim() }
  return { dial: '+961', local: trimmed.replace(/^\+/, '') }
}

/**
 * Modern phone-number picker: a flagged dial-code select + a numeric field.
 * Emits a single E.164-ish string ("+961 71123456"). Controlled.
 */
export function PhoneField({
  value,
  onChange,
  id,
}: {
  value: string
  onChange: (next: string) => void
  id?: string
}) {
  const { dial, local } = useMemo(() => splitPhone(value), [value])

  const emit = (nextDial: string, nextLocal: string) => {
    const cleanedLocal = nextLocal.replace(/[^\d\s-]/g, '').trimStart()
    onChange(cleanedLocal ? `${nextDial} ${cleanedLocal}` : '')
  }

  const fieldBase =
    'h-11 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)] focus-ring'

  return (
    <div className="flex gap-2">
      <select
        aria-label="Country dial code"
        className={`${fieldBase} w-[7.5rem] shrink-0 px-2 text-sm`}
        value={dial}
        onChange={(e) => emit(e.target.value, local)}
      >
        {DIAL_CODES.map((d, i) => (
          <option key={`${d.code}-${i}`} value={d.code}>
            {d.flag} {d.code}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="71 123 456"
        className={`${fieldBase} min-w-0 flex-1 px-3 text-base md:text-sm`}
        value={local}
        onChange={(e) => emit(dial, e.target.value)}
      />
    </div>
  )
}
