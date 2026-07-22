import {
  AdminWizard,
  type AdminWizardStep,
  type AdminWizardStepPreview,
} from '@/features/admin/components/wizard/AdminWizard'
import { useProvideWizardDirty } from '@/features/admin/components/wizard/wizardDirty'
import { useRegisterAdminDirty } from '@/features/admin/hooks/useRegisterAdminDirty'

export interface SetupWizardStep {
  key: string
  title: string
  /** One-line explanation shown under the step rail. */
  blurb?: string
  /** Live-preview binding — docked desktop mode shows this route/highlight. */
  preview?: AdminWizardStepPreview
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
 * "Save" becomes a plain "Done" that closes the wizard.
 *
 * Two additions over the plain wizard:
 *  - **Dirty guard (D6):** step working copies (`useSetupBlobStep`) register
 *    into a wizard-scoped dirty registry; closing or changing steps while
 *    dirty opens a Save / Discard / Continue-editing choice. The aggregate is
 *    mirrored into the admin dirty registry so route navigation and tab close
 *    are covered too.
 *  - **Docked preview (≥1280px):** the wizard docks left as a full-height
 *    sheet and drives the shell's live preview panel per step.
 */
export function SetupWizard({ open, onClose, title, steps }: SetupWizardProps) {
  const dirty = useProvideWizardDirty()

  // Route-nav + tab-close coverage via the layout-level guard. Keyed per
  // wizard — the hub mounts all wizards at once, so a shared id would let a
  // closed wizard clear an open one's dirty flag.
  useRegisterAdminDirty(`setup-wizard:${title}`, open && dirty.anyDirty)

  const wizardSteps: Array<AdminWizardStep<null>> = steps.map((step) => ({
    key: step.key,
    title: step.title,
    blurb: step.blurb,
    preview: step.preview,
    render: () => step.render(),
  }))

  return (
    <dirty.Provider>
      <AdminWizard<null>
        open={open}
        onClose={onClose}
        title={title}
        steps={wizardSteps}
        initial={null}
        saveLabel="Done"
        onSave={onClose}
        closeOnSave
        dockWithPreview
        guard={{
          isDirty: () => dirty.anyDirty,
          save: dirty.saveDirty,
          discard: dirty.discardDirty,
        }}
        className="max-w-4xl"
      />
    </dirty.Provider>
  )
}
