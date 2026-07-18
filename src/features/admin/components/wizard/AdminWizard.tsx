import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { ArrowLeft, ArrowRight, Check } from '@/shared/icons'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'

export interface AdminWizardStep<TDraft> {
  key: string
  title: string
  /** One-line explanation shown under the step rail. */
  blurb?: string
  render: (draft: TDraft, setDraft: Dispatch<SetStateAction<TDraft>>) => ReactNode
}

interface AdminWizardProps<TDraft> {
  open: boolean
  onClose: () => void
  title: string
  steps: Array<AdminWizardStep<TDraft>>
  /** Seed draft — re-applied every time the wizard opens. */
  initial: TDraft
  saving?: boolean
  saveLabel?: string
  onSave: (draft: TDraft) => void
  className?: string
}

/**
 * Generic multi-step CMS wizard — modal shell, jumpable step rail,
 * back/next/save footer, and a local draft that re-seeds on every open and
 * persists only through `onSave`. Extracted from the passport content wizard;
 * any multi-step admin flow (batch generation, story chapters, …) builds on
 * this instead of re-rolling the chrome.
 */
export function AdminWizard<TDraft>({
  open,
  onClose,
  title,
  steps,
  initial,
  saving = false,
  saveLabel = 'Save',
  onSave,
  className,
}: AdminWizardProps<TDraft>) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<TDraft>(initial)

  // Re-seed when the wizard opens for a (possibly different) subject.
  useEffect(() => {
    if (open) {
      setDraft(initial)
      setStep(0)
    }
  }, [open, initial])

  const active = steps[step]
  if (!active) return null
  const isLast = step === steps.length - 1

  return (
    <Modal open={open} onClose={onClose} title={title} className={cn('max-w-3xl', className)}>
      <div className="flex flex-col gap-5">
        <ol className="flex flex-wrap items-center gap-1.5" aria-label="Wizard steps">
          {steps.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? 'step' : undefined}
                className={cn(
                  'focus-ring rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors',
                  i === step
                    ? 'border-[var(--color-highlight)] bg-[color-mix(in_oklab,var(--color-highlight)_16%,transparent)] text-[var(--color-heading)]'
                    : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                )}
              >
                {i + 1}. {s.title}
              </button>
            </li>
          ))}
        </ol>

        {active.blurb ? (
          <p className="text-xs text-[var(--color-text-muted)]">{active.blurb}</p>
        ) : null}

        <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {active.render(draft, setDraft)}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              density="compact"
              loading={saving}
              onClick={() => onSave(draft)}
            >
              <Check size={15} aria-hidden="true" />
              {saveLabel}
            </Button>
            {!isLast ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                density="compact"
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              >
                Next
                <ArrowRight size={15} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  )
}
