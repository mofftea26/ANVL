import { SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'
import { usePassportContentCount, usePdpContentCount } from '../useSetupStatus'

interface StepProps {
  onNavigate: () => void
}

/** Step 1 — where the product catalog comes from (informational). */
function CatalogSourceStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="Commerce data (names, prices, variants, stock) comes from the configured commerce adapter — Shopify when the VITE_SHOPIFY_* env vars are set, otherwise the seed/local catalog. The CMS never edits commerce data; it layers editorial content on top of it. The shop's layout, cards, and copy live in the Shop Experience editor."
      status={{ state: 'info', label: 'Catalog source is environment-driven, not CMS-edited' }}
      links={[{ label: 'Open Shop Experience', to: '/admin/shop' }]}
      onNavigate={onNavigate}
    />
  )
}

/** Step 2 — author per-product PDP editorial content. */
function PdpContentStep({ onNavigate }: StepProps) {
  const count = usePdpContentCount()
  return (
    <SetupStepBody
      intro="Pick a product and author its detail-page editorial content — bento story, material, care, details, and per-product imagery. Products without authored content render the designed defaults."
      status={{
        state: count > 0 ? 'done' : 'todo',
        label:
          count > 0
            ? `${count} product${count === 1 ? '' : 's'} authored`
            : 'No PDP content authored yet',
      }}
      links={[{ label: 'Open Products', to: '/admin/products' }]}
      onNavigate={onNavigate}
    />
  )
}

/** Step 3 — author per-product passport sections. */
function PassportContentStep({ onNavigate }: StepProps) {
  const count = usePassportContentCount()
  return (
    <SetupStepBody
      intro="Each product's passport (the page a QR scan opens) has its own editorial sections — identity, piece, material, care, details, origin — authored in the passport content wizard."
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

/** Step 4 — generate the per-unit QR passports. */
function QrPassportsStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="Generate per-unit QR passport batches for a product, track the claimed/unclaimed ledger, and print the QR sheet for production. The ledger lives in Supabase, so open the editor to see live counts."
      status={{ state: 'info', label: 'Per-unit ledger lives in Supabase' }}
      links={[{ label: 'Open QR codes', to: '/admin/passports', search: { tab: 'codes' } }]}
      onNavigate={onNavigate}
    />
  )
}

/** Products — catalog source, PDP content, passport content, QR units. */
export function ProductsSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="Products setup"
      steps={[
        {
          key: 'catalog',
          title: 'Catalog',
          blurb: 'Where product data comes from.',
          render: () => <CatalogSourceStep onNavigate={onClose} />,
        },
        {
          key: 'pdp',
          title: 'PDP content',
          blurb: 'Per-product detail-page editorial.',
          render: () => <PdpContentStep onNavigate={onClose} />,
        },
        {
          key: 'passport-content',
          title: 'Passport content',
          blurb: 'The sections a scanned QR passport shows.',
          render: () => <PassportContentStep onNavigate={onClose} />,
        },
        {
          key: 'qr',
          title: 'QR passports',
          blurb: 'Per-unit batches, ledger, and print sheet.',
          render: () => <QrPassportsStep onNavigate={onClose} />,
        },
      ]}
    />
  )
}
