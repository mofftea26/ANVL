import { Button } from './Button'

export function QuantityStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => onChange(Math.max(1, value - 1))}>
        -
      </Button>
      <span className="min-w-8 text-center text-sm">{value}</span>
      <Button variant="secondary" size="sm" onClick={() => onChange(value + 1)}>
        +
      </Button>
    </div>
  )
}
