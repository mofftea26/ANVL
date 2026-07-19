import { ChevronDown, ChevronUp, ImagePlus, Menu, Plus, Trash2 } from '@/shared/icons'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import { useMemo, useState } from 'react'
import type { Control, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { useFieldArray, useWatch } from 'react-hook-form'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { HotspotPositionField } from '@/features/admin/components/HotspotPositionField'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { MediaLibraryPickerModal } from '@/features/admin/media/MediaLibraryPickerModal'
import { mediaAssetPublicUrl } from '@/features/admin/media/mediaAssets.service'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import type { CmsMediaAsset } from '@/features/admin/media/mediaAssets.types'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'
import { createBlankTenetFormValues, type OathContentFormValues } from '../landingContentForm'
import { ContentSection } from './ContentSection'
import { ICON_SIZE } from '@/shared/lib/iconSize'

const d = OATH_DEFAULT_CONTENT.tenets

type PickTarget =
  | { item: number; field: 'mediaId' | 'modelId' | 'bgId' }
  | { item: number; field: 'bubble'; hotspot: number }

/** Effective marker percent: form override → code default → center. */
function markerPercent(raw: string | undefined, fallback: number | undefined): number {
  const t = raw?.trim() ?? ''
  const n = Number(t)
  if (t.length > 0 && Number.isFinite(n)) return Math.min(100, Math.max(0, n))
  return fallback ?? 50
}

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
  /** Which hotspot the next image click positions (one selection at a time). */
  const [activeSpot, setActiveSpot] = useState<{ item: number; hotspot: number } | null>(
    null,
  )
  const sortable = useSortableList({
    length: products.fields.length,
    onMove: products.move,
  })

  const mediaById = useMemo(() => {
    const map = new Map<string, CmsMediaAsset>()
    for (const asset of mediaQuery.data ?? []) map.set(asset.id, asset)
    return map
  }, [mediaQuery.data])

  const label = (id: string | undefined, empty: string) =>
    id?.trim() ? mediaById.get(id)?.filename ?? 'Assigned' : empty

  /** Preview URL for an assigned media id (same assets the pickers show). */
  const assetUrl = (id: string | undefined): string | null => {
    const asset = id?.trim() ? mediaById.get(id.trim()) : undefined
    return asset ? mediaAssetPublicUrl(asset) : null
  }

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
      previewTarget={{ kind: 'content-field', id: 'the-oath:tenets' }}
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
          <fieldset
            key={field.id}
            {...sortable.getItemProps(i)}
            className="rounded-lg border border-[var(--color-line)] p-4 transition-shadow data-[drag-over]:shadow-[0_0_0_2px_var(--color-accent)] sm:col-span-2"
          >
            <legend className="anvl-display inline-flex items-center gap-2 px-1 text-[10px] tracking-[0.28em] text-[var(--color-highlight-bright)]">
              <span
                {...sortable.getHandleProps(i)}
                title="Drag to reorder"
                className="inline-flex cursor-grab items-center text-[var(--color-text-muted)] active:cursor-grabbing"
              >
                <Menu size={ICON_SIZE.sm} aria-hidden="true" />
              </span>
              Product {String(i + 1).padStart(2, '0')}
              <span className="inline-flex gap-0.5">
                <button
                  type="button"
                  aria-label={`Move product ${i + 1} up`}
                  disabled={i === 0}
                  onClick={() => sortable.moveUp(i)}
                  className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                >
                  <ChevronUp size={ICON_SIZE.xs} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move product ${i + 1} down`}
                  disabled={i === products.fields.length - 1}
                  onClick={() => sortable.moveDown(i)}
                  className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                >
                  <ChevronDown size={ICON_SIZE.xs} aria-hidden="true" />
                </button>
              </span>
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
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Click the still image to move the selected point — or type exact % values
              below.
            </p>
            <HotspotPositionField
              className="mt-3"
              imageUrl={assetUrl(item?.mediaId)}
              markers={hotspots.map((hs, h) => {
                const hsDef = def?.hotspots?.[h]
                return {
                  x: markerPercent(hs?.x, hsDef?.x),
                  y: markerPercent(hs?.y, hsDef?.y),
                  label: hs?.label?.trim() || hsDef?.label,
                }
              })}
              selectedIndex={activeSpot?.item === i ? activeSpot.hotspot : null}
              onSelectMarker={(h) => setActiveSpot({ item: i, hotspot: h })}
              onPlace={(x, y) => {
                const h = activeSpot?.item === i ? activeSpot.hotspot : 0
                if (activeSpot?.item !== i) setActiveSpot({ item: i, hotspot: h })
                setValue(`tenets.items.${i}.hotspots.${h}.x` as const, String(x), {
                  shouldDirty: true,
                })
                setValue(`tenets.items.${i}.hotspots.${h}.y` as const, String(y), {
                  shouldDirty: true,
                })
              }}
              emptyHint="Assign a still image above to place points by clicking; the % inputs below still work."
            />
            <div className="mt-3 space-y-4">
              {hotspots.map((_, h) => {
                const hsDef = def?.hotspots?.[h]
                const isActive = activeSpot?.item === i && activeSpot.hotspot === h
                const selectSpot = () => setActiveSpot({ item: i, hotspot: h })
                return (
                  <div
                    key={h}
                    className={
                      isActive
                        ? 'grid gap-3 rounded-lg border border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-line))] p-3 sm:grid-cols-2'
                        : 'grid gap-3 rounded-lg border border-[var(--color-line)] p-3 sm:grid-cols-2'
                    }
                  >
                    <FormField label={`Point ${h + 1} label`} htmlFor={`oath-p-${i}-h-${h}-label`} labelStyle="stacked">
                      <Input id={`oath-p-${i}-h-${h}-label`} placeholder={hsDef?.label} {...register(`tenets.items.${i}.hotspots.${h}.label` as const)} onFocus={selectSpot} density="compact" />
                    </FormField>
                    <FormField label="Description" htmlFor={`oath-p-${i}-h-${h}-desc`} labelStyle="stacked">
                      <Input id={`oath-p-${i}-h-${h}-desc`} placeholder={hsDef?.description} {...register(`tenets.items.${i}.hotspots.${h}.description` as const)} onFocus={selectSpot} density="compact" />
                    </FormField>
                    <FormField label="X (%)" htmlFor={`oath-p-${i}-h-${h}-x`} labelStyle="stacked">
                      <Input id={`oath-p-${i}-h-${h}-x`} inputMode="numeric" placeholder={hsDef ? String(hsDef.x) : '50'} {...register(`tenets.items.${i}.hotspots.${h}.x` as const)} onFocus={selectSpot} density="compact" />
                    </FormField>
                    <FormField label="Y (%)" htmlFor={`oath-p-${i}-h-${h}-y`} labelStyle="stacked">
                      <Input id={`oath-p-${i}-h-${h}-y`} inputMode="numeric" placeholder={hsDef ? String(hsDef.y) : '50'} {...register(`tenets.items.${i}.hotspots.${h}.y` as const)} onFocus={selectSpot} density="compact" />
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
