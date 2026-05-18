import { useCallback, useMemo } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import type { LandingActSlot } from '@/features/admin/drops/drops.actSequence'
import { defaultLandingActSequence } from '@/features/admin/drops/drops.actSequence'
import type { ActMedia, LandingAct } from '@/features/admin/drops/acts/landingActs.types'
import { mergeActAnimationConfig } from '@/features/admin/drops/acts/landingActs.types'
import { safeParseActContent } from '@/features/admin/drops/acts/landingActs.zod'
import { landingContentToSimpleActs } from '@/features/admin/drops/acts/landingActs.seed'
import { dropLandingContentSchema } from '@/features/admin/drops/drops.persistence.zod'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from '@/features/admin/components/AdminSelect'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'
import { IconButton } from '@/shared/components/ui/IconButton'

const NATURE_OPTIONS = [
  { value: 'hero', label: 'Hero' },
  { value: 'manifesto', label: 'Manifesto' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'dropReveal', label: 'Drop reveal' },
  { value: 'productShowcase', label: 'Product showcase' },
  { value: 'materialShowcase', label: 'Material showcase' },
  { value: 'specialEvent', label: 'Special event' },
  { value: 'lookbook', label: 'Lookbook' },
  { value: 'newsletterWaitlist', label: 'Newsletter / waitlist' },
  { value: 'finalCTA', label: 'Final CTA' },
] as const

const PRESETS: Record<string, readonly string[]> = {
  hero: ['theOathCinematic', 'splitProduct', 'minimalEmblem'],
  manifesto: ['oathStampLedger', 'splitText', 'scrollStacked'],
  storytelling: ['chapterScroll', 'editorialArticle', 'imageLed'],
  dropReveal: ['monolithReveal', 'countdownTrio', 'emblemFirst'],
  productShowcase: ['threeCardEditorial', 'carousel', 'productStory'],
  materialShowcase: ['fabricRunway', 'specsGrid', 'splitDetail'],
  specialEvent: ['eventCard', 'countdownEvent', 'locationSplit'],
  lookbook: ['masonry', 'carousel', 'editorial'],
  newsletterWaitlist: ['oathFullWidthForm', 'minimalForm', 'splitForm'],
  finalCTA: ['centered', 'footerOverlap', 'productCta'],
}

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
    case 'newsletterWaitlist':
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

function readStrList(c: Record<string, unknown>, key: string): string[] {
  const v = c[key]
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
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
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Countdown target (ISO datetime)
          <AdminInput
                        value={readStr(c, 'countdownTargetIso')}
            onChange={(e) =>
              patchContent({ countdownTargetIso: e.target.value || undefined })
            }
          />
        </label>
        <div className="md:col-span-2">
          <MediaPickerField
            label="Background image"
            kind="image"
            hint="Optional hero backdrop for this act."
            value={readStr(c, 'backgroundImageUrl')}
            onChange={(next) =>
              patchContent({ backgroundImageUrl: next || undefined })
            }
            fallback="crest"
          />
        </div>
        <div className="md:col-span-2">
          <MediaPickerField
            label="Emblem / watermark"
            kind="image"
            hint="Decorative crest layered behind hero copy."
            value={readStr(c, 'emblemWatermarkSrc')}
            onChange={(next) =>
              patchContent({ emblemWatermarkSrc: next || undefined })
            }
            fallback="crest"
          />
        </div>
        <label className="text-xs text-[var(--color-text-muted)]">
          Primary CTA label
          <AdminInput
                        value={p.label}
            onChange={(e) =>
              patchContent({
                primaryCta: { ...p, label: e.target.value },
              })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Primary CTA href
          <AdminInput
                        value={p.href}
            onChange={(e) =>
              patchContent({
                primaryCta: { ...p, href: e.target.value },
              })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Secondary CTA label
          <AdminInput
                        value={s.label}
            onChange={(e) =>
              patchContent({
                secondaryCta: { ...s, label: e.target.value },
              })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Secondary CTA href
          <AdminInput
                        value={s.href}
            onChange={(e) =>
              patchContent({
                secondaryCta: { ...s, href: e.target.value },
              })
            }
          />
        </label>
      </div>
    )
  }

  if (nature === 'manifesto') {
    return (
      <div className="mt-3 grid gap-3 border-t border-[var(--color-line)]/60 pt-3 md:grid-cols-2">
        <label className="text-xs text-[var(--color-text-muted)]">
          Quote
          <AdminInput
                        value={readStr(c, 'quote')}
            onChange={(e) => patchContent({ quote: e.target.value || undefined })}
          />
        </label>
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Story paragraphs
          <AdminTextarea
            className="min-h-[72px]"
            value={readStr(c, 'storyParagraphs')}
            onChange={(e) =>
              patchContent({ storyParagraphs: e.target.value || undefined })
            }
          />
        </label>
      </div>
    )
  }

  if (nature === 'storytelling') {
    return (
      <div className="mt-3 grid gap-3 border-t border-[var(--color-line)]/60 pt-3 md:grid-cols-2">
        <label className="text-xs text-[var(--color-text-muted)]">
          Chapter title
          <AdminInput
                        value={readStr(c, 'chapterTitle')}
            onChange={(e) =>
              patchContent({ chapterTitle: e.target.value || undefined })
            }
          />
        </label>
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Chapter body
          <AdminTextarea
            className="min-h-[72px]"
            value={readStr(c, 'chapterBody')}
            onChange={(e) =>
              patchContent({ chapterBody: e.target.value || undefined })
            }
          />
        </label>
      </div>
    )
  }

  if (nature === 'dropReveal') {
    const p = readCta(c, 'primaryCta')
    const s = readCta(c, 'secondaryCta')
    return (
      <div className="mt-3 grid gap-3 border-t border-[var(--color-line)]/60 pt-3 md:grid-cols-2">
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Release date (ISO)
          <AdminInput
                        value={readStr(c, 'releaseDateIso')}
            onChange={(e) =>
              patchContent({ releaseDateIso: e.target.value || undefined })
            }
          />
        </label>
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
        <label className="text-xs text-[var(--color-text-muted)]">
          Primary CTA label
          <AdminInput
                        value={p.label}
            onChange={(e) =>
              patchContent({ primaryCta: { ...p, label: e.target.value } })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Primary CTA href
          <AdminInput
                        value={p.href}
            onChange={(e) =>
              patchContent({ primaryCta: { ...p, href: e.target.value } })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Secondary CTA label
          <AdminInput
                        value={s.label}
            onChange={(e) =>
              patchContent({ secondaryCta: { ...s, label: e.target.value } })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Secondary CTA href
          <AdminInput
                        value={s.href}
            onChange={(e) =>
              patchContent({ secondaryCta: { ...s, href: e.target.value } })
            }
          />
        </label>
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
        <label className="text-xs text-[var(--color-text-muted)]">
          View all label
          <AdminInput
                        value={readStr(c, 'viewAllLabel')}
            onChange={(e) =>
              patchContent({ viewAllLabel: e.target.value || undefined })
            }
          />
        </label>
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          View all href
          <AdminInput
                        value={readStr(c, 'viewAllHref')}
            onChange={(e) =>
              patchContent({ viewAllHref: e.target.value || undefined })
            }
          />
        </label>
      </div>
    )
  }

  if (nature === 'materialShowcase') {
    return (
      <div className="mt-3 grid gap-3 border-t border-[var(--color-line)]/60 pt-3 md:grid-cols-2">
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Material name
          <AdminInput
                        value={readStr(c, 'materialName')}
            onChange={(e) =>
              patchContent({ materialName: e.target.value || undefined })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          GSM
          <AdminInput
                        value={readStr(c, 'gsm')}
            onChange={(e) => patchContent({ gsm: e.target.value || undefined })}
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Composition
          <AdminInput
                        value={readStr(c, 'composition')}
            onChange={(e) =>
              patchContent({ composition: e.target.value || undefined })
            }
          />
        </label>
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Fit notes
          <AdminTextarea
            className="min-h-[56px]"
            value={readStr(c, 'fitNotes')}
            onChange={(e) =>
              patchContent({ fitNotes: e.target.value || undefined })
            }
          />
        </label>
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Construction notes
          <AdminTextarea
            className="min-h-[56px]"
            value={readStr(c, 'constructionNotes')}
            onChange={(e) =>
              patchContent({ constructionNotes: e.target.value || undefined })
            }
          />
        </label>
      </div>
    )
  }

  if (nature === 'specialEvent') {
    const ct = readCta(c, 'cta')
    return (
      <div className="mt-3 grid gap-3 border-t border-[var(--color-line)]/60 pt-3 md:grid-cols-2">
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Event title
          <AdminInput
                        value={readStr(c, 'eventTitle')}
            onChange={(e) =>
              patchContent({ eventTitle: e.target.value || undefined })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Starts (ISO)
          <AdminInput
                        value={readStr(c, 'startsAtIso')}
            onChange={(e) =>
              patchContent({ startsAtIso: e.target.value || undefined })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Ends (ISO)
          <AdminInput
                        value={readStr(c, 'endsAtIso')}
            onChange={(e) =>
              patchContent({ endsAtIso: e.target.value || undefined })
            }
          />
        </label>
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Location
          <AdminInput
                        value={readStr(c, 'location')}
            onChange={(e) =>
              patchContent({ location: e.target.value || undefined })
            }
          />
        </label>
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Link href
          <AdminInput
                        value={readStr(c, 'linkHref')}
            onChange={(e) =>
              patchContent({ linkHref: e.target.value || undefined })
            }
          />
        </label>
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Rules
          <AdminTextarea
            className="min-h-[56px]"
            value={readStr(c, 'rules')}
            onChange={(e) => patchContent({ rules: e.target.value || undefined })}
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          CTA label
          <AdminInput
                        value={ct.label}
            onChange={(e) =>
              patchContent({ cta: { ...ct, label: e.target.value } })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          CTA href
          <AdminInput
                        value={ct.href}
            onChange={(e) =>
              patchContent({ cta: { ...ct, href: e.target.value } })
            }
          />
        </label>
      </div>
    )
  }

  if (nature === 'lookbook') {
    const items = Array.isArray(c.galleryItems)
      ? (c.galleryItems as Array<{ src?: string; caption?: string }>)
      : []
    const pad = (i: number) => items[i] ?? { src: '', caption: '' }
    const setItem = (
      index: number,
      next: { src?: string; caption?: string },
    ) => {
      const copy = [pad(0), pad(1), pad(2), pad(3), pad(4)]
      copy[index] = { ...copy[index], ...next }
      const galleryItems = copy
        .filter((it) => (it.src ?? '').trim().length > 0)
        .map((it) => ({
          src: (it.src ?? '').trim(),
          caption: it.caption?.trim() || undefined,
        }))
      patchContent({ galleryItems: galleryItems.length ? galleryItems : undefined })
    }
    const layoutRaw = readStr(c, 'layout')
    const layoutValue =
      layoutRaw === 'masonry' ||
      layoutRaw === 'carousel' ||
      layoutRaw === 'editorial'
        ? layoutRaw
        : INHERIT_VALUE
    return (
      <div className="mt-3 space-y-3 border-t border-[var(--color-line)]/60 pt-3">
        <div className="text-xs text-[var(--color-text-muted)]">
          <span className="block" id={`act-${act.id}-lookbook-layout-label`}>
            Layout
          </span>
          <AdminSelect
            value={layoutValue}
            onValueChange={(v) => {
              patchContent({
                layout:
                  v === INHERIT_VALUE
                    ? undefined
                    : (v as 'masonry' | 'carousel' | 'editorial'),
              })
            }}
          >
            <AdminSelectTrigger
              id={`act-${act.id}-lookbook-layout`}
              aria-labelledby={`act-${act.id}-lookbook-layout-label`}
              className="mt-1"
            >
              <AdminSelectValue placeholder="Layout" />
            </AdminSelectTrigger>
            <AdminSelectContent>
              <AdminSelectItem value={INHERIT_VALUE}>Default</AdminSelectItem>
              <AdminSelectItem value="masonry">Masonry</AdminSelectItem>
              <AdminSelectItem value="carousel">Carousel</AdminSelectItem>
              <AdminSelectItem value="editorial">Editorial</AdminSelectItem>
            </AdminSelectContent>
          </AdminSelect>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Up to five gallery entries (image or hosted video URL in src).
        </p>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="grid gap-3 rounded-lg border border-[var(--color-line)]/50 p-3"
          >
            <MediaPickerField
              label={`Gallery item ${i + 1}`}
              kind="any"
              hint="Image or video for this lookbook slot."
              value={pad(i).src ?? ''}
              onChange={(next) =>
                setItem(i, { src: next, caption: pad(i).caption })
              }
              fallback="none"
            />
            <label className="text-[10px] text-[var(--color-text-muted)]">
              Caption {i + 1}
              <AdminInput
                                value={pad(i).caption ?? ''}
                onChange={(e) => setItem(i, { src: pad(i).src, caption: e.target.value })}
              />
            </label>
          </div>
        ))}
      </div>
    )
  }

  if (nature === 'newsletterWaitlist') {
    const opts = readStrList(c, 'preferredProductOptions')
    const optLine = opts.join('\n')
    return (
      <div className="mt-3 grid gap-3 border-t border-[var(--color-line)]/60 pt-3 md:grid-cols-2">
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Form intro
          <AdminTextarea
            className="min-h-[56px]"
            value={readStr(c, 'formIntro')}
            onChange={(e) =>
              patchContent({ formIntro: e.target.value || undefined })
            }
          />
        </label>
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Consent copy
          <AdminTextarea
            className="min-h-[56px]"
            value={readStr(c, 'consentCopy')}
            onChange={(e) =>
              patchContent({ consentCopy: e.target.value || undefined })
            }
          />
        </label>
        <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
          Preferred product options (one per line)
          <AdminTextarea
            className="min-h-[72px]"
            value={optLine}
            onChange={(e) => {
              const lines = e.target.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
              patchContent({
                preferredProductOptions: lines.length ? lines : undefined,
              })
            }}
          />
        </label>
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
        <label className="text-xs text-[var(--color-text-muted)]">
          Primary CTA label
          <AdminInput
                        value={p.label}
            onChange={(e) =>
              patchContent({ primaryCta: { ...p, label: e.target.value } })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Primary CTA href
          <AdminInput
                        value={p.href}
            onChange={(e) =>
              patchContent({ primaryCta: { ...p, href: e.target.value } })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Secondary CTA label
          <AdminInput
                        value={s.label}
            onChange={(e) =>
              patchContent({ secondaryCta: { ...s, label: e.target.value } })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Secondary CTA href
          <AdminInput
                        value={s.href}
            onChange={(e) =>
              patchContent({ secondaryCta: { ...s, href: e.target.value } })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Tertiary CTA label
          <AdminInput
                        value={t.label}
            onChange={(e) =>
              patchContent({ tertiaryCta: { ...t, label: e.target.value } })
            }
          />
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          Tertiary CTA href
          <AdminInput
                        value={t.href}
            onChange={(e) =>
              patchContent({ tertiaryCta: { ...t, href: e.target.value } })
            }
          />
        </label>
      </div>
    )
  }

  return (
    <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
      Nature-specific fields for &ldquo;{nature}&rdquo; can be added later;
      content JSON is still validated on save paths.
    </p>
  )
}

function ActMediaBlock({
  media,
  onChange,
}: {
  media: ActMedia | undefined
  onChange: (next: ActMedia | undefined) => void
}) {
  const m = media ?? {}
  return (
    <div className="mt-3 space-y-3 border-t border-[var(--color-line)]/60 pt-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-heading)]">
        Act media
      </p>
      <MediaPickerField
        label="Act image (optional)"
        kind="image"
        hint="Backdrop keyed to this act row — defaults to the ANVL crest when empty."
        value={m.imageUrl ?? ''}
        onChange={(next) =>
          onChange({
            ...m,
            imageUrl: next || undefined,
            videoUrl: m.videoUrl,
            alt: m.alt,
          })
        }
        fallback="crest"
      />
      <MediaPickerField
        label="Act video (optional)"
        kind="video"
        hint="Hosted .mp4/.webm URL, or upload a small file (≤ 8 MB) to embed."
        value={m.videoUrl ?? ''}
        onChange={(next) =>
          onChange({
            ...m,
            imageUrl: m.imageUrl,
            videoUrl: next || undefined,
            alt: m.alt,
          })
        }
        fallback="none"
      />
      <label className="block text-xs text-[var(--color-text-muted)]">
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
      </label>
    </div>
  )
}

type Props = {
  landingContentJson: string
  acts: LandingAct[]
  landingActSequence: LandingActSlot[]
  catalogProducts?: CatalogProduct[]
  onChange: (next: {
    acts: LandingAct[]
    landingActSequence: LandingActSlot[]
  }) => void
}

export function DropActsBuilderPanel({
  landingContentJson,
  acts,
  landingActSequence,
  catalogProducts = [],
  onChange,
}: Props) {
  const sorted = useMemo(
    () => [...acts].sort((a, b) => a.sortOrder - b.sortOrder),
    [acts],
  )

  const emit = useCallback(
    (nextActs: LandingAct[]) => {
      onChange({
        acts: nextActs,
        landingActSequence: syncSequence(nextActs, landingActSequence),
      })
    },
    [landingActSequence, onChange],
  )

  const bootstrapFromLanding = useCallback(() => {
    let parsed: unknown
    try {
      parsed = JSON.parse(landingContentJson)
    } catch {
      return
    }
    // SEC-16 — never feed unvalidated JSON into the act builder. A
    // malformed paste used to throw downstream during normalize; a
    // hostile one would drive unexpected state in the builder draft.
    const result = dropLandingContentSchema.safeParse(parsed)
    if (!result.success) return
    emit(landingContentToSimpleActs(result.data))
  }, [emit, landingContentJson])

  function updateAct(id: string, patch: Partial<LandingAct>) {
    emit(acts.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  function removeAct(id: string) {
    emit(acts.filter((a) => a.id !== id).map((a, i) => ({ ...a, sortOrder: i })))
  }

  function moveAct(id: string, dir: -1 | 1) {
    const list = [...sorted]
    const idx = list.findIndex((a) => a.id === id)
    if (idx < 0) return
    const swap = idx + dir
    if (swap < 0 || swap >= list.length) return
    ;[list[idx], list[swap]] = [list[swap], list[idx]]
    emit(list.map((a, i) => ({ ...a, sortOrder: i })))
  }


  function addAct() {
    const nature = 'hero'
    const preset = PRESETS[nature]?.[0] ?? 'default'
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
  }

  return (
    <AdminCard
      className="h-auto min-h-0"
      testId="drop-acts-builder-panel"
      title="Acts builder"
      description="Configure act order, visibility, nature, presets, copy, media, animation, and structured content. Use “Reset acts from landing copy” only when you intentionally want to re-import legacy `Drop.landingContent` into acts."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          className="text-xs uppercase tracking-[0.16em] text-[var(--color-heading)]"
          onClick={bootstrapFromLanding}
        >
          Reset acts from landing copy
        </AdminButton>
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          className="text-xs uppercase tracking-[0.16em] text-[var(--color-heading)]"
          onClick={addAct}
        >
          Add act
        </AdminButton>
      </div>

      <div className="space-y-4">
        {sorted.map((act, actIndex) => {
          const anim = mergeActAnimationConfig(act.animation)
          const presetChoices = [...(PRESETS[act.nature] ?? ['default'])]
          const presetSelectValue = presetChoices.includes(act.preset)
            ? act.preset
            : (presetChoices[0] ?? 'default')
          const patchContent = (patch: Record<string, unknown>) => {
            const merged = safeParseActContent(act.nature, {
              ...(act.content ?? {}),
              ...patch,
            })
            updateAct(act.id, { content: merged })
          }
          return (
            <div
              key={act.id}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/30 p-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <AdminCheckbox
                  className="py-0"
                  checked={act.isEnabled}
                  onChange={(e) =>
                    updateAct(act.id, { isEnabled: e.target.checked })
                  }
                  label="On"
                />
                <span className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
                  #{act.sortOrder + 1}
                </span>
                <div
                  className="ml-auto inline-flex gap-1 rounded-md border border-[var(--color-line)] p-0.5"
                  role="group"
                  aria-label={
                    sorted.length > 1
                      ? `Reorder act ${actIndex + 1} of ${sorted.length}`
                      : 'Act actions'
                  }
                >
                  <IconButton
                    type="button"
                    aria-label={
                      sorted.length > 1
                        ? `Move act up, position ${actIndex + 1} of ${sorted.length}`
                        : 'Move act up'
                    }
                    title="Move act up"
                    disabled={actIndex === 0}
                    className="border-transparent bg-transparent hover:bg-[var(--color-surface-elevated)] disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-transparent"
                    onClick={() => moveAct(act.id, -1)}
                  >
                    <ChevronUp size={20} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    type="button"
                    aria-label={
                      sorted.length > 1
                        ? `Move act down, position ${actIndex + 1} of ${sorted.length}`
                        : 'Move act down'
                    }
                    title="Move act down"
                    disabled={actIndex >= sorted.length - 1}
                    className="border-transparent bg-transparent hover:bg-[var(--color-surface-elevated)] disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-transparent"
                    onClick={() => moveAct(act.id, 1)}
                  >
                    <ChevronDown size={20} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    type="button"
                    aria-label={
                      sorted.length > 1
                        ? `Remove act, position ${actIndex + 1} of ${sorted.length}`
                        : 'Remove act'
                    }
                    title="Remove act"
                    className="border-transparent bg-transparent text-red-300 hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-200"
                    onClick={() => removeAct(act.id)}
                  >
                    <Trash2 size={20} aria-hidden="true" />
                  </IconButton>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="text-xs text-[var(--color-text-muted)]">
                  <span className="block" id={`act-${act.id}-nature-label`}>
                    Nature
                  </span>
                  <AdminSelect
                    value={act.nature}
                    onValueChange={(nature) => {
                      const preset = PRESETS[nature]?.[0] ?? 'default'
                      updateAct(act.id, {
                        nature,
                        preset,
                        content: safeParseActContent(nature, act.content ?? {}),
                        productIds:
                          nature === 'productShowcase'
                            ? act.productIds
                            : undefined,
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
                    onValueChange={(preset) =>
                      updateAct(act.id, { preset })
                    }
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
                          {p}
                        </AdminSelectItem>
                      ))}
                    </AdminSelectContent>
                  </AdminSelect>
                </div>
                <label className="text-xs text-[var(--color-text-muted)]">
                  Eyebrow
                  <AdminInput
                                        value={act.eyebrow ?? ''}
                    onChange={(e) =>
                      updateAct(act.id, { eyebrow: e.target.value })
                    }
                  />
                </label>
                <label className="text-xs text-[var(--color-text-muted)]">
                  Title
                  <AdminInput
                                        value={act.title ?? ''}
                    onChange={(e) =>
                      updateAct(act.id, { title: e.target.value })
                    }
                  />
                </label>
                <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                  Subtitle
                  <AdminInput
                                        value={act.subtitle ?? ''}
                    onChange={(e) =>
                      updateAct(act.id, { subtitle: e.target.value })
                    }
                  />
                </label>
                <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                  Body
                  <AdminTextarea
                    className="min-h-[72px]"
                    value={act.body ?? ''}
                    onChange={(e) =>
                      updateAct(act.id, { body: e.target.value })
                    }
                  />
                </label>
              </div>

              <ActMediaBlock
                media={act.media}
                onChange={(next) => updateAct(act.id, { media: next })}
              />

              <div className="mt-3 space-y-2 border-t border-[var(--color-line)]/60 pt-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-heading)]">
                  Animation
                </p>
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
                  <label className="text-xs text-[var(--color-text-muted)]">
                    Motion type key
                    <AdminInput
                      placeholder="fadeUp, parallax, none…"
                      value={anim.type}
                      onChange={(e) =>
                        updateAct(act.id, {
                          animation: mergeActAnimationConfig({
                            ...anim,
                            type: e.target.value,
                          }),
                        })
                      }
                    />
                  </label>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    <span
                      className="block"
                      id={`act-${act.id}-anim-intensity-label`}
                    >
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
                        <AdminSelectItem value="standard">
                          Standard
                        </AdminSelectItem>
                        <AdminSelectItem value="bold">Bold</AdminSelectItem>
                      </AdminSelectContent>
                    </AdminSelect>
                  </div>
                </div>
              </div>

              <NatureContentFields act={act} patchContent={patchContent} />

              {act.nature === 'productShowcase' ? (
                <div className="mt-3 border-t border-[var(--color-line)]/60 pt-3">
                  <p className="mb-2 text-[10px] text-[var(--color-text-muted)]">
                    Featured SKUs for this act (optional — leave empty to use all
                    products assigned to the drop).
                  </p>
                  {catalogProducts.length === 0 ? (
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      No catalog products loaded.
                    </p>
                  ) : (
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-[var(--color-line)]/50 p-2">
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
                            description={
                              <span className="font-mono text-[10px]">{p.id}</span>
                            }
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </AdminCard>
  )
}
