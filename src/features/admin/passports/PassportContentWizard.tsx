import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { mediaAssetPublicUrl } from '@/features/admin/media/mediaAssets.service'
import type { CmsMediaAsset } from '@/features/admin/media/mediaAssets.types'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { HotspotPlacer } from './HotspotPlacer'
import { CARE_SYMBOLS } from '@/features/passport/components/careSymbols'
import { PASSPORT_COUNTRIES } from '@/features/passport/lib/passportCountries'
import type { PassportProductContent } from '@/features/cms/passportContent/passportContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Textarea } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'

type WizardStepKey = keyof PassportProductContent

const STEPS: Array<{ key: WizardStepKey; title: string; blurb: string }> = [
  {
    key: 'identity',
    title: 'Identity',
    blurb: 'The plate — tagline under the product name and the authenticity note.',
  },
  {
    key: 'piece',
    title: 'The piece',
    blurb:
      'Hero render (transparent PNG — feeds the ember particle silhouette) and the gallery.',
  },
  {
    key: 'material',
    title: 'Material',
    blurb: 'Fabric story + macro shot. Blank falls back to PDP content / product data.',
  },
  {
    key: 'specs',
    title: 'Specifications',
    blurb: 'The technical panel — construction, fit type, compression, stretch, breathability, use.',
  },
  {
    key: 'care',
    title: 'Care ritual',
    blurb: 'Care symbols, numbered steps, and the "why" note behind each step.',
  },
  {
    key: 'fit',
    title: 'Fit & sizing',
    blurb:
      'Measurements, model fit, and the canonical size map that powers cross-product size advice.',
  },
  {
    key: 'hotspots',
    title: 'Design details',
    blurb: 'Click the render to pin markers customers can tap to explore the garment.',
  },
  {
    key: 'forgeNotes',
    title: 'Forge notes',
    blurb: 'Development fact cards — revisions, testing, hidden details.',
  },
  {
    key: 'details',
    title: 'Details & story',
    blurb: 'Design facts, the story, and one forge fact.',
  },
  { key: 'origin', title: 'Origin', blurb: 'Where and how this piece was forged.' },
]

/** Drop blank lines so empty textarea rows never render as empty bullets. */
function lines(value: string): string[] {
  return value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

/**
 * Multi-step passport content wizard — one step per passport section (the
 * same sections the storefront console/dossier render), each with its own
 * copy and assets. Edits a local draft; nothing persists until "Save".
 */
export function PassportContentWizard({
  open,
  onClose,
  productName,
  initial,
  mediaAssets,
  saving,
  onSave,
}: {
  open: boolean
  onClose: () => void
  productName: string
  initial: PassportProductContent
  mediaAssets: CmsMediaAsset[]
  saving: boolean
  onSave: (content: PassportProductContent) => void
}) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<PassportProductContent>(initial)

  // Re-seed when the wizard opens for a (possibly different) product.
  useEffect(() => {
    if (open) {
      setDraft(initial)
      setStep(0)
    }
  }, [open, initial])

  const patch = <K extends WizardStepKey>(
    key: K,
    value: Partial<PassportProductContent[K]>,
  ) => setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }))

  const active = STEPS[step]!
  const isLast = step === STEPS.length - 1

  // The hero render is the canvas hotspots are pinned to.
  const heroRenderUrl = useMemo(() => {
    const id = draft.piece.heroRender.trim()
    if (!id) return null
    const asset = mediaAssets.find((a) => a.id === id)
    return asset ? mediaAssetPublicUrl(asset) : null
  }, [draft.piece.heroRender, mediaAssets])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Passport content — ${productName}`}
      className="max-w-3xl"
    >
      <div className="flex flex-col gap-5">
        {/* Step rail */}
        <ol className="flex flex-wrap items-center gap-1.5" aria-label="Wizard steps">
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? 'step' : undefined}
                className={cn(
                  'focus-ring rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors',
                  i === step
                    ? 'border-[var(--color-highlight)] bg-[color-mix(in_oklab,var(--color-highlight)_16%,transparent)] text-[var(--color-heading)]'
                    : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                )}
              >
                {i + 1}. {s.title}
              </button>
            </li>
          ))}
        </ol>

        <p className="text-xs text-[var(--color-text-muted)]">{active.blurb}</p>

        {/* Step body */}
        <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {active.key === 'identity' ? (
            <>
              <FormField label="Tagline" hint="One line under the product name on the plate." labelStyle="stacked">
                <Input
                  density="compact"
                  value={draft.identity.tagline}
                  onChange={(e) => patch('identity', { tagline: e.target.value })}
                />
              </FormField>
              <FormField
                label="Authenticity note"
                hint="Blank → the standard one-owner-forever note."
                labelStyle="stacked"
              >
                <Textarea
                  rows={3}
                  value={draft.identity.authenticityNote}
                  onChange={(e) => patch('identity', { authenticityNote: e.target.value })}
                />
              </FormField>
            </>
          ) : null}

          {active.key === 'piece' ? (
            <>
              <MediaLibrarySlotField
                label="Hero render (transparent PNG)"
                kind="image"
                assets={mediaAssets}
                mediaId={draft.piece.heroRender}
                onMediaIdChange={(id) => patch('piece', { heroRender: id })}
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                The particle forge samples this render's silhouette — use a cut-out
                product PNG on a transparent background. Blank → the ANVL mark forms
                instead.
              </p>
              <GalleryPicker
                assets={mediaAssets}
                ids={draft.piece.gallery}
                onChange={(gallery) => patch('piece', { gallery })}
              />
            </>
          ) : null}

          {active.key === 'material' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Material title" hint="Blank → product fabric." labelStyle="stacked">
                  <Input
                    density="compact"
                    value={draft.material.title}
                    onChange={(e) => patch('material', { title: e.target.value })}
                  />
                </FormField>
                <FormField label="Material note" hint="Blank → product GSM." labelStyle="stacked">
                  <Input
                    density="compact"
                    value={draft.material.note}
                    onChange={(e) => patch('material', { note: e.target.value })}
                  />
                </FormField>
              </div>
              <MediaLibrarySlotField
                label="Fabric macro shot"
                kind="image"
                assets={mediaAssets}
                mediaId={draft.material.macroAsset}
                onMediaIdChange={(id) => patch('material', { macroAsset: id })}
              />
            </>
          ) : null}

          {active.key === 'specs' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Construction" labelStyle="stacked">
                <Input
                  density="compact"
                  value={draft.specs.construction}
                  onChange={(e) => patch('specs', { construction: e.target.value })}
                />
              </FormField>
              <FormField label="Fit type" hint="Blank → the product's fit." labelStyle="stacked">
                <Input
                  density="compact"
                  value={draft.specs.fitType}
                  onChange={(e) => patch('specs', { fitType: e.target.value })}
                />
              </FormField>
              <FormField label="Compression" labelStyle="stacked">
                <Input
                  density="compact"
                  value={draft.specs.compression}
                  onChange={(e) => patch('specs', { compression: e.target.value })}
                />
              </FormField>
              <FormField label="Stretch" labelStyle="stacked">
                <Input
                  density="compact"
                  value={draft.specs.stretch}
                  onChange={(e) => patch('specs', { stretch: e.target.value })}
                />
              </FormField>
              <FormField label="Breathability" labelStyle="stacked">
                <Input
                  density="compact"
                  value={draft.specs.breathability}
                  onChange={(e) => patch('specs', { breathability: e.target.value })}
                />
              </FormField>
              <FormField label="Intended use" labelStyle="stacked">
                <Input
                  density="compact"
                  value={draft.specs.intendedUse}
                  onChange={(e) => patch('specs', { intendedUse: e.target.value })}
                />
              </FormField>
            </div>
          ) : null}

          {active.key === 'care' ? (
            <>
              <FormField label="Intro" labelStyle="stacked">
                <Textarea
                  rows={2}
                  value={draft.care.intro}
                  onChange={(e) => patch('care', { intro: e.target.value })}
                />
              </FormField>
              <FormField
                label="Care symbols"
                hint="Tap to toggle — shown as icons the customer can tap for the meaning."
                labelStyle="stacked"
              >
                <div className="flex flex-wrap gap-1.5">
                  {CARE_SYMBOLS.map((symbol) => {
                    const on = draft.care.symbols.includes(symbol.key)
                    return (
                      <button
                        key={symbol.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          patch('care', {
                            symbols: on
                              ? draft.care.symbols.filter((s) => s !== symbol.key)
                              : [...draft.care.symbols, symbol.key],
                          })
                        }
                        className={cn(
                          'focus-ring rounded-md border px-2 py-1 text-[10px] transition-colors',
                          on
                            ? 'border-[var(--color-highlight)] bg-[color-mix(in_oklab,var(--color-highlight)_14%,transparent)] text-[var(--color-heading)]'
                            : 'border-[var(--color-line)] text-[var(--color-text-muted)]',
                        )}
                      >
                        {symbol.label}
                      </button>
                    )
                  })}
                </div>
              </FormField>
              <FormField
                label="Steps (one per line)"
                hint="Blank → PDP care / product care instructions."
                labelStyle="stacked"
              >
                <Textarea
                  rows={4}
                  value={draft.care.steps.join('\n')}
                  onChange={(e) => patch('care', { steps: lines(e.target.value) })}
                />
              </FormField>
              <FormField
                label="Step notes (one per line, aligned to the steps above)"
                hint="The “why” revealed when a customer expands that step. Leave a line blank to skip."
                labelStyle="stacked"
              >
                <Textarea
                  rows={4}
                  value={draft.care.notes.join('\n')}
                  onChange={(e) =>
                    patch('care', { notes: e.target.value.split('\n').map((l) => l.trim()) })
                  }
                />
              </FormField>
              <MediaLibrarySlotField
                label="Care illustration (optional)"
                kind="image"
                assets={mediaAssets}
                mediaId={draft.care.asset}
                onMediaIdChange={(id) => patch('care', { asset: id })}
              />
            </>
          ) : null}

          {active.key === 'fit' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Intended fit" labelStyle="stacked">
                  <Input
                    density="compact"
                    value={draft.fit.intendedFit}
                    onChange={(e) => patch('fit', { intendedFit: e.target.value })}
                  />
                </FormField>
                <FormField label="Stretch range" labelStyle="stacked">
                  <Input
                    density="compact"
                    value={draft.fit.stretchRange}
                    onChange={(e) => patch('fit', { stretchRange: e.target.value })}
                  />
                </FormField>
                <FormField label="Model height" labelStyle="stacked">
                  <Input
                    density="compact"
                    value={draft.fit.modelHeight}
                    onChange={(e) => patch('fit', { modelHeight: e.target.value })}
                  />
                </FormField>
                <FormField label="Size worn by the model" labelStyle="stacked">
                  <Input
                    density="compact"
                    value={draft.fit.modelSize}
                    onChange={(e) => patch('fit', { modelSize: e.target.value })}
                  />
                </FormField>
              </div>
              <FormField
                label="Measurements (one per line — Label|Value)"
                hint="e.g. Chest|52 cm"
                labelStyle="stacked"
              >
                <Textarea
                  rows={4}
                  value={draft.fit.measurements.join('\n')}
                  onChange={(e) => patch('fit', { measurements: lines(e.target.value) })}
                />
              </FormField>
              <FormField label="Sizing advice" labelStyle="stacked">
                <Textarea
                  rows={2}
                  value={draft.fit.sizeAdvice}
                  onChange={(e) => patch('fit', { sizeAdvice: e.target.value })}
                />
              </FormField>
              <FormField
                label="Size map (one per line — ThisSize|CanonicalSize)"
                hint="Powers cross-product size advice: map each of THIS product's sizes to a canonical body size (e.g. an oversized cut's M|S). Products sharing a canonical fit the same body. Leave blank to keep this product out of size advice entirely."
                labelStyle="stacked"
              >
                <Textarea
                  rows={4}
                  value={Object.entries(draft.fit.sizeEquivalence)
                    .map(([size, canonical]) => `${size}|${canonical}`)
                    .join('\n')}
                  onChange={(e) => {
                    const next: Record<string, string> = {}
                    for (const line of lines(e.target.value)) {
                      const [size, canonical] = line.split('|')
                      if (size?.trim() && canonical?.trim()) {
                        next[size.trim()] = canonical.trim()
                      }
                    }
                    patch('fit', { sizeEquivalence: next })
                  }}
                />
              </FormField>
            </>
          ) : null}

          {active.key === 'hotspots' ? (
            <HotspotPlacer
              imageUrl={heroRenderUrl}
              hotspots={draft.hotspots}
              onChange={(hotspots) => setDraft((prev) => ({ ...prev, hotspots }))}
            />
          ) : null}

          {active.key === 'forgeNotes' ? (
            <FormField
              label="Forge notes (one per line — Title|Body)"
              hint="Development facts shown as expandable cards, e.g. Eleven revisions|The collar alone took four."
              labelStyle="stacked"
            >
              <Textarea
                rows={6}
                value={draft.forgeNotes.map((n) => `${n.title}|${n.body}`).join('\n')}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    forgeNotes: lines(e.target.value).map((line) => {
                      const [title, ...rest] = line.split('|')
                      return { title: (title ?? '').trim(), body: rest.join('|').trim() }
                    }),
                  }))
                }
              />
            </FormField>
          ) : null}

          {active.key === 'details' ? (
            <>
              <FormField label="Heading" hint="Blank → “Forged details”." labelStyle="stacked">
                <Input
                  density="compact"
                  value={draft.details.heading}
                  onChange={(e) => patch('details', { heading: e.target.value })}
                />
              </FormField>
              <FormField label="Story" hint="Blank → PDP story / product storytelling." labelStyle="stacked">
                <Textarea
                  rows={3}
                  value={draft.details.story}
                  onChange={(e) => patch('details', { story: e.target.value })}
                />
              </FormField>
              <FormField label="Facts (one per line)" hint="Blank → product design details." labelStyle="stacked">
                <Textarea
                  rows={3}
                  value={draft.details.facts.join('\n')}
                  onChange={(e) => patch('details', { facts: lines(e.target.value) })}
                />
              </FormField>
              <FormField label="Forge fact" hint="One fun fact, shown as a highlighted plate." labelStyle="stacked">
                <Input
                  density="compact"
                  value={draft.details.funFact}
                  onChange={(e) => patch('details', { funFact: e.target.value })}
                />
              </FormField>
              <MediaLibrarySlotField
                label="Detail shot (optional)"
                kind="image"
                assets={mediaAssets}
                mediaId={draft.details.asset}
                onMediaIdChange={(id) => patch('details', { asset: id })}
              />
            </>
          ) : null}

          {active.key === 'origin' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminFieldSelect
                  label="Designed in"
                  value={draft.origin.designedIn}
                  onChange={(v) => patch('origin', { designedIn: v })}
                  options={PASSPORT_COUNTRIES.map((c) => ({ value: c.key, label: c.label }))}
                  placeholder="Pick a country…"
                  hint="Outline pin on the passport's world map."
                />
                <AdminFieldSelect
                  label="Made in"
                  value={draft.origin.madeIn}
                  onChange={(v) => patch('origin', { madeIn: v })}
                  options={PASSPORT_COUNTRIES.map((c) => ({ value: c.key, label: c.label }))}
                  placeholder="Pick a country…"
                  hint="Pulsing pin on the passport's world map."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Label" hint="Blank → “Forged in Lebanon”." labelStyle="stacked">
                  <Input
                    density="compact"
                    value={draft.origin.label}
                    onChange={(e) => patch('origin', { label: e.target.value })}
                  />
                </FormField>
                <FormField label="Place" hint="e.g. the atelier city." labelStyle="stacked">
                  <Input
                    density="compact"
                    value={draft.origin.place}
                    onChange={(e) => patch('origin', { place: e.target.value })}
                  />
                </FormField>
              </div>
              <FormField label="Origin story" labelStyle="stacked">
                <Textarea
                  rows={3}
                  value={draft.origin.story}
                  onChange={(e) => patch('origin', { story: e.target.value })}
                />
              </FormField>
              <MediaLibrarySlotField
                label="Atelier / map image (optional)"
                kind="image"
                assets={mediaAssets}
                mediaId={draft.origin.asset}
                onMediaIdChange={(id) => patch('origin', { asset: id })}
              />
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft size={13} aria-hidden="true" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              density="compact"
              loading={saving}
              onClick={() => onSave(draft)}
            >
              <Check size={13} aria-hidden="true" />
              Save passport
            </Button>
            {!isLast ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                density="compact"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              >
                Next
                <ArrowRight size={13} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/** Ordered gallery: pick assets one slot at a time, remove inline. */
function GalleryPicker({
  assets,
  ids,
  onChange,
}: {
  assets: CmsMediaAsset[]
  ids: string[]
  onChange: (ids: string[]) => void
}) {
  return (
    <div className="space-y-3">
      <p className="anvl-micro text-[var(--color-text-muted)]">Gallery</p>
      {ids.map((id, i) => (
        <div key={`${id}-${i}`} className="flex items-end gap-2">
          <div className="flex-1">
            <MediaLibrarySlotField
              label={`Image ${i + 1}`}
              kind="image"
              assets={assets}
              mediaId={id}
              onMediaIdChange={(next) => {
                const copy = [...ids]
                if (next) copy[i] = next
                else copy.splice(i, 1)
                onChange(copy)
              }}
            />
          </div>
        </div>
      ))}
      <MediaLibrarySlotField
        label="Add image"
        kind="image"
        assets={assets}
        mediaId=""
        onMediaIdChange={(next) => {
          if (next) onChange([...ids, next])
        }}
      />
    </div>
  )
}
