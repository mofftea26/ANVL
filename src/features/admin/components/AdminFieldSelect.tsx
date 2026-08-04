import { useId, type ReactNode } from 'react'
import { FormField } from '@/shared/components/ui/FormField'
import { Select, SelectItem } from '@/shared/components/ui/Select'

type Option = { value: string; label: string; description?: string }

type AdminFieldSelectProps = {
  label: string
  value: string
  options: readonly Option[]
  onChange: (value: string) => void
  hint?: string
  disabled?: boolean
  placeholder?: string
  /**
   * Status copy rendered directly under the select and linked to it via
   * aria-describedby (e.g. the font editor's "Active: Sora" caption).
   */
  caption?: ReactNode
}

/**
 * Radix refuses an empty-string item value: it reserves `''` for "cleared, show
 * the placeholder", and a `<Select.Item value="">` throws and takes the whole
 * panel down.
 *
 * But a real select often needs an explicit none — "All products", "Unassigned",
 * "Assign later" — that the user can select BACK to, which a placeholder cannot
 * express. Shielding callers from that constraint is this wrapper's job, so an
 * empty-valued option is swapped for a sentinel on the way in and swapped back
 * on the way out.
 *
 * The swap only engages when an empty-valued option is actually present, so
 * every existing caller (where `value === ''` genuinely means "show the
 * placeholder") behaves exactly as before.
 */
const EMPTY_OPTION_SENTINEL = '__anvl_select_none__'

export function AdminFieldSelect({
  label,
  value,
  options,
  onChange,
  hint,
  disabled,
  placeholder = 'Select…',
  caption,
}: AdminFieldSelectProps) {
  const captionId = useId()
  const selected = options.find((o) => o.value === value)

  const hasEmptyOption = options.some((o) => o.value === '')
  const toRadix = (v: string) => (hasEmptyOption && v === '' ? EMPTY_OPTION_SENTINEL : v)
  const fromRadix = (v: string) => (v === EMPTY_OPTION_SENTINEL ? '' : v)

  return (
    <FormField label={label} hint={hint} labelStyle="stacked">
      <Select
        value={toRadix(value)}
        onValueChange={(next) => onChange(fromRadix(next))}
        disabled={disabled}
        placeholder={placeholder}
        valueLabel={selected?.label ?? placeholder}
        density="compact"
        aria-label={label}
        aria-describedby={caption ? captionId : undefined}
      >
        {options.map((o) => (
          <SelectItem key={o.value} value={toRadix(o.value)} density="compact">
            <span className="flex flex-col gap-0.5">
              <span>{o.label}</span>
              {o.description ? (
                <span className="text-[0.65rem] leading-snug text-[var(--color-text-muted)]">
                  {o.description}
                </span>
              ) : null}
            </span>
          </SelectItem>
        ))}
      </Select>
      {caption ? (
        <div id={captionId} className="mt-1.5 text-xs text-[var(--color-text-muted)]">
          {caption}
        </div>
      ) : null}
    </FormField>
  )
}
