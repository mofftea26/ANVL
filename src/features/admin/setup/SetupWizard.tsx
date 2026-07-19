import { AdminWizard, type AdminWizardStep } from '@/features/admin/components/wizard/AdminWizard'

export interface SetupWizardStep {
  key: string
  title: string
  /** One-line explanation shown under the step rail. */
  blurb?: string
  /** Step body — MUST return an element (component boundary) so it may use hooks. */
  render: () => React.ReactNode
}

interface SetupWizardProps {
  open: boolean
  onClose: () => void
  title: string
  steps: SetupWizardStep[]
}

/**
 * Guided-setup shell over the generic {@link AdminWizard}: there is no wizard-
 * level draft — every step owns its OWN working copy and per-step Save (the
 * same `save*Async` / service writes the real editors use), so the footer
 * "Save" becomes a plain "Done" that closes the wizard. Widened over the
 * default wizard so slot grids and list editors fit.
 */
export function SetupWizard({ open, onClose, title, steps }: SetupWizardProps) {
  const wizardSteps: Array<AdminWizardStep<null>> = steps.map((step) => ({
    key: step.key,
    title: step.title,
    blurb: step.blurb,
    render: () => step.render(),
  }))

  return (
    <AdminWizard<null>
      open={open}
      onClose={onClose}
      title={title}
      steps={wizardSteps}
      initial={null}
      saveLabel="Done"
      onSave={onClose}
      className="max-w-4xl"
    />
  )
}
