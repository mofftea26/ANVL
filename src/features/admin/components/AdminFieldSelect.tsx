import { AdminFormField } from './AdminFormField'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from './AdminSelect'

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
    <AdminFormField label={label} hint={hint}>
      <AdminSelect value={value} onValueChange={onChange} disabled={disabled}>
        <AdminSelectTrigger aria-label={label}>
          <AdminSelectValue placeholder={placeholder}>
            {selected?.label ?? placeholder}
          </AdminSelectValue>
        </AdminSelectTrigger>
        <AdminSelectContent>
          {options.map((o) => (
            <AdminSelectItem key={o.value} value={o.value}>
              <span className="flex flex-col gap-0.5">
                <span>{o.label}</span>
                {o.description ? (
                  <span className="text-[0.65rem] leading-snug text-[var(--color-text-muted)]">
                    {o.description}
                  </span>
                ) : null}
              </span>
            </AdminSelectItem>
          ))}
        </AdminSelectContent>
      </AdminSelect>
    </AdminFormField>
  )
}
