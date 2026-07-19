import { useState } from 'react'

import {
  PassportEssentialsStep,
  QrBatchStep,
} from '../SetupPassportSteps'
import { SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'

interface StepProps {
  onNavigate: () => void
}

/**
 * Step 3 — print the QR sheet. Deliberately link-only: the printable sheet is
 * a full-page surface (print CSS + the whole batch grid) that cannot run
 * inside a modal.
 */
function PrintStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="Print the QR sheet from the codes tab — a printable grid of the batch's codes, ready for garment tags. Serials are internal-only and never shown to customers."
      status={{ state: 'info', label: 'Print from the QR codes ledger' }}
      links={[{ label: 'Open QR codes to print', to: '/admin/passports', search: { tab: 'codes' } }]}
      onNavigate={onNavigate}
    />
  )
}

/** Passports — author content, mint QR batches, print the sheet. */
export function PassportsSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Product selection is shared between the content and batch steps.
  const [slug, setSlug] = useState('')

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
          render: () => (
            <PassportEssentialsStep slug={slug} onSlugChange={setSlug} onNavigate={onClose} />
          ),
        },
        {
          key: 'batches',
          title: 'QR batches',
          blurb: 'Per-unit token generation.',
          render: () => (
            <QrBatchStep slug={slug} onSlugChange={setSlug} onNavigate={onClose} />
          ),
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
