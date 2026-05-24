import { Plus, Trash2 } from 'lucide-react'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'
import {
  emptyCampaign,
  emptyLookbookItem,
} from './siteHome.service'
import type { SiteHomeExtrasContent } from './siteHome.types'

export type SiteHomeExtrasEditorProps = {
  value: SiteHomeExtrasContent
  onChange: (next: SiteHomeExtrasContent) => void
}

export function SiteHomeExtrasEditor({ value, onChange }: SiteHomeExtrasEditorProps) {
  const patchCampaign = (index: number, patch: Partial<(typeof value.campaigns)[number]>) => {
    onChange({
      ...value,
      campaigns: value.campaigns.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    })
  }

  const patchLookbook = (index: number, patch: Partial<(typeof value.lookbook)[number]>) => {
    onChange({
      ...value,
      lookbook: value.lookbook.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    })
  }

  return (
    <div className="space-y-6" data-testid="site-home-extras-editor">
      <AdminCard title="Campaign cards">
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">
          Optional homepage cards shown below landing acts when at least one row is saved.
        </p>
        <div className="space-y-4">
          {value.campaigns.map((campaign, index) => (
            <div
              key={campaign.id}
              className="grid gap-3 rounded-xl border border-[var(--color-line)]/80 p-4 md:grid-cols-[1fr_1fr_auto]"
            >
              <AdminFormField label="Title">
                <AdminInput
                  value={campaign.title}
                  onChange={(e) => patchCampaign(index, { title: e.target.value })}
                />
              </AdminFormField>
              <AdminFormField label="Description">
                <AdminTextarea
                  className="min-h-[56px]"
                  value={campaign.description}
                  onChange={(e) => patchCampaign(index, { description: e.target.value })}
                />
              </AdminFormField>
              <AdminButton
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Remove campaign"
                onClick={() =>
                  onChange({
                    ...value,
                    campaigns: value.campaigns.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 size={14} aria-hidden="true" />
              </AdminButton>
            </div>
          ))}
        </div>
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() =>
            onChange({ ...value, campaigns: [...value.campaigns, emptyCampaign()] })
          }
        >
          <Plus size={14} className="mr-1" aria-hidden="true" />
          Add campaign
        </AdminButton>
      </AdminCard>

      <AdminCard title="Lookbook strip">
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">
          Horizontal lookbook tiles for the homepage when at least one image is set.
        </p>
        <div className="space-y-4">
          {value.lookbook.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-xl border border-[var(--color-line)]/80 p-4 md:grid-cols-[1fr_auto]"
            >
              <div className="space-y-3">
                <MediaPickerField
                  label={`Lookbook image ${index + 1}`}
                  kind="image"
                  value={item.src}
                  onChange={(next) => patchLookbook(index, { src: next })}
                  fallback="none"
                />
                <AdminFormField label="Alt text">
                  <AdminInput
                    value={item.alt}
                    onChange={(e) => patchLookbook(index, { alt: e.target.value })}
                  />
                </AdminFormField>
              </div>
              <AdminButton
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Remove lookbook item"
                onClick={() =>
                  onChange({
                    ...value,
                    lookbook: value.lookbook.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 size={14} aria-hidden="true" />
              </AdminButton>
            </div>
          ))}
        </div>
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() =>
            onChange({ ...value, lookbook: [...value.lookbook, emptyLookbookItem()] })
          }
        >
          <Plus size={14} className="mr-1" aria-hidden="true" />
          Add lookbook tile
        </AdminButton>
      </AdminCard>
    </div>
  )
}
