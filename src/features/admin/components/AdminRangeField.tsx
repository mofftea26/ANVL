import { FormField } from '@/shared/components/ui/FormField'

export type AdminRangeFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (n: number) => void
}

/** Labeled range slider (label shows the live value) — admin config sliders. */
export function AdminRangeField({ label, value, min, max, step, suffix, onChange }: AdminRangeFieldProps) {
  return (
    <FormField label={`${label} — ${value}${suffix ?? ''}`} labelStyle="stacked">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="focus-ring h-2 w-full cursor-pointer accent-[var(--color-accent)]"
        aria-label={label}
      />
    </FormField>
  )
}
