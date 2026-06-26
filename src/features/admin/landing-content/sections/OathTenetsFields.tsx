import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Control, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { useFieldArray, useWatch } from 'react-hook-form'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { MediaLibraryPickerModal } from '@/features/admin/media/MediaLibraryPickerModal'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'
import { createBlankTenetFormValues, type OathContentFormValues } from '../landingContentForm'
import { ContentSection } from './ContentSection'

const d = OATH_DEFAULT_CONTENT.tenets

type PendingTenetAction =
  | { type: 'clear'; index: number }
  | { type: 'remove'; index: number }

export function OathTenetsFields({
  register,
  control,
  setValue,
}: {
  register: UseFormRegister<OathContentFormValues>
  control: Control<OathContentFormValues>
  setValue: UseFormSetValue<OathContentFormValues>
}) {
  const tenetArray = useFieldArray({ control, name: 'tenets.items' })
  const watchedItems = useWatch({ control, name: 'tenets.items' })
  const mediaQuery = useMediaAssetsQuery()
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingTenetAction | null>(null)

  const mediaById = useMemo(() => {
    const map = new Map<string, string>()
    for (const asset of mediaQuery.data ?? []) {
      map.set(asset.id, asset.filename)
    }
    return map
  }, [mediaQuery.data])

  const confirmClear = pendingAction?.type === 'clear'
  const confirmRemove = pendingAction?.type === 'remove'
  const pendingIndex = pendingAction?.index ?? 0

  const handleConfirmAction = () => {
    if (!pendingAction) return
    if (pendingAction.type === 'clear') {
      setValue(`tenets.items.${pendingAction.index}.mediaId`, '', {
        shouldDirty: true,
      })
    } else {
      tenetArray.remove(pendingAction.index)
    }
    setPendingAction(null)
  }

  return (
    <ContentSection
      title="Product Characteristics"
      hint="The traits showcased one-by-one in the pinned horizontal panorama. Add, remove, or reorder; assign each product image here (not in Assets)."
    >
      <AdminFormField label="Eyebrow" htmlFor="oath-tenets-eyebrow" className="sm:col-span-2">
        <AdminInput id="oath-tenets-eyebrow" placeholder={d.eyebrow} {...register('tenets.eyebrow')} />
      </AdminFormField>

      {tenetArray.fields.map((field, i) => {
        const placeholder = d.items[i] ?? d.items[d.items.length - 1]
        const mediaId = watchedItems?.[i]?.mediaId?.trim() ?? ''
        const mediaLabel = mediaId ? mediaById.get(mediaId) ?? 'Assigned media' : 'No image assigned'

        return (
          <fieldset
            key={field.id}
            className="rounded-lg border border-[var(--color-line)] p-4 sm:col-span-2"
          >
            <legend className="anvl-display px-1 text-[10px] tracking-[0.28em] text-[var(--color-highlight-bright)]">
              Trait {String(i + 1).padStart(2, '0')}
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <AdminFormField label="Title" htmlFor={`oath-tenet-${i}-title`}>
                <AdminInput
                  id={`oath-tenet-${i}-title`}
                  placeholder={placeholder?.title ?? 'Title'}
                  {...register(`tenets.items.${i}.title` as const)}
                />
              </AdminFormField>
              <AdminFormField label="Line" htmlFor={`oath-tenet-${i}-line`}>
                <AdminInput
                  id={`oath-tenet-${i}-line`}
                  placeholder={placeholder?.line ?? 'Line'}
                  {...register(`tenets.items.${i}.line` as const)}
                />
              </AdminFormField>
              <AdminFormField label="Marker" htmlFor={`oath-tenet-${i}-marker`}>
                <AdminInput
                  id={`oath-tenet-${i}-marker`}
                  placeholder={placeholder?.marker ?? 'Marker'}
                  {...register(`tenets.items.${i}.marker` as const)}
                />
              </AdminFormField>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] focus-ring"
                onClick={() => setPickerIndex(i)}
              >
                <ImagePlus size={14} aria-hidden="true" />
                {mediaLabel}
              </button>
              {mediaId ? (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-ring"
                  onClick={() => setPendingAction({ type: 'clear', index: i })}
                >
                  Clear image
                </button>
              ) : null}
              {tenetArray.fields.length > 1 ? (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs text-[var(--color-danger)] focus-ring"
                  onClick={() => setPendingAction({ type: 'remove', index: i })}
                  aria-label={`Remove characteristic ${i + 1}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Remove
                </button>
              ) : null}
            </div>
          </fieldset>
        )
      })}

      {tenetArray.fields.length < 12 ? (
        <div className="sm:col-span-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-[var(--color-line)] px-4 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text)] focus-ring"
            onClick={() => tenetArray.append(createBlankTenetFormValues())}
          >
            <Plus size={16} aria-hidden="true" />
            Add characteristic
          </button>
        </div>
      ) : null}

      {pickerIndex !== null ? (
        <MediaLibraryPickerModal
          open
          onClose={() => setPickerIndex(null)}
          kind="image"
          allowClear
          title="Choose characteristic image"
          selectedMediaId={watchedItems?.[pickerIndex]?.mediaId?.trim() ?? null}
          onSelect={(pick) => {
            setValue(`tenets.items.${pickerIndex}.mediaId`, pick?.id ?? '', {
              shouldDirty: true,
            })
            setPickerIndex(null)
          }}
        />
      ) : null}

      <AdminConfirmDialog
        open={confirmClear}
        onClose={() => setPendingAction(null)}
        title="Clear characteristic image?"
        confirmLabel="Clear image"
        confirmVariant="destructive"
        onConfirm={handleConfirmAction}
      >
        Remove the assigned image from characteristic {String(pendingIndex + 1).padStart(2, '0')}?
        The storefront will show the duotone placeholder until you assign a new image.
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={confirmRemove}
        onClose={() => setPendingAction(null)}
        title="Remove characteristic?"
        confirmLabel="Remove characteristic"
        confirmVariant="destructive"
        onConfirm={handleConfirmAction}
      >
        Delete characteristic {String(pendingIndex + 1).padStart(2, '0')} from the panorama? Save
        content to publish the change to the storefront.
      </AdminConfirmDialog>
    </ContentSection>
  )
}
