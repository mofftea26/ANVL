import type { Dispatch, SetStateAction } from 'react'
import type { CmsMediaAsset } from '@/features/admin/media/mediaAssets.types'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { CareSelector } from '@/features/admin/components/CareSelector'
import { MaterialsField } from '@/features/admin/components/MaterialsField'
import {
  SectionListField,
  type EditableSection,
} from '@/features/admin/components/SectionListField'
import { PASSPORT_COUNTRIES } from '@/features/passport/lib/passportCountries'
import type { PassportProductContent } from '@/features/cms/passportContent/passportContent.zod'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui'
import { HotspotPlacer } from './HotspotPlacer'
import { useHeroRenderUrl } from './useHeroRenderUrl'
import { CareStepsField, StringRowsField } from './passportListFields'

export type PassportPatch = <K extends keyof PassportProductContent>(
  key: K,
  value: Partial<PassportProductContent[K]>,
) => void

export interface PassportStepProps {
  draft: PassportProductContent
  patch: PassportPatch
  setDraft: Dispatch<SetStateAction<PassportProductContent>>
  mediaAssets: CmsMediaAsset[]
  /** Selected product slug — reseeds order-less list editors on product change. */
  productSlug?: string
  /**
   * Switch the editor to another tab by key. Every marker placer needs it: a
   * blank hero render blocks placement, and the fix lives on the Piece tab, so
   * the blocker carries the jump instead of describing where to go.
   */
  onGoToTab?: (key: string) => void
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
        label="Steps"
        hint="Each step with an optional “why” note (revealed when a customer expands it). Blank list → PDP care / product care instructions."
        labelStyle="stacked"
      >
        <CareStepsField
          steps={draft.care.steps}
          notes={draft.care.notes}
          onChange={({ steps, notes }) => patch('care', { steps, notes })}
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

export function HotspotsStep({
  draft,
  setDraft,
  mediaAssets,
  onGoToTab,
}: PassportStepProps) {
  const heroRenderUrl = useHeroRenderUrl(draft, mediaAssets)

  return (
    <HotspotPlacer
      imageUrl={heroRenderUrl}
      hotspots={draft.hotspots}
      onChange={(hotspots) => setDraft((prev) => ({ ...prev, hotspots }))}
      onGoToPiece={onGoToTab ? () => onGoToTab('piece') : undefined}
    />
  )
}

export function ForgeNotesStep({ draft, setDraft }: PassportStepProps) {
  // Reuse the shared heading+body list editor: title → heading, body → body.
  const sections: EditableSection[] = draft.forgeNotes.map((n, i) => ({
    id: `forge-note-${i}`,
    heading: n.title,
    body: n.body,
  }))
  return (
    <FormField
      label="Forge notes"
      hint="Development facts shown as expandable cards — a title and a note each."
      labelStyle="stacked"
    >
      <SectionListField
        sections={sections}
        onChange={(next) =>
          setDraft((prev) => ({
            ...prev,
            forgeNotes: next.map((s) => ({ title: s.heading, body: s.body })),
          }))
        }
        addLabel="Add forge note"
        headingPlaceholder="Title (e.g. Eleven revisions)"
        bodyPlaceholder="The note (e.g. The collar alone took four)."
        idPrefix="forge-note"
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
      <FormField label="Facts" hint="Blank list → product design details." labelStyle="stacked">
        <StringRowsField
          values={draft.details.facts}
          onChange={(facts) => patch('details', { facts })}
          label="Fact"
          addLabel="Add fact"
          placeholder="A design fact"
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
