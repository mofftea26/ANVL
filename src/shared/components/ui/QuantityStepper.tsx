import { Button } from './Button'

/**
 * Quantity stepper. Uses md-size buttons (h-10) on touch surfaces so the
 * decrement / increment targets meet WCAG 2.5.5 (RESP-05).
 */
export function QuantityStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="Decrease quantity"
      >
        −
      </Button>
      <span
        className="min-w-10 text-center text-sm"
        aria-live="polite"
        aria-label={`Quantity ${value}`}
      >
        {value}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        +
      </Button>
    </div>
  )
}
