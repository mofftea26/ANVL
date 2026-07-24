import { useMemo, type Dispatch, type SetStateAction } from 'react'
import { mediaAssetPublicUrl } from '@/features/admin/media/mediaAssets.service'
import type { CmsMediaAsset } from '@/features/admin/media/mediaAssets.types'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { CareSelector } from '@/features/admin/components/CareSelector'
import { MaterialsField } from '@/features/admin/components/MaterialsField'
import { PASSPORT_COUNTRIES } from '@/features/passport/lib/passportCountries'
import type { PassportProductContent } from '@/features/cms/passportContent/passportContent.zod'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui'
import { HotspotPlacer } from './HotspotPlacer'

export type PassportPatch = <K extends keyof PassportProductContent>(
  key: K,
  value: Partial<PassportProductContent[K]>,
) => void

export interface PassportStepProps {
  draft: PassportProductContent
  patch: PassportPatch
  setDraft: Dispatch<SetStateAction<PassportProductContent>>
  mediaAssets: CmsMediaAsset[]
}

/** Drop blank lines so empty textarea rows never render as empty bullets. */
function lines(value: string): string[] {
  return value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

export function IdentityStep({ draft, patch }: PassportStepProps) {
  return (
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
  )
}

export function PieceStep({ draft, patch, mediaAssets }: PassportStepProps) {
  return (
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
  )
}

export function MaterialStep({ draft, patch, mediaAssets }: PassportStepProps) {
  return (
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
      <FormField
        label="Composition"
        hint="Structured fabric cards (same editor as products). Blank → the title/note above, then product data."
        labelStyle="stacked"
      >
        <MaterialsField
          materials={draft.material.materials}
          onChange={(materials) => patch('material', { materials })}
          assets={mediaAssets}
        />
      </FormField>
    </>
  )
}

const SPEC_FIELDS: Array<{
  key: keyof PassportProductContent['specs']
  label: string
  hint?: string
}> = [
  { key: 'construction', label: 'Construction' },
  { key: 'fitType', label: 'Fit type', hint: "Blank → the product's fit." },
  { key: 'compression', label: 'Compression' },
  { key: 'stretch', label: 'Stretch' },
  { key: 'breathability', label: 'Breathability' },
  { key: 'intendedUse', label: 'Intended use' },
]

export function SpecsStep({ draft, patch }: PassportStepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SPEC_FIELDS.map((field) => (
        <FormField key={field.key} label={field.label} hint={field.hint} labelStyle="stacked">
          <Input
            density="compact"
            value={draft.specs[field.key]}
            onChange={(e) => patch('specs', { [field.key]: e.target.value })}
          />
        </FormField>
      ))}
    </div>
  )
}

export function CareStep({ draft, patch, mediaAssets }: PassportStepProps) {
  return (
    <>
      <FormField label="Intro" labelStyle="stacked">
        <Textarea
          rows={2}
          value={draft.care.intro}
          onChange={(e) => patch('care', { intro: e.target.value })}
        />
      </FormField>
      <FormField
        label="Care instructions"
        hint="The real textile care symbols (same editor as products) — pick each instruction and see its mark."
        labelStyle="stacked"
      >
        <CareSelector
          items={draft.care.careItems}
          onChange={(careItems) => patch('care', { careItems })}
        />
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
  )
}

export function FitStep({ draft, patch }: PassportStepProps) {
  return (
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
  )
}

export function HotspotsStep({ draft, setDraft, mediaAssets }: PassportStepProps) {
  // The hero render is the canvas hotspots are pinned to.
  const heroRenderUrl = useMemo(() => {
    const id = draft.piece.heroRender.trim()
    if (!id) return null
    const asset = mediaAssets.find((a) => a.id === id)
    return asset ? mediaAssetPublicUrl(asset) : null
  }, [draft.piece.heroRender, mediaAssets])

  return (
    <HotspotPlacer
      imageUrl={heroRenderUrl}
      hotspots={draft.hotspots}
      onChange={(hotspots) => setDraft((prev) => ({ ...prev, hotspots }))}
    />
  )
}

export function ForgeNotesStep({ draft, setDraft }: PassportStepProps) {
  return (
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
  )
}

export function DetailsStep({ draft, patch, mediaAssets }: PassportStepProps) {
  return (
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
  )
}

export function OriginStep({ draft, patch, mediaAssets }: PassportStepProps) {
  return (
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
