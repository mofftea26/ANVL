import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Control, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { useFieldArray, useWatch } from 'react-hook-form'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { MediaLibraryPickerModal } from '@/features/admin/media/MediaLibraryPickerModal'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'
import { createBlankTenetFormValues, type OathContentFormValues } from '../landingContentForm'
import { ContentSection } from './ContentSection'
import { ICON_SIZE } from '@/shared/lib/iconSize'

const d = OATH_DEFAULT_CONTENT.tenets

type PickTarget =
  | { item: number; field: 'mediaId' | 'modelId' | 'bgId' }
  | { item: number; field: 'bubble'; hotspot: number }

export function OathTenetsFields({
  register,
  control,
  setValue,
}: {
  register: UseFormRegister<OathContentFormValues>
  control: Control<OathContentFormValues>
  setValue: UseFormSetValue<OathContentFormValues>
}) {
  const products = useFieldArray({ control, name: 'tenets.items' })
  const watched = useWatch({ control, name: 'tenets.items' })
  const mediaQuery = useMediaAssetsQuery()
  const [pick, setPick] = useState<PickTarget | null>(null)
  const [removeIndex, setRemoveIndex] = useState<number | null>(null)

  const mediaById = useMemo(() => {
    const map = new Map<string, string>()
    for (const asset of mediaQuery.data ?? []) map.set(asset.id, asset.filename)
    return map
  }, [mediaQuery.data])

  const label = (id: string | undefined, empty: string) =>
    id?.trim() ? mediaById.get(id) ?? 'Assigned' : empty

  const pickerPath = (t: PickTarget) =>
    t.field === 'bubble'
      ? (`tenets.items.${t.item}.hotspots.${t.hotspot}.bubbleId` as const)
      : (`tenets.items.${t.item}.${t.field}` as const)

  const selectedId = (t: PickTarget): string =>
    (t.field === 'bubble'
      ? watched?.[t.item]?.hotspots?.[t.hotspot]?.bubbleId
      : watched?.[t.item]?.[t.field]
    )?.trim() ?? ''

  return (
    <ContentSection
      title="The Arsenal — Products"
      hint="One product per slide in the pinned horizontal showcase. Assign a 3D model (GLB), a smokey background, and annotated points; blank fields fall back to the designed defaults."
    >
      <FormField label="Eyebrow" htmlFor="oath-tenets-eyebrow" className="sm:col-span-2" labelStyle="stacked">
        <Input id="oath-tenets-eyebrow" placeholder={d.eyebrow} {...register('tenets.eyebrow')} density="compact" />
      </FormField>

      {products.fields.map((field, i) => {
        const def = d.items[i] ?? d.items[d.items.length - 1]
        const item = watched?.[i]
        const hotspots = item?.hotspots ?? []
        return (
          <fieldset key={field.id} className="rounded-lg border border-[var(--color-line)] p-4 sm:col-span-2">
            <legend className="anvl-display px-1 text-[10px] tracking-[0.28em] text-[var(--color-highlight-bright)]">
              Product {String(i + 1).padStart(2, '0')}
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Title" htmlFor={`oath-p-${i}-title`} labelStyle="stacked">
                <Input id={`oath-p-${i}-title`} placeholder={def?.title} {...register(`tenets.items.${i}.title` as const)} density="compact" />
              </FormField>
              <FormField label="Marker" htmlFor={`oath-p-${i}-marker`} labelStyle="stacked">
                <Input id={`oath-p-${i}-marker`} placeholder={def?.marker} {...register(`tenets.items.${i}.marker` as const)} density="compact" />
              </FormField>
              <FormField label="Subtitle (warrior line)" htmlFor={`oath-p-${i}-sub`} className="sm:col-span-2" labelStyle="stacked">
                <Input id={`oath-p-${i}-sub`} placeholder={def?.subtitle} {...register(`tenets.items.${i}.subtitle` as const)} density="compact" />
              </FormField>
            </div>

            {/* Media assignments. */}
            <div className="mt-4 flex flex-wrap gap-2">
              {([
                { field: 'modelId' as const, empty: 'No 3D model (GLB)' },
                { field: 'bgId' as const, empty: 'No background' },
                { field: 'mediaId' as const, empty: 'No still image' },
              ]).map(({ field, empty }) => (
                <button
                  key={field}
                  type="button"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] focus-ring"
                  onClick={() => setPick({ item: i, field })}
                >
                  <ImagePlus size={ICON_SIZE.sm} aria-hidden="true" />
                  {label(item?.[field], empty)}
                </button>
              ))}
            </div>

            {/* Hotspots. */}
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Points on the product (label, description, % position, bubble image)
            </p>
            <div className="mt-3 space-y-4">
              {hotspots.map((_, h) => {
                const hsDef = def?.hotspots?.[h]
                return (
                  <div key={h} className="grid gap-3 rounded-lg border border-[var(--color-line)] p-3 sm:grid-cols-2">
                    <FormField label={`Point ${h + 1} label`} htmlFor={`oath-p-${i}-h-${h}-label`} labelStyle="stacked">
                      <Input id={`oath-p-${i}-h-${h}-label`} placeholder={hsDef?.label} {...register(`tenets.items.${i}.hotspots.${h}.label` as const)} density="compact" />
                    </FormField>
                    <FormField label="Description" htmlFor={`oath-p-${i}-h-${h}-desc`} labelStyle="stacked">
                      <Input id={`oath-p-${i}-h-${h}-desc`} placeholder={hsDef?.description} {...register(`tenets.items.${i}.hotspots.${h}.description` as const)} density="compact" />
                    </FormField>
                    <FormField label="X (%)" htmlFor={`oath-p-${i}-h-${h}-x`} labelStyle="stacked">
                      <Input id={`oath-p-${i}-h-${h}-x`} inputMode="numeric" placeholder={hsDef ? String(hsDef.x) : '50'} {...register(`tenets.items.${i}.hotspots.${h}.x` as const)} density="compact" />
                    </FormField>
                    <FormField label="Y (%)" htmlFor={`oath-p-${i}-h-${h}-y`} labelStyle="stacked">
                      <Input id={`oath-p-${i}-h-${h}-y`} inputMode="numeric" placeholder={hsDef ? String(hsDef.y) : '50'} {...register(`tenets.items.${i}.hotspots.${h}.y` as const)} density="compact" />
                    </FormField>
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] focus-ring sm:col-span-2"
                      onClick={() => setPick({ item: i, field: 'bubble', hotspot: h })}
                    >
                      <ImagePlus size={ICON_SIZE.sm} aria-hidden="true" />
                      {label(hotspots[h]?.bubbleId, 'No bubble image')}
                    </button>
                  </div>
                )
              })}
            </div>

            {products.fields.length > 1 ? (
              <button
                type="button"
                className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs text-[var(--color-danger)] focus-ring"
                onClick={() => setRemoveIndex(i)}
                aria-label={`Remove product ${i + 1}`}
              >
                <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
                Remove product
              </button>
            ) : null}
          </fieldset>
        )
      })}

      {products.fields.length < 6 ? (
        <div className="sm:col-span-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-[var(--color-line)] px-4 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text)] focus-ring"
            onClick={() => products.append(createBlankTenetFormValues())}
          >
            <Plus size={ICON_SIZE.md} aria-hidden="true" />
            Add product
          </button>
        </div>
      ) : null}

      {pick ? (
        <MediaLibraryPickerModal
          open
          onClose={() => setPick(null)}
          kind={pick.field === 'modelId' ? 'model' : 'image'}
          allowClear
          title={pick.field === 'modelId' ? 'Choose product model (GLB)' : 'Choose image'}
          selectedMediaId={selectedId(pick) || null}
          onSelect={(picked) => {
            setValue(pickerPath(pick), picked?.id ?? '', { shouldDirty: true })
            setPick(null)
          }}
        />
      ) : null}

      <AdminConfirmDialog
        open={removeIndex !== null}
        onClose={() => setRemoveIndex(null)}
        title="Remove product?"
        confirmLabel="Remove product"
        confirmVariant="destructive"
        onConfirm={() => {
          if (removeIndex !== null) products.remove(removeIndex)
          setRemoveIndex(null)
        }}
      >
        Delete product {String((removeIndex ?? 0) + 1).padStart(2, '0')} from the showcase? Save
        content to publish the change.
      </AdminConfirmDialog>
    </ContentSection>
  )
}
