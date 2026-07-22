import { useState } from 'react'
import { toast } from 'sonner'

import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import type { CmsMediaAsset } from '@/features/admin/media/mediaAssets.types'
import { generateBatch } from '@/features/admin/passports/passports.service'
import {
  readPassportContentFromStorage,
  savePassportContentAsync,
} from '@/features/cms/passportContent/passportContent.settings'
import {
  DEFAULT_PASSPORT_PRODUCT_CONTENT,
  type PassportProductContent,
} from '@/features/cms/passportContent/passportContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'

import { SetupSaveRow, SetupStepBody } from './SetupStepParts'
import { usePassportContentCount } from './useSetupStatus'
import { setupPreviewBinding, useSetupBlobStep } from './useSetupBlobStep'

export interface SetupProductStepProps {
  /** Selected product slug — shared across the hosting wizard's steps. */
  slug: string
  onSlugChange: (slug: string) => void
  onNavigate: () => void
}

/** Compact product picker bound to the wizard-shared selection. */
export function SetupProductSelect({
  slug,
  onSlugChange,
}: Pick<SetupProductStepProps, 'slug' | 'onSlugChange'>) {
  const productsQuery = useAdminProductCatalogQuery()
  const products = productsQuery.data?.items ?? []
  return (
    <AdminFieldSelect
      label="Product"
      value={slug}
      onChange={onSlugChange}
      placeholder={
        productsQuery.isLoading ? 'Loading products…' : 'Select a product…'
      }
      options={products.map((p) => ({ value: p.slug, label: p.name }))}
    />
  )
}

/**
 * Passport content essentials for one product — identity tagline, authenticity
 * note, and the hero render that drives the particle forge. Edits the same
 * `passport_content[slug]` blob the full passport wizard writes (deep-merged so
 * sections authored there are untouched). Shared by the Products and Passports
 * setup wizards.
 */
export function PassportEssentialsStep({ slug, onSlugChange, onNavigate }: SetupProductStepProps) {
  const count = usePassportContentCount()
  const mediaQuery = useMediaAssetsQuery()

  return (
    <SetupStepBody
      intro="The passport is the page a customer sees when they scan their garment's QR. Author the essentials here — tagline, authenticity note, and the transparent hero render that forms the ember silhouette. The full wizard covers every section."
      status={{
        state: count > 0 ? 'done' : 'todo',
        label:
          count > 0
            ? `${count} product passport${count === 1 ? '' : 's'} authored`
            : 'No passport content authored yet',
      }}
      links={[
        {
          label: 'Fine-tune all sections in Passport content',
          to: '/admin/passports',
          search: { tab: 'content' },
        },
      ]}
      onNavigate={onNavigate}
    >
      <SetupProductSelect slug={slug} onSlugChange={onSlugChange} />
      {slug ? (
        <PassportEssentialsForm
          key={slug}
          slug={slug}
          mediaAssets={mediaQuery.data ?? []}
        />
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          Pick a product to author its passport essentials.
        </p>
      )}
    </SetupStepBody>
  )
}

function PassportEssentialsForm({
  slug,
  mediaAssets,
}: {
  slug: string
  mediaAssets: CmsMediaAsset[]
}) {
  const editor = useSetupBlobStep<PassportProductContent>({
    read: () =>
      readPassportContentFromStorage()[slug] ??
      structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT),
    save: (content) =>
      savePassportContentAsync({
        ...readPassportContentFromStorage(),
        [slug]: content,
      }),
    successMessage: 'Passport content saved.',
    errorFallbackMessage: 'Could not save passport content.',
    // Unsaved edits → live preview: whole passport_content blob with this
    // slug's entry replaced (binding closes over the slug).
    preview: setupPreviewBinding('passportContent', (content: PassportProductContent) => ({
      ...readPassportContentFromStorage(),
      [slug]: content,
    })),
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Identity tagline" labelStyle="stacked" hint="Short line under the product name on the identity plate.">
          <Input
            density="compact"
            value={editor.value.identity.tagline}
            onChange={(e) =>
              editor.patch((prev) => ({
                ...prev,
                identity: { ...prev.identity, tagline: e.target.value },
              }))
            }
          />
        </FormField>
        <FormField label="Authenticity note" labelStyle="stacked" hint='Replaces the default "Verified authentic" line.'>
          <Input
            density="compact"
            value={editor.value.identity.authenticityNote}
            onChange={(e) =>
              editor.patch((prev) => ({
                ...prev,
                identity: { ...prev.identity, authenticityNote: e.target.value },
              }))
            }
          />
        </FormField>
      </div>
      <MediaLibrarySlotField
        label="Hero render (transparent PNG)"
        hint="One front view on a transparent background — the ember particle silhouette samples these exact pixels."
        mediaId={editor.value.piece.heroRender}
        onMediaIdChange={(mediaId) =>
          editor.patch((prev) => ({
            ...prev,
            piece: { ...prev.piece, heroRender: mediaId },
          }))
        }
        kind="image"
        assets={mediaAssets}
      />
      <SetupSaveRow
        onSave={editor.save}
        saving={editor.saving}
        saved={editor.saved}
        dirty={editor.dirty}
        label="Save passport essentials"
      />
    </div>
  )
}

/**
 * Generate a per-unit QR passport batch inline — the same
 * `passports.service.generateBatch` write the QR-codes ledger uses. Requires a
 * live admin Supabase session; failures surface as error toasts.
 */
export function QrBatchStep({ slug, onSlugChange, onNavigate }: SetupProductStepProps) {
  const productsQuery = useAdminProductCatalogQuery()
  const products = productsQuery.data?.items ?? []
  const [quantity, setQuantity] = useState('50')
  const [generating, setGenerating] = useState(false)
  const [lastBatch, setLastBatch] = useState<{
    productName: string
    from: number
    to: number
  } | null>(null)

  const generate = async () => {
    const product = products.find((p) => p.slug === slug)
    const qty = Number.parseInt(quantity, 10)
    if (!product) {
      toast.error('Pick a product first.')
      return
    }
    if (!Number.isFinite(qty) || qty < 1 || qty > 500) {
      toast.error('Quantity must be between 1 and 500.')
      return
    }
    setGenerating(true)
    try {
      const res = await generateBatch({
        productSlug: product.slug,
        productName: product.name,
        quantity: qty,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setLastBatch({ productName: product.name, from: res.data.from, to: res.data.to })
      toast.success(
        `Generated ${qty} passport${qty === 1 ? '' : 's'} — serials ${res.data.from}–${res.data.to}.`,
      )
    } finally {
      setGenerating(false)
    }
  }

  return (
    <SetupStepBody
      intro="Generate a batch of per-unit QR passports — one token per physical garment. Serials continue from the product's current maximum; the claimed/unclaimed ledger lives in Supabase."
      status={{
        state: lastBatch ? 'done' : 'info',
        label: lastBatch
          ? `Generated serials ${lastBatch.from}–${lastBatch.to} for ${lastBatch.productName}`
          : 'Batches write to the Supabase ledger',
      }}
      links={[
        {
          label: 'Ledger, unassign & print in QR codes',
          to: '/admin/passports',
          search: { tab: 'codes' },
        },
      ]}
      onNavigate={onNavigate}
    >
      <div className="grid gap-4 md:grid-cols-[1fr_8rem]">
        <SetupProductSelect slug={slug} onSlugChange={onSlugChange} />
        <FormField label="Quantity" labelStyle="stacked">
          <Input
            density="compact"
            type="number"
            min={1}
            max={500}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </FormField>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="sm"
          density="compact"
          loading={generating}
          disabled={!slug || generating}
          onClick={() => void generate()}
        >
          Generate batch
        </Button>
        {lastBatch ? (
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Print the sheet from the QR codes ledger.
          </span>
        ) : null}
      </div>
    </SetupStepBody>
  )
}
