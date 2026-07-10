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
}

export function AdminFieldSelect({
  label,
  value,
  options,
  onChange,
  hint,
  disabled,
  placeholder = 'Select…',
}: AdminFieldSelectProps) {
  const selected = options.find((o) => o.value === value)

  return (
    <FormField label={label} hint={hint} labelStyle="stacked">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        valueLabel={selected?.label ?? placeholder}
        density="compact"
        aria-label={label}
      >
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} density="compact">
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
    </FormField>
  )
}
