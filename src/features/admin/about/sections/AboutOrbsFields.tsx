import { ChevronDown, ChevronUp, Plus, Trash2 } from '@/shared/icons'
import { useState } from 'react'
import type { Control, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { useFieldArray, useWatch } from 'react-hook-form'
import { Button } from '@/shared/components/ui/Button'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { HotspotPositionField } from '@/features/admin/components/HotspotPositionField'
import { AdminPreviewLocateButton } from '@/features/admin/preview/AdminPreviewLocateButton'
import { setPreviewHover } from '@/features/admin/preview/adminPreviewStore'
import { previewFieldAnchorId } from '@/features/cms/preview'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import {
  ABOUT_DEFAULT_CONTENT,
  ABOUT_ORB_FALLBACK_COLORS,
} from '@/features/about/content/aboutContent.defaults'
import { ABOUT_WORLD_MAP_SRC } from '@/features/about/components/aboutWorldMap'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'
import { ContentSection } from '@/features/admin/landing-content/sections/ContentSection'
import {
  createBlankMapPinFormValues,
  createBlankOrbFormValues,
  createBlankPointFormValues,
  createBlankStatFormValues,
  createBlankTimelineFormValues,
  type AboutContentFormValues,
  type AboutOrbMapPinFormValues,
  type AboutOrbTimelineFormValues,
} from '../aboutContentForm'

const d = ABOUT_DEFAULT_CONTENT.orbs
const MAX_ORBS = 10
const MAX_PINS = 12
const MAX_MILESTONES = 12
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

/** The layout presets an orb can take ('' = classic, nothing stored). */
const LAYOUT_OPTIONS = [
  { value: '', label: 'Classic', hint: 'Free-form — renders whichever fields carry content.' },
  { value: 'text', label: 'Text', hint: 'Clean editorial: title, lead subhead, body, spec line.' },
  { value: 'stats', label: 'Stats', hint: 'Big forged numerals — the stats grid is the star.' },
  { value: 'map', label: 'Map', hint: 'World map with glowing pins in the orb color.' },
  { value: 'timeline', label: 'Timeline', hint: 'Vertical milestones down a hairline.' },
] as const

/** Effective pin percent for the placer markers: form value → centre. */
function pinPercent(raw: string | undefined): number {
  const t = raw?.trim() ?? ''
  const n = Number(t)
  if (t.length > 0 && Number.isFinite(n)) return Math.min(100, Math.max(0, n))
  return 50
}

/**
 * The orbs editor — each orb is one About section: an orbiting orb on the
 * desktop Forge Altar (struck open into a modal) and a stacked section on
 * mobile. Edited ONE ORB AT A TIME behind a sideways-scrolling chip row (the
 * Oath tenets pattern): RHF keeps the unrendered orbs' values because
 * shouldUnregister is off, so switching never loses unsaved edits. Each orb
 * carries a **layout preset**; the fieldset shows only that preset's fields.
 *
 * INSPECTOR-ANCHOR CONTRACT: the per-orb anchors (`pt-anchor-about-orb-N` via
 * `previewFieldAnchorId`) must stay findable for EVERY orb even though only
 * one fieldset renders. Each orb's anchor id therefore lives on its CHIP
 * button — always in the DOM, unique per orb — NOT on the fieldset. An
 * inspect-locate rings/focuses the chip; pressing it opens that orb's fields.
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
  const [removeIndex, setRemoveIndex] = useState<number | null>(null)
  /** One orb at a time — see the chip-row contract above. */
  const [selected, setSelected] = useState(0)
  /** Which map pin the next world-map click positions. */
  const [activePin, setActivePin] = useState<number | null>(null)
  const selectedIndex = Math.min(selected, Math.max(0, orbs.fields.length - 1))

  const selectOrb = (index: number) => {
    setSelected(index)
    setActivePin(null)
  }
  const moveOrb = (from: number, to: number) => {
    if (to < 0 || to >= orbs.fields.length) return
    orbs.move(from, to)
    selectOrb(to)
  }

  const swatchColor = (i: number): string => {
    const current = watched?.[i]?.color?.trim()
    if (current && HEX_COLOR.test(current)) return current
    return d[i]?.color ?? ABOUT_ORB_FALLBACK_COLORS[i % ABOUT_ORB_FALLBACK_COLORS.length]!
  }

  const orbChipLabel = (i: number): string => {
    const label = watched?.[i]?.label?.trim() || d[i]?.label || `New orb ${i + 1}`
    return `Orb ${String(i + 1).padStart(2, '0')} — ${label}`
  }

  /** '' = classic (no stored override). */
  const orbLayout = (i: number): string => watched?.[i]?.layout?.trim() ?? ''

  const hoverProps = (i: number) => ({
    onMouseOver: (e: React.MouseEvent) => {
      e.stopPropagation()
      setPreviewHover({ kind: 'content-field', id: `about:orb-${i + 1}` })
    },
    onMouseLeave: () => setPreviewHover(null),
    onFocusCapture: () => setPreviewHover({ kind: 'content-field', id: `about:orb-${i + 1}` }),
    onBlurCapture: () => setPreviewHover(null),
  })

  const addPoint = (i: number) => {
    setValue(
      `orbs.${i}.points`,
      [...(watched?.[i]?.points ?? []), createBlankPointFormValues()],
      { shouldDirty: true },
    )
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
  const addPin = (i: number, pin?: AboutOrbMapPinFormValues) => {
    const pins = watched?.[i]?.mapPins ?? []
    if (pins.length >= MAX_PINS) return
    setValue(`orbs.${i}.mapPins`, [...pins, pin ?? createBlankMapPinFormValues()], {
      shouldDirty: true,
    })
    setActivePin(pins.length)
  }
  const removePin = (i: number, p: number) => {
    setValue(
      `orbs.${i}.mapPins`,
      (watched?.[i]?.mapPins ?? []).filter((_, idx) => idx !== p),
      { shouldDirty: true },
    )
    setActivePin(null)
  }
  const addMilestone = (i: number) => {
    setValue(
      `orbs.${i}.timeline`,
      [...(watched?.[i]?.timeline ?? []), createBlankTimelineFormValues()],
      { shouldDirty: true },
    )
  }
  const removeMilestone = (i: number, m: number) => {
    setValue(
      `orbs.${i}.timeline`,
      (watched?.[i]?.timeline ?? []).filter((_, idx) => idx !== m),
      { shouldDirty: true },
    )
  }
  const moveMilestone = (i: number, from: number, to: number) => {
    const entries: AboutOrbTimelineFormValues[] = [...(watched?.[i]?.timeline ?? [])]
    if (to < 0 || to >= entries.length) return
    const [moved] = entries.splice(from, 1)
    entries.splice(to, 0, moved!)
    setValue(`orbs.${i}.timeline`, entries, { shouldDirty: true })
  }

  return (
    <ContentSection
      title="The Orbs — Sections"
      hint="Each orb orbits the altar on desktop (struck open into its modal) and renders as a section on mobile. Pick a layout preset per orb; blank fields use the designed defaults shown as placeholders."
    >
      {/* Orb picker — one orb at a time keeps the section usable. The chips
          also carry the inspector anchors + per-orb hover (contract above). */}
      <div className="sm:col-span-2">
        <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">Orb to edit</p>
        <div
          role="tablist"
          aria-label="About orbs"
          className="flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:thin]"
        >
          {orbs.fields.map((field, i) => {
            const active = i === selectedIndex
            return (
              <button
                key={field.id}
                type="button"
                role="tab"
                aria-selected={active}
                // Inspector anchor — ALWAYS in the DOM (unlike the fieldset).
                id={previewFieldAnchorId(`about:orb-${i + 1}`)}
                onClick={() => selectOrb(i)}
                {...hoverProps(i)}
                className={cn(
                  'focus-ring inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition-colors',
                  active
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-heading)]'
                    : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text)]',
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: swatchColor(i) }}
                />
                {orbChipLabel(i)}
              </button>
            )
          })}
        </div>
      </div>

      {orbs.fields.map((field, i) => {
        if (i !== selectedIndex) return null
        const def = d[i]
        const orb = watched?.[i]
        const layout = orbLayout(i)
        const classic = layout === ''
        const points = orb?.points ?? []
        const stats = orb?.stats ?? []
        const pins = orb?.mapPins ?? []
        const milestones = orb?.timeline ?? []
        return (
          <fieldset
            key={field.id}
            {...hoverProps(i)}
            className="rounded-lg border border-[var(--color-line)] p-4 sm:col-span-2"
          >
            <legend className="anvl-display inline-flex items-center gap-2 px-1 text-[10px] tracking-[0.28em] text-[var(--color-highlight-bright)]">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: swatchColor(i) }}
              />
              {orbChipLabel(i)}
              <AdminPreviewLocateButton
                target={{ kind: 'content-field', id: `about:orb-${i + 1}` }}
              />
              <span className="inline-flex gap-0.5">
                <button
                  type="button"
                  aria-label={`Move orb ${i + 1} up`}
                  disabled={i === 0}
                  onClick={() => moveOrb(i, i - 1)}
                  className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                >
                  <ChevronUp size={ICON_SIZE.xs} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move orb ${i + 1} down`}
                  disabled={i === orbs.fields.length - 1}
                  onClick={() => moveOrb(i, i + 1)}
                  className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                >
                  <ChevronDown size={ICON_SIZE.xs} aria-hidden="true" />
                </button>
              </span>
            </legend>

            {/* Layout preset picker — decides which fields show below. */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
                Layout preset
              </p>
              <div role="radiogroup" aria-label={`Orb ${i + 1} layout preset`} className="flex flex-wrap gap-2">
                {LAYOUT_OPTIONS.map((opt) => {
                  const active = layout === opt.value
                  return (
                    <button
                      key={opt.value || 'classic'}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      title={opt.hint}
                      onClick={() => setValue(`orbs.${i}.layout`, opt.value, { shouldDirty: true })}
                      className={cn(
                        'focus-ring rounded-full border px-3 py-1.5 text-xs transition-colors',
                        active
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-heading)]'
                          : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text)]',
                      )}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                {LAYOUT_OPTIONS.find((o) => o.value === layout)?.hint}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Identity — every preset. */}
              <FormField label="Orb label" htmlFor={`about-orb-${i}-label`} labelStyle="stacked">
                <Input id={`about-orb-${i}-label`} placeholder={def?.label ?? `New orb ${i + 1}`} {...register(`orbs.${i}.label` as const)} density="compact" />
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

              {(classic || layout === 'text' || layout === 'stats') ? (
                <FormField label="Eyebrow" htmlFor={`about-orb-${i}-eyebrow`} labelStyle="stacked">
                  <Input id={`about-orb-${i}-eyebrow`} placeholder={def?.eyebrow} {...register(`orbs.${i}.eyebrow` as const)} density="compact" />
                </FormField>
              ) : null}
              <FormField label="Title" htmlFor={`about-orb-${i}-title`} labelStyle="stacked">
                <Input id={`about-orb-${i}-title`} placeholder={def?.title ?? `New orb ${i + 1}`} {...register(`orbs.${i}.title` as const)} density="compact" />
              </FormField>
              {layout === 'text' ? (
                <FormField
                  label="Subhead"
                  htmlFor={`about-orb-${i}-subhead`}
                  hint="Editorial lead line under the title."
                  className="sm:col-span-2"
                  labelStyle="stacked"
                >
                  <Input id={`about-orb-${i}-subhead`} placeholder="A larger lead sentence." {...register(`orbs.${i}.subhead` as const)} density="compact" />
                </FormField>
              ) : null}
              <FormField label="Body" htmlFor={`about-orb-${i}-body`} className="sm:col-span-2" labelStyle="stacked">
                <Textarea id={`about-orb-${i}-body`} rows={3} placeholder={def?.body} {...register(`orbs.${i}.body` as const)} density="compact" />
              </FormField>
              {(classic || layout === 'text') ? (
                <FormField
                  label="Detail line"
                  htmlFor={`about-orb-${i}-detail`}
                  hint="Short spec line (e.g. fabric weight, origin)."
                  labelStyle="stacked"
                >
                  <Input id={`about-orb-${i}-detail`} placeholder={def?.detail} {...register(`orbs.${i}.detail` as const)} density="compact" />
                </FormField>
              ) : null}
              {classic ? (
                <>
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
                </>
              ) : null}
            </div>

            {/* Section image — every preset keeps the hero band. */}
            <div className="mt-4">
              <MediaLibrarySlotField
                label="Section image"
                hint="Hero band in the orb modal and the mobile section image."
                kind="image"
                mediaId={orb?.mediaId ?? ''}
                onMediaIdChange={(mediaId) =>
                  setValue(`orbs.${i}.mediaId`, mediaId, { shouldDirty: true })
                }
                assets={mediaQuery.data ?? []}
                previewTarget={{ kind: 'content-field', id: `about:orb-${i + 1}` }}
              />
            </div>

            {/* Callout points — classic only. */}
            {classic ? (
              <>
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
              </>
            ) : null}

            {/* Stats — classic + the stats preset. */}
            {(classic || layout === 'stats') ? (
              <>
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
              </>
            ) : null}

            {/* Map pins — the map preset's pin editor: click the world map to
                drop/move the selected pin, or type exact % values below. */}
            {layout === 'map' ? (
              <>
                <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Map pins (click the map to place the selected pin)
                </p>
                {pins.length === 0 ? (
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    No pins yet — the storefront hides the map until a pin exists. Click the map
                    or use “Add pin”.
                  </p>
                ) : null}
                <HotspotPositionField
                  className="mt-3 max-w-md"
                  imageUrl={ABOUT_WORLD_MAP_SRC}
                  markers={pins.map((pin) => ({
                    x: pinPercent(pin?.x),
                    y: pinPercent(pin?.y),
                    label: pin?.label?.trim() || undefined,
                  }))}
                  selectedIndex={activePin}
                  onSelectMarker={setActivePin}
                  onPlace={(x, y) => {
                    if (pins.length === 0) {
                      // First click on an empty map drops pin 1 right there.
                      addPin(i, { x: String(x), y: String(y), label: '' })
                      return
                    }
                    const p = activePin ?? 0
                    if (activePin === null) setActivePin(0)
                    setValue(`orbs.${i}.mapPins.${p}.x` as const, String(x), { shouldDirty: true })
                    setValue(`orbs.${i}.mapPins.${p}.y` as const, String(y), { shouldDirty: true })
                  }}
                />
                <div className="mt-3 space-y-3">
                  {pins.map((_, p) => {
                    const isActive = activePin === p
                    const selectPin = () => setActivePin(p)
                    return (
                      <div
                        key={p}
                        className={cn(
                          'flex flex-wrap items-end gap-3 rounded-lg border p-3',
                          isActive
                            ? 'border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-line))]'
                            : 'border-[var(--color-line)]',
                        )}
                      >
                        <FormField label={`Pin ${p + 1} label`} htmlFor={`about-orb-${i}-pin-${p}-label`} className="min-w-0 flex-1" labelStyle="stacked">
                          <Input id={`about-orb-${i}-pin-${p}-label`} placeholder="Beirut" {...register(`orbs.${i}.mapPins.${p}.label` as const)} onFocus={selectPin} density="compact" />
                        </FormField>
                        <FormField label="X (%)" htmlFor={`about-orb-${i}-pin-${p}-x`} className="w-24" labelStyle="stacked">
                          <Input id={`about-orb-${i}-pin-${p}-x`} inputMode="numeric" placeholder="50" {...register(`orbs.${i}.mapPins.${p}.x` as const)} onFocus={selectPin} density="compact" />
                        </FormField>
                        <FormField label="Y (%)" htmlFor={`about-orb-${i}-pin-${p}-y`} className="w-24" labelStyle="stacked">
                          <Input id={`about-orb-${i}-pin-${p}-y`} inputMode="numeric" placeholder="50" {...register(`orbs.${i}.mapPins.${p}.y` as const)} onFocus={selectPin} density="compact" />
                        </FormField>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          density="compact"
                          onClick={() => removePin(i, p)}
                          aria-label={`Remove pin ${p + 1}`}
                        >
                          <Trash2 size={ICON_SIZE.sm} />
                          Remove
                        </Button>
                      </div>
                    )
                  })}
                  {pins.length < MAX_PINS ? (
                    <Button type="button" variant="secondary" size="sm" density="compact" onClick={() => addPin(i)}>
                      <Plus size={ICON_SIZE.sm} />
                      Add pin
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}

            {/* Timeline milestones — the timeline preset's list editor. */}
            {layout === 'timeline' ? (
              <>
                <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Milestones (marker + title + body, in order)
                </p>
                <div className="mt-3 space-y-3">
                  {milestones.map((_, m) => (
                    <div key={m} className="rounded-lg border border-[var(--color-line)] p-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <FormField label={`Marker ${m + 1}`} htmlFor={`about-orb-${i}-tl-${m}-marker`} hint="A year or a tag." className="w-full sm:w-36" labelStyle="stacked">
                          <Input id={`about-orb-${i}-tl-${m}-marker`} placeholder="2026" {...register(`orbs.${i}.timeline.${m}.marker` as const)} density="compact" />
                        </FormField>
                        <FormField label="Title" htmlFor={`about-orb-${i}-tl-${m}-title`} className="min-w-0 flex-1" labelStyle="stacked">
                          <Input id={`about-orb-${i}-tl-${m}-title`} placeholder="Drop 01 — The Oath" {...register(`orbs.${i}.timeline.${m}.title` as const)} density="compact" />
                        </FormField>
                        <span className="inline-flex gap-0.5">
                          <button
                            type="button"
                            aria-label={`Move milestone ${m + 1} up`}
                            disabled={m === 0}
                            onClick={() => moveMilestone(i, m, m - 1)}
                            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                          >
                            <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move milestone ${m + 1} down`}
                            disabled={m === milestones.length - 1}
                            onClick={() => moveMilestone(i, m, m + 1)}
                            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                          >
                            <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
                          </button>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          density="compact"
                          onClick={() => removeMilestone(i, m)}
                          aria-label={`Remove milestone ${m + 1}`}
                        >
                          <Trash2 size={ICON_SIZE.sm} />
                          Remove
                        </Button>
                      </div>
                      <FormField label="Body" htmlFor={`about-orb-${i}-tl-${m}-body`} className="mt-3" labelStyle="stacked">
                        <Textarea id={`about-orb-${i}-tl-${m}-body`} rows={2} placeholder="What happened at this milestone." {...register(`orbs.${i}.timeline.${m}.body` as const)} density="compact" />
                      </FormField>
                    </div>
                  ))}
                  {milestones.length < MAX_MILESTONES ? (
                    <Button type="button" variant="secondary" size="sm" density="compact" onClick={() => addMilestone(i)}>
                      <Plus size={ICON_SIZE.sm} />
                      Add milestone
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}

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
            onClick={() => {
              orbs.append(createBlankOrbFormValues())
              selectOrb(orbs.fields.length)
            }}
          >
            <Plus size={ICON_SIZE.md} aria-hidden="true" />
            Add orb
          </button>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={removeIndex !== null}
        onClose={() => setRemoveIndex(null)}
        title="Remove orb?"
        confirmLabel="Remove orb"
        confirmVariant="destructive"
        onConfirm={() => {
          if (removeIndex !== null) {
            orbs.remove(removeIndex)
            selectOrb(Math.max(0, Math.min(removeIndex, orbs.fields.length - 2)))
          }
          setRemoveIndex(null)
        }}
      >
        Delete orb {String((removeIndex ?? 0) + 1).padStart(2, '0')} from the About page? It
        disappears from the altar and the mobile sections. Save content to publish the change.
      </AdminConfirmDialog>
    </ContentSection>
  )
}
