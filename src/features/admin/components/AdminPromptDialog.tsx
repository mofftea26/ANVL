import { useEffect, useId, useState, type ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Select, SelectItem } from '@/shared/components/ui/Select'

export type AdminPromptDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  /** Optional lead copy above the input. */
  description?: ReactNode
  /** Label for the text input. */
  inputLabel: string
  placeholder?: string
  /** Initial input value each time the dialog opens. */
  defaultValue?: string
  /**
   * Optional extra choice rendered as a select under the input
   * (e.g. appearance: light/dark). `extraDefault` falls back to the first option.
   */
  extraLabel?: string
  extraOptions?: readonly { value: string; label: string }[]
  extraDefault?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmLoading?: boolean
  /**
   * Validate before confirm — return an error message to block, null to pass.
   * Default: the value must be non-empty.
   */
  validate?: (value: string) => string | null
  /** Receives the (trimmed) value, plus the extra choice when configured. */
  onConfirm: (value: string, extra?: string) => void
}

function defaultValidate(value: string): string | null {
  return value.trim().length > 0 ? null : 'This field is required.'
}

/**
 * Small admin prompt modal: a title, one labeled {@link Input} (initial focus),
 * an optional extra {@link Select} choice, and Confirm/Cancel. Submits on
 * Enter, blocks on validation (non-empty by default), Escape/backdrop cancels
 * via the shared {@link Modal} focus trap.
 */
export function AdminPromptDialog({
  open,
  onClose,
  title,
  description,
  inputLabel,
  placeholder,
  defaultValue = '',
  extraLabel,
  extraOptions,
  extraDefault,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmLoading = false,
  validate = defaultValidate,
  onConfirm,
}: AdminPromptDialogProps) {
  const inputId = useId()
  const extraId = useId()
  const [value, setValue] = useState(defaultValue)
  const [extra, setExtra] = useState(extraDefault ?? extraOptions?.[0]?.value ?? '')
  const [error, setError] = useState<string | null>(null)

  const focusInput = () => document.getElementById(inputId)?.focus()

  // Reset per open so a reused dialog never leaks the previous prompt's state,
  // then move initial focus into the input (the Modal focuses its panel by
  // default). `defaultValue`/`extraDefault` are intentionally read per open only.
  useEffect(() => {
    if (!open) return
    setValue(defaultValue)
    setExtra(extraDefault ?? extraOptions?.[0]?.value ?? '')
    setError(null)
    const timer = setTimeout(focusInput, 0)
    return () => clearTimeout(timer)
    // Intentionally keyed on `open` alone — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const hasExtra = Boolean(extraLabel && extraOptions && extraOptions.length > 0)

  // Named `submit`, not `confirm` — a local `confirm` shadows window.confirm
  // and permanently trips native-dialog audit greps.
  const submit = () => {
    const trimmed = value.trim()
    const problem = validate(trimmed)
    if (problem) {
      setError(problem)
      focusInput()
      return
    }
    onConfirm(trimmed, hasExtra ? extra : undefined)
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        noValidate
      >
        {description ? (
          <div className="text-sm text-[var(--color-text-muted)]">{description}</div>
        ) : null}
        <FormField label={inputLabel} htmlFor={inputId} error={error ?? undefined} labelStyle="stacked">
          <Input
            id={inputId}
            density="compact"
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(null)
            }}
          />
        </FormField>
        {hasExtra ? (
          <FormField label={extraLabel!} htmlFor={extraId} labelStyle="stacked">
            <Select
              id={extraId}
              density="compact"
              value={extra}
              onValueChange={setExtra}
              aria-label={extraLabel}
            >
              {extraOptions!.map((option) => (
                <SelectItem key={option.value} value={option.value} density="compact">
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </FormField>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            disabled={confirmLoading}
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            density="compact"
            loading={confirmLoading}
            disabled={confirmLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
