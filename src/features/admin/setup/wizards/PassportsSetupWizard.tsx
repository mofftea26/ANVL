import { SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'
import { usePassportContentCount } from '../useSetupStatus'

interface StepProps {
  onNavigate: () => void
}

/** Step 1 — per-product passport content. */
function ContentStep({ onNavigate }: StepProps) {
  const count = usePassportContentCount()
  return (
    <SetupStepBody
      intro="Author each product's passport sections — identity, piece, material, care, details, origin — in the multi-step passport content wizard. This is the page a customer sees when they scan their garment's QR."
      status={{
        state: count > 0 ? 'done' : 'todo',
        label:
          count > 0
            ? `${count} product passport${count === 1 ? '' : 's'} authored`
            : 'No passport content authored yet',
      }}
      links={[{ label: 'Open Passport content', to: '/admin/passports', search: { tab: 'content' } }]}
      onNavigate={onNavigate}
    />
  )
}

/** Step 2 — generate per-unit QR batches. */
function BatchStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="Generate a batch of per-unit QR passports for a product — one token per physical garment. The claimed/unclaimed ledger tracks every unit; unassigned units can be deleted."
      status={{ state: 'info', label: 'Per-unit ledger lives in Supabase — open for live counts' }}
      links={[{ label: 'Open QR codes', to: '/admin/passports', search: { tab: 'codes' } }]}
      onNavigate={onNavigate}
    />
  )
}

/** Step 3 — print the QR sheet. */
function PrintStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="Print the QR sheet from the codes tab — a printable grid of the batch's codes, ready for garment tags. Serials are internal-only and never shown to customers."
      status={{ state: 'info', label: 'Print from the QR codes ledger' }}
      links={[{ label: 'Open QR codes', to: '/admin/passports', search: { tab: 'codes' } }]}
      onNavigate={onNavigate}
    />
  )
}

/** Passports — content, QR batches, print sheet. */
export function PassportsSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="Passports setup"
      steps={[
        {
          key: 'content',
          title: 'Content',
          blurb: 'Per-product passport sections.',
          render: () => <ContentStep onNavigate={onClose} />,
        },
        {
          key: 'batches',
          title: 'QR batches',
          blurb: 'Per-unit token generation and ledger.',
          render: () => <BatchStep onNavigate={onClose} />,
        },
        {
          key: 'print',
          title: 'Print sheet',
          blurb: 'Printable QR grid for garment tags.',
          render: () => <PrintStep onNavigate={onClose} />,
        },
      ]}
    />
  )
}
