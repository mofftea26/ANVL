import { ChevronDown, ChevronUp, ImagePlus, Menu, Plus, Trash2 } from '@/shared/icons'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import { useMemo, useState } from 'react'
import type { Control, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { useFieldArray, useWatch } from 'react-hook-form'
import { Button } from '@/shared/components/ui/Button'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminPreviewLocateButton } from '@/features/admin/preview/AdminPreviewLocateButton'
import { setPreviewHover } from '@/features/admin/preview/adminPreviewStore'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { MediaLibraryPickerModal } from '@/features/admin/media/MediaLibraryPickerModal'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import {
  ABOUT_DEFAULT_CONTENT,
  ABOUT_ORB_FALLBACK_COLORS,
} from '@/features/about/content/aboutContent.defaults'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { ContentSection } from '@/features/admin/landing-content/sections/ContentSection'
import {
  createBlankOrbFormValues,
  createBlankPointFormValues,
  createBlankStatFormValues,
  type AboutContentFormValues,
} from '../aboutContentForm'

const d = ABOUT_DEFAULT_CONTENT.orbs
const MAX_ORBS = 10
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

/**
 * The orbs editor — each orb is one About section: an orbiting orb on the
 * desktop Forge Altar (struck open into a modal) and a stacked section on
 * mobile. Add, edit, remove: saving a different orb count hands the CMS
 * ownership of the list. Blank fields fall back to the designed defaults
 * (shown as placeholders); every orb renders whichever fields carry content.
 */
export function AboutOrbsFields({
  register,
  control,
  setValue,
}: {
  register: UseFormRegister<AboutContentFormValues>
  control: Control<AboutContentFormValues>
  setValue: UseFormSetValue<AboutContentFormValues>
}) {
  const orbs = useFieldArray({ control, name: 'orbs' })
  const watched = useWatch({ control, name: 'orbs' })
  const mediaQuery = useMediaAssetsQuery()
  const [pickIndex, setPickIndex] = useState<number | null>(null)
  const [removeIndex, setRemoveIndex] = useState<number | null>(null)
  const sortable = useSortableList({ length: orbs.fields.length, onMove: orbs.move })

  const mediaById = useMemo(() => {
    const map = new Map<string, string>()
    for (const asset of mediaQuery.data ?? []) map.set(asset.id, asset.filename)
    return map
  }, [mediaQuery.data])

  const mediaLabel = (id: string | undefined) =>
    id?.trim() ? (mediaById.get(id) ?? 'Assigned') : 'No section image'

  const swatchColor = (i: number): string => {
    const current = watched?.[i]?.color?.trim()
    if (current && HEX_COLOR.test(current)) return current
    return d[i]?.color ?? ABOUT_ORB_FALLBACK_COLORS[i % ABOUT_ORB_FALLBACK_COLORS.length]!
  }

  const addPoint = (i: number) => {
    setValue(`orbs.${i}.points`, [...(watched?.[i]?.points ?? []), createBlankPointFormValues()], {
      shouldDirty: true,
    })
  }
  const removePoint = (i: number, p: number) => {
    setValue(
      `orbs.${i}.points`,
      (watched?.[i]?.points ?? []).filter((_, idx) => idx !== p),
      { shouldDirty: true },
    )
  }
  const addStat = (i: number) => {
    setValue(`orbs.${i}.stats`, [...(watched?.[i]?.stats ?? []), createBlankStatFormValues()], {
      shouldDirty: true,
    })
  }
  const removeStat = (i: number, s: number) => {
    setValue(
      `orbs.${i}.stats`,
      (watched?.[i]?.stats ?? []).filter((_, idx) => idx !== s),
      { shouldDirty: true },
    )
  }

  return (
    <ContentSection
      title="The Orbs — Sections"
      hint="Each orb orbits the altar on desktop (struck open into its modal) and renders as a section on mobile. Fill only the fields a section needs; blank fields use the designed defaults shown as placeholders."
    >
      {orbs.fields.map((field, i) => {
        const def = d[i]
        const orb = watched?.[i]
        const points = orb?.points ?? []
        const stats = orb?.stats ?? []
        return (
          <fieldset
            key={field.id}
            {...sortable.getItemProps(i)}
            onMouseOver={(e) => {
              e.stopPropagation()
              setPreviewHover({ kind: 'content-field', id: `about:orb-${i + 1}` })
            }}
            onMouseLeave={() => setPreviewHover(null)}
            onFocusCapture={() =>
              setPreviewHover({ kind: 'content-field', id: `about:orb-${i + 1}` })
            }
            onBlurCapture={() => setPreviewHover(null)}
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
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: swatchColor(i) }}
              />
              Orb {String(i + 1).padStart(2, '0')}
              {def ? ` — ${def.label}` : ''}
              <AdminPreviewLocateButton
                target={{ kind: 'content-field', id: `about:orb-${i + 1}` }}
              />
              <span className="inline-flex gap-0.5">
                <button
                  type="button"
                  aria-label={`Move orb ${i + 1} up`}
                  disabled={i === 0}
                  onClick={() => sortable.moveUp(i)}
                  className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                >
                  <ChevronUp size={ICON_SIZE.xs} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move orb ${i + 1} down`}
                  disabled={i === orbs.fields.length - 1}
                  onClick={() => sortable.moveDown(i)}
                  className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                >
                  <ChevronDown size={ICON_SIZE.xs} aria-hidden="true" />
                </button>
              </span>
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Orb label" htmlFor={`about-orb-${i}-label`} labelStyle="stacked">
                <Input id={`about-orb-${i}-label`} placeholder={def?.label ?? `Orb ${i + 1}`} {...register(`orbs.${i}.label` as const)} density="compact" />
              </FormField>
              <FormField
                label="Orb color"
                htmlFor={`about-orb-${i}-color`}
                hint="#RRGGBB — tints the orb, its halo, the burst, and the section accent."
                labelStyle="stacked"
              >
                <div className="flex items-center gap-2">
                  <Input
                    id={`about-orb-${i}-color`}
                    placeholder={def?.color ?? '#E7E4DF'}
                    className="flex-1"
                    {...register(`orbs.${i}.color` as const)}
                    density="compact"
                  />
                  <span
                    aria-hidden="true"
                    className="mt-1 h-8 w-8 shrink-0 rounded-md border border-[var(--color-line)]"
                    style={{ backgroundColor: swatchColor(i) }}
                  />
                </div>
              </FormField>
              <FormField label="Eyebrow" htmlFor={`about-orb-${i}-eyebrow`} labelStyle="stacked">
                <Input id={`about-orb-${i}-eyebrow`} placeholder={def?.eyebrow} {...register(`orbs.${i}.eyebrow` as const)} density="compact" />
              </FormField>
              <FormField label="Title" htmlFor={`about-orb-${i}-title`} labelStyle="stacked">
                <Input id={`about-orb-${i}-title`} placeholder={def?.title} {...register(`orbs.${i}.title` as const)} density="compact" />
              </FormField>
              <FormField label="Body" htmlFor={`about-orb-${i}-body`} className="sm:col-span-2" labelStyle="stacked">
                <Textarea id={`about-orb-${i}-body`} rows={3} placeholder={def?.body} {...register(`orbs.${i}.body` as const)} density="compact" />
              </FormField>
              <FormField
                label="Detail line"
                htmlFor={`about-orb-${i}-detail`}
                hint="Short spec line (e.g. fabric weight, origin)."
                labelStyle="stacked"
              >
                <Input id={`about-orb-${i}-detail`} placeholder={def?.detail} {...register(`orbs.${i}.detail` as const)} density="compact" />
              </FormField>
              <FormField label="Tagline" htmlFor={`about-orb-${i}-tagline`} labelStyle="stacked">
                <Input id={`about-orb-${i}-tagline`} placeholder={def?.tagline} {...register(`orbs.${i}.tagline` as const)} density="compact" />
              </FormField>
              <FormField
                label="Big lines (one per row)"
                htmlFor={`about-orb-${i}-lines`}
                hint="Oversized stacked statements (e.g. the creed). Max 8."
                className="sm:col-span-2"
                labelStyle="stacked"
              >
                <Textarea
                  id={`about-orb-${i}-lines`}
                  rows={3}
                  placeholder={def?.lines.join('\n')}
                  {...register(`orbs.${i}.linesText` as const)}
                  density="compact"
                />
              </FormField>
              <FormField label="Primary CTA label" htmlFor={`about-orb-${i}-cta1-label`} labelStyle="stacked">
                <Input id={`about-orb-${i}-cta1-label`} placeholder={def?.primaryCta?.label} {...register(`orbs.${i}.primaryCtaLabel` as const)} density="compact" />
              </FormField>
              <FormField label="Primary CTA link" htmlFor={`about-orb-${i}-cta1-href`} labelStyle="stacked">
                <Input id={`about-orb-${i}-cta1-href`} placeholder={def?.primaryCta?.href ?? '/shop'} {...register(`orbs.${i}.primaryCtaHref` as const)} density="compact" />
              </FormField>
              <FormField label="Secondary CTA label" htmlFor={`about-orb-${i}-cta2-label`} labelStyle="stacked">
                <Input id={`about-orb-${i}-cta2-label`} placeholder={def?.secondaryCta?.label} {...register(`orbs.${i}.secondaryCtaLabel` as const)} density="compact" />
              </FormField>
              <FormField label="Secondary CTA link" htmlFor={`about-orb-${i}-cta2-href`} labelStyle="stacked">
                <Input id={`about-orb-${i}-cta2-href`} placeholder={def?.secondaryCta?.href ?? '/contact'} {...register(`orbs.${i}.secondaryCtaHref` as const)} density="compact" />
              </FormField>
            </div>

            {/* Section image. */}
            <div className="mt-4">
              <button
                type="button"
                className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]"
                onClick={() => setPickIndex(i)}
              >
                <ImagePlus size={ICON_SIZE.sm} aria-hidden="true" />
                {mediaLabel(orb?.mediaId)}
              </button>
            </div>

            {/* Callout points. */}
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Callout points (label + description)
            </p>
            <div className="mt-3 space-y-3">
              {points.map((_, p) => {
                const pDef = def?.points[p]
                return (
                  <div key={p} className="flex flex-wrap items-end gap-3">
                    <FormField label={`Point ${p + 1} label`} htmlFor={`about-orb-${i}-pt-${p}-label`} className="w-full sm:w-56" labelStyle="stacked">
                      <Input id={`about-orb-${i}-pt-${p}-label`} placeholder={pDef?.label} {...register(`orbs.${i}.points.${p}.label` as const)} density="compact" />
                    </FormField>
                    <FormField label="Description" htmlFor={`about-orb-${i}-pt-${p}-desc`} className="min-w-0 flex-1" labelStyle="stacked">
                      <Input id={`about-orb-${i}-pt-${p}-desc`} placeholder={pDef?.description} {...register(`orbs.${i}.points.${p}.description` as const)} density="compact" />
                    </FormField>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      density="compact"
                      onClick={() => removePoint(i, p)}
                      aria-label={`Remove point ${p + 1}`}
                    >
                      <Trash2 size={ICON_SIZE.sm} />
                      Remove
                    </Button>
                  </div>
                )
              })}
              {points.length < 6 ? (
                <Button type="button" variant="secondary" size="sm" density="compact" onClick={() => addPoint(i)}>
                  <Plus size={ICON_SIZE.sm} />
                  Add point
                </Button>
              ) : null}
            </div>

            {/* Stats. */}
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Stats (numeric values count up on reveal)
            </p>
            <div className="mt-3 space-y-3">
              {stats.map((_, st) => {
                const stDef = def?.stats[st]
                return (
                  <div key={st} className="flex flex-wrap items-end gap-3">
                    <FormField label="Label" htmlFor={`about-orb-${i}-st-${st}-label`} className="min-w-0 flex-1" labelStyle="stacked">
                      <Input id={`about-orb-${i}-st-${st}-label`} placeholder={stDef?.label ?? 'Stat label'} {...register(`orbs.${i}.stats.${st}.label` as const)} density="compact" />
                    </FormField>
                    <FormField label="Value" htmlFor={`about-orb-${i}-st-${st}-value`} className="w-28" labelStyle="stacked">
                      <Input id={`about-orb-${i}-st-${st}-value`} placeholder={stDef?.value ?? '100'} {...register(`orbs.${i}.stats.${st}.value` as const)} density="compact" />
                    </FormField>
                    <FormField label="Suffix" htmlFor={`about-orb-${i}-st-${st}-suffix`} className="w-20" labelStyle="stacked">
                      <Input id={`about-orb-${i}-st-${st}-suffix`} placeholder={stDef?.suffix || '%'} {...register(`orbs.${i}.stats.${st}.suffix` as const)} density="compact" />
                    </FormField>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      density="compact"
                      onClick={() => removeStat(i, st)}
                      aria-label={`Remove stat ${st + 1}`}
                    >
                      <Trash2 size={ICON_SIZE.sm} />
                      Remove
                    </Button>
                  </div>
                )
              })}
              {stats.length < 8 ? (
                <Button type="button" variant="secondary" size="sm" density="compact" onClick={() => addStat(i)}>
                  <Plus size={ICON_SIZE.sm} />
                  Add stat
                </Button>
              ) : null}
            </div>

            {orbs.fields.length > 1 ? (
              <button
                type="button"
                className="focus-ring mt-5 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs text-[var(--color-danger)]"
                onClick={() => setRemoveIndex(i)}
                aria-label={`Remove orb ${i + 1}`}
              >
                <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
                Remove orb
              </button>
            ) : null}
          </fieldset>
        )
      })}

      {orbs.fields.length < MAX_ORBS ? (
        <div className="sm:col-span-2">
          <button
            type="button"
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-[var(--color-line)] px-4 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
            onClick={() => orbs.append(createBlankOrbFormValues())}
          >
            <Plus size={ICON_SIZE.md} aria-hidden="true" />
            Add orb
          </button>
        </div>
      ) : null}

      {pickIndex !== null ? (
        <MediaLibraryPickerModal
          open
          onClose={() => setPickIndex(null)}
          kind="image"
          allowClear
          title="Choose section image"
          selectedMediaId={watched?.[pickIndex]?.mediaId?.trim() || null}
          onSelect={(picked) => {
            setValue(`orbs.${pickIndex}.mediaId`, picked?.id ?? '', { shouldDirty: true })
            setPickIndex(null)
          }}
        />
      ) : null}

      <AdminConfirmDialog
        open={removeIndex !== null}
        onClose={() => setRemoveIndex(null)}
        title="Remove orb?"
        confirmLabel="Remove orb"
        confirmVariant="destructive"
        onConfirm={() => {
          if (removeIndex !== null) orbs.remove(removeIndex)
          setRemoveIndex(null)
        }}
      >
        Delete orb {String((removeIndex ?? 0) + 1).padStart(2, '0')} from the About page? It
        disappears from the altar and the mobile sections. Save content to publish the change.
      </AdminConfirmDialog>
    </ContentSection>
  )
}
