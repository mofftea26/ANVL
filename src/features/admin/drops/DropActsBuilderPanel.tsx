import { useCallback, useEffect, useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { DropActListRail } from '@/features/admin/drops/DropActListRail'
import { DropEditorLivePreview } from '@/features/admin/drops/DropEditorLivePreview'
import type { DropThemePalette } from '@/features/drops/theme/dropThemePalette.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { Product } from '@/features/products/types/product.types'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import type { LandingActSlot } from '@/features/admin/drops/drops.actSequence'
import { defaultLandingActSequence } from '@/features/admin/drops/drops.actSequence'
import type { ActMedia, LandingAct } from '@/features/admin/drops/acts/landingActs.types'
import { mergeActAnimationConfig } from '@/features/admin/drops/acts/landingActs.types'
import { safeParseActContent } from '@/features/admin/drops/acts/landingActs.zod'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import { AdminFieldLabel } from '@/features/admin/components/AdminFieldLabel'
import { AdminMicroHeading } from '@/features/admin/components/AdminMicroHeading'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from '@/features/admin/components/AdminSelect'
import { AdminDateTimeField } from '@/features/admin/components/AdminDateTimeField'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { AdminEditableList } from '@/features/admin/components/AdminEditableList'
import { AdminMediaField } from '@/features/admin/components/AdminMediaField'
import { cn } from '@/shared/lib/cn'
import { ACT_MOTION_TYPE_OPTIONS } from '@/features/marketing/act-presets/shared/actAnimationConfig'
import {
  ACT_PRESETS_BY_NATURE,
  getActPresetLabel,
} from '@/features/marketing/act-presets/registry'
import type { LandingActNature } from '@/features/marketing/act-presets/types'
import { isLayeredHeroPreset } from '@/features/marketing/act-presets/shared/actLayerMedia'

const NATURE_OPTIONS = [
  { value: 'hero', label: 'Hero' },
  { value: 'manifesto', label: 'Manifesto' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'dropReveal', label: 'Drop reveal' },
  { value: 'productShowcase', label: 'Product showcase' },
  { value: 'materialShowcase', label: 'Material showcase' },
  { value: 'specialEvent', label: 'Special event' },
  { value: 'finalCTA', label: 'Final CTA' },
] as const

const PRESETS = ACT_PRESETS_BY_NATURE

function slotKeyForNature(nature: string): LandingActSlot['key'] | null {
  switch (nature) {
    case 'hero':
      return 'hero'
    case 'manifesto':
    case 'storytelling':
      return 'manifesto'
    case 'dropReveal':
      return 'dropReveal'
    case 'productShowcase':
      return 'pieces'
    case 'materialShowcase':
      return 'materials'
    case 'finalCTA':
      return 'waitlist'
    default:
      return null
  }
}

function syncSequence(
  acts: LandingAct[],
  previous: LandingActSlot[],
): LandingActSlot[] {
  const base = defaultLandingActSequence()
  const prevByKey = new Map(previous.map((s) => [s.key, s.enabled]))
  return base.map((slot) => {
    const mapped = acts.some(
      (a) => a.isEnabled && slotKeyForNature(a.nature) === slot.key,
    )
    if (mapped) return { ...slot, enabled: true }
    const was = prevByKey.get(slot.key)
    return { ...slot, enabled: was !== false }
  })
}

/** Radix Select item value for “use schema default” (optional card layout fields). */
const INHERIT_VALUE = '__inherit__'

function readCta(
  c: Record<string, unknown>,
  key: string,
): { label: string; href: string } {
  const v = c[key]
  if (v && typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>
    return {
      label: typeof o.label === 'string' ? o.label : '',
      href: typeof o.href === 'string' ? o.href : '',
    }
  }
  return { label: '', href: '' }
}

function readStr(c: Record<string, unknown>, key: string): string {
  const v = c[key]
  return typeof v === 'string' ? v : ''
}

type CatalogProduct = { id: string; name: string }

function NatureContentFields({
  act,
  patchContent,
}: {
  act: LandingAct
  patchContent: (patch: Record<string, unknown>) => void
}) {
  const c = act.content ?? {}
  const nature = act.nature

  if (nature === 'hero') {
    const p = readCta(c, 'primaryCta')
    const s = readCta(c, 'secondaryCta')
    return (
      <div className="mt-3 grid gap-3 border-t border-[var(--color-line)]/60 pt-3 md:grid-cols-2">
        <AdminFieldLabel labelStyle="stacked" className="block md:col-span-2">
          Countdown target
          <AdminDateTimeField
            value={readStr(c, 'countdownTargetIso') || undefined}
            onChange={(next) =>
              patchContent({ countdownTargetIso: next || undefined })
            }
            clear
            placeholder="Select drop open date & time"
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Drop
          <AdminInput
            value={readStr(c, 'heroDrop')}
            onChange={(e) =>
              patchContent({ heroDrop: e.target.value || undefined })
            }
            placeholder="01"
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Pieces
          <AdminInput
            inputMode="numeric"
            value={readStr(c, 'heroPieces')}
            onChange={(e) =>
              patchContent({ heroPieces: e.target.value || undefined })
            }
            placeholder="3"
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block md:col-span-2">
          Status
          <AdminInput
            value={readStr(c, 'heroStatus') || 'Soon'}
            onChange={(e) =>
              patchContent({
                heroStatus: e.target.value.trim() || 'Soon',
              })
            }
            placeholder="Soon"
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Primary CTA label
          <AdminInput
                        value={p.label}
            onChange={(e) =>
              patchContent({
                primaryCta: { ...p, label: e.target.value },
              })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Primary CTA href
          <AdminInput
                        value={p.href}
            onChange={(e) =>
              patchContent({
                primaryCta: { ...p, href: e.target.value },
              })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Secondary CTA label
          <AdminInput
                        value={s.label}
            onChange={(e) =>
              patchContent({
                secondaryCta: { ...s, label: e.target.value },
              })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Secondary CTA href
          <AdminInput
                        value={s.href}
            onChange={(e) =>
              patchContent({
                secondaryCta: { ...s, href: e.target.value },
              })
            }
          />
        </AdminFieldLabel>
      </div>
    )
  }

  if (nature === 'manifesto') {
    type TenetRow = { id: string; label: string; body?: string }
    const tenets: TenetRow[] = Array.isArray(c.tenets)
      ? (c.tenets as TenetRow[])
      : []
    return (
      <div className="mt-3 space-y-3 border-t border-[var(--color-line)]/60 pt-3">
        <AdminFieldLabel labelStyle="stacked" className="block">
          Quote (optional)
          <AdminInput
            value={readStr(c, 'quote')}
            onChange={(e) => patchContent({ quote: e.target.value || undefined })}
          />
        </AdminFieldLabel>
        <AdminEditableList
          items={tenets}
          onChange={(next) => patchContent({ tenets: next.length ? next : undefined })}
          createItem={(): TenetRow => ({
            id: createCmsId('tenet'),
            label: 'New tenet',
            body: undefined,
          })}
          renderLabel={(t) => t.label || 'Untitled tenet'}
          addLabel="Add tenet"
          renderEditor={(item, onPatch) => (
            <div className="space-y-2">
              <AdminInput
                value={item.label}
                onChange={(e) => onPatch({ label: e.target.value })}
                placeholder="Tenet label"
              />
              <AdminInput
                value={item.body ?? ''}
                onChange={(e) => onPatch({ body: e.target.value || undefined })}
                placeholder="Optional detail"
              />
            </div>
          )}
        />
      </div>
    )
  }

  if (nature === 'storytelling') {
    const chapters = Array.isArray(c.chapters)
      ? (c.chapters as Array<{ id: string; title: string; body: string }>)
      : []
    return (
      <div className="mt-3 border-t border-[var(--color-line)]/60 pt-3">
        <AdminEditableList
          items={chapters}
          onChange={(next) => patchContent({ chapters: next.length ? next : undefined })}
          createItem={() => ({
            id: createCmsId('chapter'),
            title: 'Chapter',
            body: '',
          })}
          renderLabel={(ch) => ch.title || 'Untitled chapter'}
          addLabel="Add chapter"
          renderEditor={(item, onPatch) => (
            <div className="space-y-2">
              <AdminInput
                value={item.title}
                onChange={(e) => onPatch({ title: e.target.value })}
                placeholder="Chapter title"
              />
              <AdminTextarea
                className="min-h-[72px]"
                value={item.body}
                onChange={(e) => onPatch({ body: e.target.value })}
                placeholder="Chapter body"
              />
            </div>
          )}
        />
      </div>
    )
  }

  if (nature === 'dropReveal') {
    const p = readCta(c, 'primaryCta')
    const s = readCta(c, 'secondaryCta')
    return (
      <div className="mt-3 grid gap-3 border-t border-[var(--color-line)]/60 pt-3 md:grid-cols-2">
        <AdminFieldLabel labelStyle="stacked" className="block md:col-span-2">
          Release date (ISO)
          <AdminInput
                        value={readStr(c, 'releaseDateIso')}
            onChange={(e) =>
              patchContent({ releaseDateIso: e.target.value || undefined })
            }
          />
        </AdminFieldLabel>
        <div className="md:col-span-2">
          <MediaPickerField
            label="Drop visual"
            kind="any"
            hint="Image or video associated with the reveal."
            value={readStr(c, 'dropVisualSrc')}
            onChange={(next) =>
              patchContent({ dropVisualSrc: next || undefined })
            }
            fallback="crest"
          />
        </div>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Primary CTA label
          <AdminInput
                        value={p.label}
            onChange={(e) =>
              patchContent({ primaryCta: { ...p, label: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Primary CTA href
          <AdminInput
                        value={p.href}
            onChange={(e) =>
              patchContent({ primaryCta: { ...p, href: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Secondary CTA label
          <AdminInput
                        value={s.label}
            onChange={(e) =>
              patchContent({ secondaryCta: { ...s, label: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Secondary CTA href
          <AdminInput
                        value={s.href}
            onChange={(e) =>
              patchContent({ secondaryCta: { ...s, href: e.target.value } })
            }
          />
        </AdminFieldLabel>
      </div>
    )
  }

  if (nature === 'productShowcase') {
    const cardStyleRaw = readStr(c, 'cardStyle')
    const cardStyleValue =
      cardStyleRaw === 'carousel' ||
      cardStyleRaw === 'grid' ||
      cardStyleRaw === 'story'
        ? cardStyleRaw
        : INHERIT_VALUE
    return (
      <div className="mt-3 grid gap-3 border-t border-[var(--color-line)]/60 pt-3 md:grid-cols-2">
        <div className="text-xs text-[var(--color-text-muted)]">
          <span className="block" id={`act-${act.id}-card-style-label`}>
            Card style
          </span>
          <AdminSelect
            value={cardStyleValue}
            onValueChange={(v) => {
              patchContent({
                cardStyle:
                  v === INHERIT_VALUE
                    ? undefined
                    : (v as 'carousel' | 'grid' | 'story'),
              })
            }}
          >
            <AdminSelectTrigger
              id={`act-${act.id}-card-style`}
              aria-labelledby={`act-${act.id}-card-style-label`}
              className="mt-1"
            >
              <AdminSelectValue placeholder="Card style" />
            </AdminSelectTrigger>
            <AdminSelectContent>
              <AdminSelectItem value={INHERIT_VALUE}>Default</AdminSelectItem>
              <AdminSelectItem value="carousel">Carousel</AdminSelectItem>
              <AdminSelectItem value="grid">Grid</AdminSelectItem>
              <AdminSelectItem value="story">Story</AdminSelectItem>
            </AdminSelectContent>
          </AdminSelect>
        </div>
        <AdminFieldLabel labelStyle="stacked" className="block">
          View all label
          <AdminInput
                        value={readStr(c, 'viewAllLabel')}
            onChange={(e) =>
              patchContent({ viewAllLabel: e.target.value || undefined })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block md:col-span-2">
          View all href
          <AdminInput
                        value={readStr(c, 'viewAllHref')}
            onChange={(e) =>
              patchContent({ viewAllHref: e.target.value || undefined })
            }
          />
        </AdminFieldLabel>
      </div>
    )
  }

  if (nature === 'materialShowcase') {
    type MatRow = {
      id: string
      productId: string
      frontLabel?: string
      materialName?: string
      gsm?: string
      composition?: string
      characteristics: Array<{ id: string; label: string; body?: string; imageUrl?: string }>
    }
    const raw = Array.isArray(c.materialProducts) ? c.materialProducts : []
    const rows: MatRow[] = raw.map((row, i) => {
      const o = row as Record<string, unknown>
      const productId = typeof o.productId === 'string' ? o.productId : ''
      return {
        id: productId || `mat-${i}`,
        productId,
        frontLabel: typeof o.frontLabel === 'string' ? o.frontLabel : undefined,
        materialName: typeof o.materialName === 'string' ? o.materialName : undefined,
        gsm: typeof o.gsm === 'string' ? o.gsm : undefined,
        composition: typeof o.composition === 'string' ? o.composition : undefined,
        characteristics: Array.isArray(o.characteristics)
          ? (o.characteristics as MatRow['characteristics'])
          : [],
      }
    })
    return (
      <div className="mt-3 border-t border-[var(--color-line)]/60 pt-3">
        <AdminEditableList
          items={rows}
          onChange={(next) =>
            patchContent({
              materialProducts: next.map(
                ({
                  productId,
                  frontLabel,
                  materialName,
                  gsm,
                  composition,
                  characteristics,
                }) => ({
                  productId,
                  frontLabel,
                  materialName,
                  gsm,
                  composition,
                  characteristics,
                }),
              ),
            })
          }
          createItem={() => {
            const id = createCmsId('mat')
            return { id, productId: '', characteristics: [] }
          }}
          renderLabel={(r) => r.frontLabel || r.productId || 'Material card'}
          addLabel="Add product material"
          renderEditor={(item, onPatch) => (
            <div className="space-y-3">
              <AdminInput
                value={item.productId}
                onChange={(e) => onPatch({ productId: e.target.value })}
                placeholder="Product ID (from catalog)"
              />
              <AdminInput
                value={item.frontLabel ?? ''}
                onChange={(e) => onPatch({ frontLabel: e.target.value || undefined })}
                placeholder="Front label"
              />
              <AdminInput
                value={item.materialName ?? ''}
                onChange={(e) => onPatch({ materialName: e.target.value || undefined })}
                placeholder="Material name"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <AdminInput
                  value={item.gsm ?? ''}
                  onChange={(e) => onPatch({ gsm: e.target.value || undefined })}
                  placeholder="GSM"
                />
                <AdminInput
                  value={item.composition ?? ''}
                  onChange={(e) => onPatch({ composition: e.target.value || undefined })}
                  placeholder="Composition"
                />
              </div>
              <AdminEditableList<{ id: string; label: string; body?: string; imageUrl?: string }>
                items={item.characteristics}
                onChange={(chars) => onPatch({ characteristics: chars })}
                createItem={() => ({
                  id: createCmsId('char'),
                  label: 'Characteristic',
                })}
                renderLabel={(ch) => ch.label}
                addLabel="Add characteristic"
                maxItems={12}
                renderEditor={(ch, onChPatch) => (
                  <div className="space-y-2">
                    <AdminInput
                      value={ch.label}
                      onChange={(e) => onChPatch({ label: e.target.value })}
                    />
                    <AdminInput
                      value={ch.body ?? ''}
                      onChange={(e) => onChPatch({ body: e.target.value || undefined })}
                      placeholder="Description"
                    />
                    <AdminMediaField
                      label="Image"
                      value={ch.imageUrl ?? ''}
                      onChange={(url) => onChPatch({ imageUrl: url || undefined })}
                    />
                  </div>
                )}
              />
            </div>
          )}
        />
      </div>
    )
  }

  if (nature === 'specialEvent') {
    const ct = readCta(c, 'cta')
    return (
      <div className="mt-3 grid gap-3 border-t border-[var(--color-line)]/60 pt-3 md:grid-cols-2">
        <AdminFieldLabel labelStyle="stacked" className="block md:col-span-2">
          Event title
          <AdminInput
                        value={readStr(c, 'eventTitle')}
            onChange={(e) =>
              patchContent({ eventTitle: e.target.value || undefined })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Starts (ISO)
          <AdminInput
                        value={readStr(c, 'startsAtIso')}
            onChange={(e) =>
              patchContent({ startsAtIso: e.target.value || undefined })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Ends (ISO)
          <AdminInput
                        value={readStr(c, 'endsAtIso')}
            onChange={(e) =>
              patchContent({ endsAtIso: e.target.value || undefined })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block md:col-span-2">
          Location
          <AdminInput
                        value={readStr(c, 'location')}
            onChange={(e) =>
              patchContent({ location: e.target.value || undefined })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block md:col-span-2">
          Link href
          <AdminInput
                        value={readStr(c, 'linkHref')}
            onChange={(e) =>
              patchContent({ linkHref: e.target.value || undefined })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block md:col-span-2">
          Rules
          <AdminTextarea
            className="min-h-[56px]"
            value={readStr(c, 'rules')}
            onChange={(e) => patchContent({ rules: e.target.value || undefined })}
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          CTA label
          <AdminInput
                        value={ct.label}
            onChange={(e) =>
              patchContent({ cta: { ...ct, label: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          CTA href
          <AdminInput
                        value={ct.href}
            onChange={(e) =>
              patchContent({ cta: { ...ct, href: e.target.value } })
            }
          />
        </AdminFieldLabel>
      </div>
    )
  }

  if (nature === 'finalCTA') {
    const p = readCta(c, 'primaryCta')
    const s = readCta(c, 'secondaryCta')
    const t = readCta(c, 'tertiaryCta')
    return (
      <div className="mt-3 grid gap-3 border-t border-[var(--color-line)]/60 pt-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <MediaPickerField
            label="Background image"
            kind="image"
            hint="Optional backdrop behind the final CTA copy."
            value={readStr(c, 'backgroundImageUrl')}
            onChange={(next) =>
              patchContent({ backgroundImageUrl: next || undefined })
            }
            fallback="crest"
          />
        </div>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Primary CTA label
          <AdminInput
                        value={p.label}
            onChange={(e) =>
              patchContent({ primaryCta: { ...p, label: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Primary CTA href
          <AdminInput
                        value={p.href}
            onChange={(e) =>
              patchContent({ primaryCta: { ...p, href: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Secondary CTA label
          <AdminInput
                        value={s.label}
            onChange={(e) =>
              patchContent({ secondaryCta: { ...s, label: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Secondary CTA href
          <AdminInput
                        value={s.href}
            onChange={(e) =>
              patchContent({ secondaryCta: { ...s, href: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Tertiary CTA label
          <AdminInput
                        value={t.label}
            onChange={(e) =>
              patchContent({ tertiaryCta: { ...t, label: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Tertiary CTA href
          <AdminInput
                        value={t.href}
            onChange={(e) =>
              patchContent({ tertiaryCta: { ...t, href: e.target.value } })
            }
          />
        </AdminFieldLabel>
      </div>
    )
  }

  return (
    <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
      No extra fields for this act type yet — content JSON is still validated on save.
    </p>
  )
}

function ActMediaBlock({
  nature,
  preset,
  content,
  patchContent,
  media,
  campaignMarkFallback,
  dropSlug,
  onChange,
  onCampaignMarkChange,
}: {
  nature: LandingAct['nature']
  preset: string
  content: Record<string, unknown>
  patchContent: (patch: Record<string, unknown>) => void
  media: ActMedia | undefined
  campaignMarkFallback?: 'emblem' | 'wordmark'
  dropSlug?: string
  onChange: (next: ActMedia | undefined) => void
  onCampaignMarkChange: (next: 'emblem' | 'wordmark') => void
}) {
  const m = media ?? {}
  const upload =
    dropSlug != null ? { dropSlug, role: 'media' as const } : undefined
  const isLayeredHero = nature === 'hero' && isLayeredHeroPreset(preset)
  const bgImageLabel = isLayeredHero
    ? 'Background image (optional)'
    : 'Act image (optional)'
  const bgVideoLabel = isLayeredHero
    ? 'Background video (optional)'
    : 'Act video (optional)'
  const bgImageHint = isLayeredHero
    ? 'Atmospheric backdrop — clears background video when set.'
    : 'Hero backdrop — clears video when set.'
  const fgImage = readStr(content, 'foregroundImageUrl')
  const fgVideo = readStr(content, 'foregroundVideoUrl')

  return (
    <div className="mt-3 space-y-3 border-t border-[var(--color-line)]/60 pt-3">
      <AdminMicroHeading as="p" className="text-[10px] tracking-[0.14em] text-[var(--color-heading)]">
        {isLayeredHero ? 'Background media' : 'Act media'}
      </AdminMicroHeading>
      <div className="text-xs text-[var(--color-text-muted)]">
        <span className="block" id="act-campaign-mark-label">
          Fallback campaign mark
        </span>
        <AdminSelect
          value={campaignMarkFallback ?? 'emblem'}
          onValueChange={(v) => onCampaignMarkChange(v as 'emblem' | 'wordmark')}
        >
          <AdminSelectTrigger
            id="act-campaign-mark"
            aria-labelledby="act-campaign-mark-label"
            className="mt-1"
          >
            <AdminSelectValue placeholder="Fallback mark" />
          </AdminSelectTrigger>
          <AdminSelectContent>
            <AdminSelectItem value="emblem">Drop emblem</AdminSelectItem>
            <AdminSelectItem value="wordmark">Drop wordmark</AdminSelectItem>
          </AdminSelectContent>
        </AdminSelect>
        <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
          {isLayeredHero
            ? 'Shown in the foreground when no foreground image or video is set.'
            : 'Shown only when this act has no image or video media.'}
        </p>
      </div>
      <MediaPickerField
        label={bgImageLabel}
        kind="image"
        hint={bgImageHint}
        value={m.imageUrl ?? ''}
        supabaseUpload={upload}
        onChange={(next) =>
          onChange({
            ...m,
            imageUrl: next || undefined,
            videoUrl: next ? undefined : m.videoUrl,
            alt: m.alt,
          })
        }
        fallback="crest"
      />
      <MediaPickerField
        label={bgVideoLabel}
        kind="video"
        hint={
          isLayeredHero
            ? 'Clears background image when set. .mp4/.webm or Supabase upload.'
            : 'Clears image when set. .mp4/.webm or Supabase upload.'
        }
        value={m.videoUrl ?? ''}
        supabaseUpload={upload}
        onChange={(next) =>
          onChange({
            ...m,
            imageUrl: next ? undefined : m.imageUrl,
            videoUrl: next || undefined,
            alt: m.alt,
          })
        }
        fallback="none"
      />
      {isLayeredHero ? (
        <>
          <AdminMicroHeading as="p" className="pt-1 text-[10px] tracking-[0.14em] text-[var(--color-heading)]">
            Foreground media
          </AdminMicroHeading>
          <MediaPickerField
            label="Foreground image (optional)"
            kind="image"
            hint="Product or emblem focal — clears foreground video when set."
            value={fgImage}
            supabaseUpload={upload}
            onChange={(next) =>
              patchContent({
                foregroundImageUrl: next || undefined,
                foregroundVideoUrl: next ? undefined : fgVideo || undefined,
              })
            }
            fallback="crest"
          />
          <MediaPickerField
            label="Foreground video (optional)"
            kind="video"
            hint="Clears foreground image when set. .mp4/.webm or Supabase upload."
            value={fgVideo}
            supabaseUpload={upload}
            onChange={(next) =>
              patchContent({
                foregroundImageUrl: next ? undefined : fgImage || undefined,
                foregroundVideoUrl: next || undefined,
              })
            }
            fallback="none"
          />
        </>
      ) : null}
      <AdminFieldLabel labelStyle="stacked" className="block">
        Alt text
        <AdminInput
          value={m.alt ?? ''}
          onChange={(e) =>
            onChange({
              ...m,
              imageUrl: m.imageUrl,
              videoUrl: m.videoUrl,
              alt: e.target.value || undefined,
            })
          }
        />
      </AdminFieldLabel>
    </div>
  )
}

type Props = {
  landingContentJson: string
  acts: LandingAct[]
  landingActSequence: LandingActSlot[]
  catalogProducts?: CatalogProduct[]
  previewLanding: LandingPageCmsContent
  previewProducts: Product[]
  palette: DropThemePalette
  emblemUrl: string
  wordmarkUrl?: string
  dropSlug?: string
  fillViewport?: boolean
  onChange: (next: {
    acts: LandingAct[]
    landingActSequence: LandingActSlot[]
  }) => void
}

export function DropActsBuilderPanel({
  landingContentJson: _landingContentJson,
  acts,
  landingActSequence,
  catalogProducts = [],
  previewLanding,
  previewProducts,
  palette,
  emblemUrl,
  wordmarkUrl = '',
  dropSlug,
  fillViewport = false,
  onChange,
}: Props) {
  const sorted = useMemo(
    () => [...acts].sort((a, b) => a.sortOrder - b.sortOrder),
    [acts],
  )

  const [selectedActId, setSelectedActId] = useState<string | null>(
    () => sorted[0]?.id ?? null,
  )
  const [animationRemountKey, setAnimationRemountKey] = useState(0)
  const [playingAnimation, setPlayingAnimation] = useState(false)
  const [motionPreviewLive, setMotionPreviewLive] = useState(false)

  useEffect(() => {
    if (selectedActId && sorted.some((a) => a.id === selectedActId)) return
    setSelectedActId(sorted[0]?.id ?? null)
  }, [selectedActId, sorted])

  const selectedAct = sorted.find((a) => a.id === selectedActId) ?? null

  useEffect(() => {
    if (!selectedAct?.animation) return
    setAnimationRemountKey((k) => k + 1)
  }, [
    selectedAct?.animation?.enabled,
    selectedAct?.animation?.type,
    selectedAct?.animation?.intensity,
    selectedAct?.animation?.desktopOnly,
  ])

  const emit = useCallback(
    (nextActs: LandingAct[]) => {
      onChange({
        acts: nextActs,
        landingActSequence: syncSequence(nextActs, landingActSequence),
      })
    },
    [landingActSequence, onChange],
  )

  function updateAct(id: string, patch: Partial<LandingAct>) {
    emit(acts.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  function removeAct(id: string) {
    const next = acts.filter((a) => a.id !== id).map((a, i) => ({ ...a, sortOrder: i }))
    emit(next)
    if (selectedActId === id) {
      setSelectedActId(next[0]?.id ?? null)
    }
  }

  function reorderActs(orderedIds: string[]) {
    const byId = new Map(sorted.map((a) => [a.id, a]))
    const next = orderedIds
      .map((id) => byId.get(id))
      .filter((a): a is LandingAct => Boolean(a))
      .map((a, i) => ({ ...a, sortOrder: i }))
    emit(next)
  }

  function playSelectedAnimation() {
    setPlayingAnimation(true)
    setAnimationRemountKey((k) => k + 1)
    window.setTimeout(() => setPlayingAnimation(false), 2800)
  }

  function addAct() {
    const nature = 'hero'
    const preset = PRESETS[nature as LandingActNature]?.[0] ?? 'default'
    const next: LandingAct = {
      id: createCmsId('act'),
      nature,
      preset,
      isEnabled: true,
      sortOrder: acts.length,
      title: '',
      animation: mergeActAnimationConfig(),
      content: safeParseActContent(nature, {}),
      media: {},
    }
    emit([...acts, next])
    setSelectedActId(next.id)
  }

  const act = selectedAct
  const anim = act ? mergeActAnimationConfig(act.animation) : null
  const presetChoices = act
    ? [...(PRESETS[act.nature as LandingActNature] ?? ['default'])]
    : []
  const presetSelectValue =
    act && presetChoices.includes(act.preset)
      ? act.preset
      : (presetChoices[0] ?? 'default')

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col gap-2',
        fillViewport && 'h-full flex-1 overflow-hidden',
      )}
      data-testid="drop-acts-builder-panel"
    >
      <DropActListRail
        acts={sorted}
        selectedId={selectedActId}
        onSelect={setSelectedActId}
        onAdd={addAct}
        onRemove={removeAct}
        onReorder={reorderActs}
      />

      <div
        className={cn(
          'grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(14rem,38%)_minmax(0,1fr)] lg:items-stretch lg:overflow-hidden',
          fillViewport && 'h-full',
        )}
      >
        <div className="order-2 flex min-h-0 flex-col lg:order-1 lg:h-full lg:min-h-0 lg:max-h-full">
          <AdminCard
            className="flex min-h-0 flex-1 flex-col !p-2 sm:!p-3 [&_header]:mb-2"
            title="Act preview"
            description={undefined}
            actions={
              selectedActId ? (
                <div className="flex items-center gap-2">
                  <AdminCheckbox
                    className="py-0"
                    checked={motionPreviewLive}
                    onChange={(e) => setMotionPreviewLive(e.target.checked)}
                    label="Live motion"
                  />
                  <IconButton
                    type="button"
                    aria-label={playingAnimation ? 'Playing animation' : 'Play animation'}
                    title={playingAnimation ? 'Playing…' : 'Play animation'}
                    disabled={playingAnimation}
                    className="h-8 w-8 border-[var(--color-line)]/70 bg-[var(--color-surface-soft)]"
                    onClick={playSelectedAnimation}
                  >
                    <Play size={14} aria-hidden />
                  </IconButton>
                </div>
              ) : null
            }
          >
            {selectedActId ? (
              <DropEditorLivePreview
                key={`act-preview-${selectedActId}-${animationRemountKey}-${playingAnimation ? 'play' : 'static'}`}
                landing={previewLanding}
                products={previewProducts}
                palette={palette}
                emblemUrl={emblemUrl}
                wordmarkUrl={wordmarkUrl}
                draftActs={acts}
                onlyActIds={[selectedActId]}
                freezeIntroAnimations={!playingAnimation && !motionPreviewLive}
                animationRemountKey={animationRemountKey}
                compact
              />
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">Select an act to preview.</p>
            )}
          </AdminCard>
        </div>

        <AdminCard
          className="order-1 flex min-h-0 flex-col lg:order-2 lg:max-h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1"
          title={act ? `Edit · ${act.title?.trim() || act.nature}` : 'Select an act'}
          description={undefined}
        >
        {!act ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Choose an act from the list or add a new one to begin editing.
          </p>
        ) : (
          <div className="space-y-5 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <AdminCheckbox
                className="py-0"
                checked={act.isEnabled}
                onChange={(e) => updateAct(act.id, { isEnabled: e.target.checked })}
                label="Visible on landing"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="text-xs text-[var(--color-text-muted)]">
                <span className="block" id={`act-${act.id}-nature-label`}>
                  Nature
                </span>
                <AdminSelect
                  value={act.nature}
                  onValueChange={(nature) => {
                    const preset = PRESETS[nature as LandingActNature]?.[0] ?? 'default'
                    updateAct(act.id, {
                      nature,
                      preset,
                      content: safeParseActContent(nature, act.content ?? {}),
                      productIds:
                        nature === 'productShowcase' ? act.productIds : undefined,
                    })
                  }}
                >
                  <AdminSelectTrigger
                    id={`act-${act.id}-nature`}
                    aria-labelledby={`act-${act.id}-nature-label`}
                    className="mt-1"
                  >
                    <AdminSelectValue placeholder="Nature" />
                  </AdminSelectTrigger>
                  <AdminSelectContent>
                    {NATURE_OPTIONS.map((o) => (
                      <AdminSelectItem key={o.value} value={o.value}>
                        {o.label}
                      </AdminSelectItem>
                    ))}
                  </AdminSelectContent>
                </AdminSelect>
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                <span className="block" id={`act-${act.id}-preset-label`}>
                  Preset
                </span>
                <AdminSelect
                  value={presetSelectValue}
                  onValueChange={(preset) => updateAct(act.id, { preset })}
                >
                  <AdminSelectTrigger
                    id={`act-${act.id}-preset`}
                    aria-labelledby={`act-${act.id}-preset-label`}
                    className="mt-1"
                  >
                    <AdminSelectValue placeholder="Preset" />
                  </AdminSelectTrigger>
                  <AdminSelectContent>
                    {presetChoices.map((p) => (
                      <AdminSelectItem key={p} value={p}>
                        {getActPresetLabel(act.nature, p)}
                      </AdminSelectItem>
                    ))}
                  </AdminSelectContent>
                </AdminSelect>
              </div>
              <AdminFieldLabel labelStyle="stacked" className="block">
                Eyebrow
                <AdminInput
                  value={act.eyebrow ?? ''}
                  onChange={(e) => updateAct(act.id, { eyebrow: e.target.value })}
                />
              </AdminFieldLabel>
              <AdminFieldLabel labelStyle="stacked" className="block">
                Title
                <AdminInput
                  value={act.title ?? ''}
                  onChange={(e) => updateAct(act.id, { title: e.target.value })}
                />
              </AdminFieldLabel>
              <AdminFieldLabel labelStyle="stacked" className="block md:col-span-2">
                Subtitle
                <AdminInput
                  value={act.subtitle ?? ''}
                  onChange={(e) => updateAct(act.id, { subtitle: e.target.value })}
                />
              </AdminFieldLabel>
              {act.nature !== 'hero' && act.nature !== 'manifesto' ? (
                <AdminFieldLabel labelStyle="stacked" className="block md:col-span-2">
                  Body
                  <AdminTextarea
                    className="min-h-[88px]"
                    value={act.body ?? ''}
                    onChange={(e) => updateAct(act.id, { body: e.target.value })}
                  />
                </AdminFieldLabel>
              ) : null}
            </div>

            <ActMediaBlock
              nature={act.nature}
              preset={act.preset}
              content={(act.content ?? {}) as Record<string, unknown>}
              patchContent={(patch) => {
                const merged = safeParseActContent(act.nature, {
                  ...(act.content ?? {}),
                  ...patch,
                })
                updateAct(act.id, { content: merged })
              }}
              media={act.media}
              campaignMarkFallback={act.campaignMarkFallback}
              dropSlug={dropSlug}
              onChange={(next) => updateAct(act.id, { media: next })}
              onCampaignMarkChange={(next) =>
                updateAct(act.id, { campaignMarkFallback: next })
              }
            />

            {anim ? (
              <AdminPanel variant="inset" className="space-y-3">
                <AdminMicroHeading as="p" className="text-[10px] tracking-[0.14em]">
                  Animation
                </AdminMicroHeading>
                <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
                  <AdminCheckbox
                    className="py-0"
                    checked={anim.enabled}
                    onChange={(e) =>
                      updateAct(act.id, {
                        animation: mergeActAnimationConfig({
                          ...anim,
                          enabled: e.target.checked,
                        }),
                      })
                    }
                    label="Enabled"
                  />
                  <AdminCheckbox
                    className="py-0"
                    checked={anim.desktopOnly}
                    onChange={(e) =>
                      updateAct(act.id, {
                        animation: mergeActAnimationConfig({
                          ...anim,
                          desktopOnly: e.target.checked,
                        }),
                      })
                    }
                    label="Desktop / tablet only"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="text-xs text-[var(--color-text-muted)]">
                    <span className="block" id={`act-${act.id}-anim-type-label`}>
                      Motion type
                    </span>
                    <AdminSelect
                      value={
                        ACT_MOTION_TYPE_OPTIONS.some((o) => o.value === anim.type)
                          ? anim.type
                          : 'wordReveal'
                      }
                      onValueChange={(v) =>
                        updateAct(act.id, {
                          animation: mergeActAnimationConfig({
                            ...anim,
                            type: v,
                          }),
                        })
                      }
                    >
                      <AdminSelectTrigger
                        id={`act-${act.id}-anim-type`}
                        aria-labelledby={`act-${act.id}-anim-type-label`}
                        className="mt-1"
                      >
                        <AdminSelectValue placeholder="Motion type" />
                      </AdminSelectTrigger>
                      <AdminSelectContent>
                        {ACT_MOTION_TYPE_OPTIONS.map((o) => (
                          <AdminSelectItem key={o.value} value={o.value}>
                            {o.label}
                          </AdminSelectItem>
                        ))}
                      </AdminSelectContent>
                    </AdminSelect>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    <span className="block" id={`act-${act.id}-anim-intensity-label`}>
                      Intensity
                    </span>
                    <AdminSelect
                      value={anim.intensity}
                      onValueChange={(v) =>
                        updateAct(act.id, {
                          animation: mergeActAnimationConfig({
                            ...anim,
                            intensity: v as typeof anim.intensity,
                          }),
                        })
                      }
                    >
                      <AdminSelectTrigger
                        id={`act-${act.id}-anim-intensity`}
                        aria-labelledby={`act-${act.id}-anim-intensity-label`}
                        className="mt-1"
                      >
                        <AdminSelectValue placeholder="Intensity" />
                      </AdminSelectTrigger>
                      <AdminSelectContent>
                        <AdminSelectItem value="subtle">Subtle</AdminSelectItem>
                        <AdminSelectItem value="standard">Standard</AdminSelectItem>
                        <AdminSelectItem value="bold">Bold</AdminSelectItem>
                      </AdminSelectContent>
                    </AdminSelect>
                  </div>
                </div>
              </AdminPanel>
            ) : null}

            <NatureContentFields
              act={act}
              patchContent={(patch) => {
                const merged = safeParseActContent(act.nature, {
                  ...(act.content ?? {}),
                  ...patch,
                })
                updateAct(act.id, { content: merged })
              }}
            />

            {act.nature === 'productShowcase' ? (
              <AdminPanel variant="inset" className="space-y-2">
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  Featured SKUs (optional — empty uses all drop products).
                </p>
                {catalogProducts.length === 0 ? (
                  <p className="text-[10px] text-[var(--color-text-muted)]">No catalog products.</p>
                ) : (
                  <div className="max-h-36 space-y-1 overflow-y-auto">
                    {catalogProducts.map((p) => {
                      const picked = act.productIds?.includes(p.id) ?? false
                      return (
                        <AdminCheckbox
                          key={p.id}
                          className="border border-[var(--color-line)]/40 px-2 py-1"
                          checked={picked}
                          onChange={(e) => {
                            const cur = act.productIds ?? []
                            const next = e.target.checked
                              ? [...cur, p.id]
                              : cur.filter((x) => x !== p.id)
                            updateAct(act.id, {
                              productIds: next.length ? next : undefined,
                            })
                          }}
                          label={p.name}
                        />
                      )
                    })}
                  </div>
                )}
              </AdminPanel>
            ) : null}
          </div>
        )}
        </AdminCard>
      </div>
    </div>
  )
}
