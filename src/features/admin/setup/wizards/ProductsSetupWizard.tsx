import { useState } from 'react'

import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import {
  readPdpContentFromStorage,
  savePdpContentAsync,
} from '@/features/cms/pdpContent/pdpContent.settings'
import {
  DEFAULT_PDP_PRODUCT_CONTENT,
  type PdpProductContent,
} from '@/features/cms/pdpContent/pdpContent.zod'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { StringListField } from '@/features/admin/components/StringListField'
import {
  PassportEssentialsStep,
  QrBatchStep,
  SetupProductSelect,
  type SetupProductStepProps,
} from '../SetupPassportSteps'
import { SetupSaveRow, SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'
import { usePdpContentCount } from '../useSetupStatus'
import { setupPreviewBinding, useSetupBlobStep } from '../useSetupBlobStep'

/** Step 1 — pick the product the following steps author (shared selection). */
function ProductPickStep({ slug, onSlugChange, onNavigate }: SetupProductStepProps) {
  const productsQuery = useAdminProductCatalogQuery()
  const count = productsQuery.data?.items.length ?? 0

  return (
    <SetupStepBody
      intro="Commerce data (names, prices, variants, stock) comes from the configured commerce adapter — Shopify when connected, otherwise the seed catalog. Pick the product to author; the next steps layer editorial content on top of it."
      status={{
        state: 'info',
        label: productsQuery.isLoading
          ? 'Loading catalog…'
          : `${count} product${count === 1 ? '' : 's'} in the catalog`,
      }}
      links={[{ label: 'Shop layout & cards in Shop Experience', to: '/admin/shop' }]}
      onNavigate={onNavigate}
    >
      <SetupProductSelect slug={slug} onSlugChange={onSlugChange} />
    </SetupStepBody>
  )
}

/** Step 2 — the product's PDP editorial essentials, edited inline. */
function PdpContentStep({ slug, onSlugChange, onNavigate }: SetupProductStepProps) {
  const count = usePdpContentCount()

  return (
    <SetupStepBody
      intro="Author the product detail page's editorial essentials — story, material, and care. Blank fields fall back to the product's own data; the full editor adds design details and per-product imagery."
      status={{
        state: count > 0 ? 'done' : 'todo',
        label:
          count > 0
            ? `${count} product${count === 1 ? '' : 's'} authored`
            : 'No PDP content authored yet',
      }}
      links={[{ label: 'Fine-tune imagery & details in Products', to: '/admin/products' }]}
      onNavigate={onNavigate}
    >
      <SetupProductSelect slug={slug} onSlugChange={onSlugChange} />
      {slug ? (
        <PdpEssentialsForm key={slug} slug={slug} />
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          Pick a product to author its PDP content.
        </p>
      )}
    </SetupStepBody>
  )
}

function PdpEssentialsForm({ slug }: { slug: string }) {
  const editor = useSetupBlobStep<PdpProductContent>({
    read: () =>
      readPdpContentFromStorage()[slug] ?? { ...DEFAULT_PDP_PRODUCT_CONTENT },
    save: (content) =>
      savePdpContentAsync({
        ...readPdpContentFromStorage(),
        // Blank care rows are an editing artifact — drop them from the blob.
        [slug]: {
          ...content,
          care: content.care.map((line) => line.trim()).filter((line) => line.length > 0),
        },
      }),
    successMessage: 'PDP content saved.',
    errorFallbackMessage: 'Could not save PDP content.',
    // Unsaved edits → live preview: whole pdp_content blob with this slug's
    // entry replaced (binding closes over the slug; the hook tracks it).
    preview: setupPreviewBinding('pdpContent', (content: PdpProductContent) => ({
      ...readPdpContentFromStorage(),
      [slug]: content,
    })),
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Story heading" labelStyle="stacked">
          <Input
            density="compact"
            value={editor.value.storyHeading}
            onChange={(e) =>
              editor.patch((prev) => ({ ...prev, storyHeading: e.target.value }))
            }
          />
        </FormField>
        <FormField label="Material title" labelStyle="stacked">
          <Input
            density="compact"
            value={editor.value.materialTitle}
            onChange={(e) =>
              editor.patch((prev) => ({ ...prev, materialTitle: e.target.value }))
            }
          />
        </FormField>
      </div>
      <FormField label="Story body" labelStyle="stacked">
        <Textarea
          density="compact"
          rows={3}
          value={editor.value.storyBody}
          onChange={(e) =>
            editor.patch((prev) => ({ ...prev, storyBody: e.target.value }))
          }
        />
      </FormField>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Material note" labelStyle="stacked">
          <Textarea
            density="compact"
            rows={3}
            value={editor.value.materialNote}
            onChange={(e) =>
              editor.patch((prev) => ({ ...prev, materialNote: e.target.value }))
            }
          />
        </FormField>
        <FormField label="Care" labelStyle="stacked" hint="Add, edit, and reorder care instructions.">
          <StringListField
            items={editor.value.care}
            onChange={(care) => editor.patch((prev) => ({ ...prev, care }))}
            addLabel="Add care instruction"
            itemLabel="care instruction"
            placeholder="e.g. Machine wash cold"
          />
        </FormField>
      </div>
      <SetupSaveRow
        onSave={editor.save}
        saving={editor.saving}
        saved={editor.saved}
        dirty={editor.dirty}
        label="Save PDP content"
      />
    </div>
  )
}

/** Products — pick a product, author PDP + passport essentials, mint QR units. */
export function ProductsSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Product selection is shared across the wizard's steps.
  const [slug, setSlug] = useState('')

  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="Products setup"
      steps={[
        {
          key: 'catalog',
          title: 'Product',
          blurb: 'Where product data comes from — and which piece to author.',
          render: () => (
            <ProductPickStep slug={slug} onSlugChange={setSlug} onNavigate={onClose} />
          ),
        },
        {
          key: 'pdp',
          title: 'PDP content',
          blurb: 'Per-product detail-page editorial.',
          render: () => (
            <PdpContentStep slug={slug} onSlugChange={setSlug} onNavigate={onClose} />
          ),
        },
        {
          key: 'passport-content',
          title: 'Passport content',
          blurb: 'The sections a scanned QR passport shows.',
          render: () => (
            <PassportEssentialsStep slug={slug} onSlugChange={setSlug} onNavigate={onClose} />
          ),
        },
        {
          key: 'qr',
          title: 'QR passports',
          blurb: 'Per-unit batches for physical garments.',
          render: () => (
            <QrBatchStep slug={slug} onSlugChange={setSlug} onNavigate={onClose} />
          ),
        },
      ]}
    />
  )
}
