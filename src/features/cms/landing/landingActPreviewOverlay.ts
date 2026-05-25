import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import type { CmsCta, LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'

export function readActStr(
  content: Record<string, unknown> | undefined,
  key: string,
): string {
  if (!content) return ''
  const v = content[key]
  return typeof v === 'string' ? v : ''
}

function readActCta(
  content: Record<string, unknown> | undefined,
  key: string,
): Partial<CmsCta> {
  if (!content) return {}
  const v = content[key]
  if (!v || typeof v !== 'object') return {}
  const o = v as Record<string, unknown>
  return {
    label: typeof o.label === 'string' ? o.label : undefined,
    href: typeof o.href === 'string' ? o.href : undefined,
  }
}

/** Overlay act CTA fragments from `LandingAct.content` onto persisted landing CTAs. */
export function mergeActContentCta(base: CmsCta, content: unknown, key: string): CmsCta {
  if (!content || typeof content !== 'object') return base
  const p = readActCta(content as Record<string, unknown>, key)
  return {
    label: p.label !== undefined ? p.label : base.label,
    href: p.href !== undefined ? p.href : base.href,
  }
}

export function previewHeroFields(
  landing: LandingPageCmsContent['hero'],
  row: LandingAct | undefined,
): Pick<
  LandingPageCmsContent['hero'],
  'badgeText' | 'title' | 'subtitle' | 'primaryCta' | 'secondaryCta'
> {
  const c = row?.content
  return {
    badgeText: row?.eyebrow ?? landing.badgeText,
    title: row?.title ?? landing.title,
    subtitle: row?.subtitle ?? landing.subtitle,
    primaryCta: mergeActContentCta(landing.primaryCta, c, 'primaryCta'),
    secondaryCta: mergeActContentCta(landing.secondaryCta, c, 'secondaryCta'),
  }
}

export function previewManifestoFields(
  landing: LandingPageCmsContent['manifesto'],
  row: LandingAct | undefined,
  mode: 'manifesto' | 'storytelling',
): {
  actLabel: string
  counterLabel?: string
  heading: string
  intro: string
  tenets: LandingPageCmsContent['manifesto']['tenets']
} {
  const c = (row?.content ?? {}) as Record<string, unknown>
  const quote = readActStr(c, 'quote')
  const storyParagraphs = readActStr(c, 'storyParagraphs')
  const chapterTitle = readActStr(c, 'chapterTitle')
  const chapterBody = readActStr(c, 'chapterBody')

  const headingBase =
    mode === 'storytelling'
      ? (row?.title?.trim() ? row.title : chapterTitle) || landing.heading
      : row?.title ?? landing.heading
  const introBase =
    mode === 'storytelling'
      ? (row?.body?.trim() ? row.body : chapterBody) || landing.intro
      : row?.body ?? landing.intro

  let introMerged = introBase
  if (mode === 'manifesto') {
    const parts = [introBase]
    if (quote.trim()) parts.push(`“${quote.trim()}”`)
    if (storyParagraphs.trim()) parts.push(storyParagraphs.trim())
    introMerged = parts.filter(Boolean).join('\n\n')
  }

  const tenetsFromContent = Array.isArray(c.tenets)
    ? (c.tenets as Array<{ id?: string; label?: string; body?: string }>)
        .filter((t) => typeof t.label === 'string' && t.label.trim())
        .map((t, i) => ({
          id: t.id?.trim() || `tenet-${i + 1}`,
          label: t.label!.trim(),
          body: typeof t.body === 'string' ? t.body : undefined,
        }))
    : null

  return {
    actLabel: row?.eyebrow ?? landing.actLabel,
    counterLabel: row?.subtitle ?? landing.counterLabel,
    heading: headingBase,
    intro: introMerged,
    tenets: tenetsFromContent?.length ? tenetsFromContent : landing.tenets,
  }
}

export function previewDropRevealFields(
  landing: LandingPageCmsContent['dropReveal'],
  row: LandingAct | undefined,
): Pick<
  LandingPageCmsContent['dropReveal'],
  | 'actLabel'
  | 'counterLabel'
  | 'words'
  | 'tagline'
  | 'primaryCta'
  | 'secondaryCta'
  | 'dropIcon'
> {
  const c = row?.content
  const tagline = row?.body ?? landing.tagline
  return {
    actLabel: row?.eyebrow ?? landing.actLabel,
    counterLabel: row?.subtitle ?? landing.counterLabel,
    words:
      row?.title !== undefined && row.title.trim()
        ? row.title.split(/\s+/).filter(Boolean)
        : landing.words,
    tagline,
    primaryCta: mergeActContentCta(landing.primaryCta, c, 'primaryCta'),
    secondaryCta: mergeActContentCta(landing.secondaryCta, c, 'secondaryCta'),
    dropIcon: landing.dropIcon,
  }
}

export function previewPiecesFields(
  landing: LandingPageCmsContent['pieces'],
  row: LandingAct | undefined,
): Pick<
  LandingPageCmsContent['pieces'],
  | 'actLabel'
  | 'headingLineOne'
  | 'headingLineTwo'
  | 'viewAllLabel'
  | 'viewAllHref'
  | 'footerLeftText'
  | 'footerLinkLabel'
  | 'footerLinkHref'
> {
  const c = (row?.content ?? {}) as Record<string, unknown>
  const viewAllLabel = readActStr(c, 'viewAllLabel')
  const viewAllHref = readActStr(c, 'viewAllHref')
  const h =
    row?.title !== undefined && row.title.trim()
      ? row.title.trim().split(/\s+/)
      : []
  const lineOne = h[0] ?? landing.headingLineOne
  const lineTwo = h.slice(1).join(' ') || landing.headingLineTwo
  return {
    actLabel: row?.eyebrow ?? landing.actLabel,
    headingLineOne: lineOne,
    headingLineTwo: lineTwo,
    viewAllLabel: viewAllLabel || landing.viewAllLabel,
    viewAllHref: viewAllHref || landing.viewAllHref,
    footerLeftText: landing.footerLeftText,
    footerLinkLabel: landing.footerLinkLabel,
    footerLinkHref: landing.footerLinkHref,
  }
}

export function previewMaterialsFields(
  landing: LandingPageCmsContent['materials'],
  row: LandingAct | undefined,
): Pick<
  LandingPageCmsContent['materials'],
  'actLabel' | 'counterSuffix' | 'heading' | 'intro' | 'materials'
> {
  const c = (row?.content ?? {}) as Record<string, unknown>
  const materialName = readActStr(c, 'materialName')
  const gsm = readActStr(c, 'gsm')
  const composition = readActStr(c, 'composition')
  const introPieces = [
    row?.body,
    composition && `Composition: ${composition}`,
    gsm && `GSM: ${gsm}`,
    materialName && `Featured: ${materialName}`,
  ].filter(Boolean) as string[]
  const intro =
    introPieces.length > 0 ? introPieces.join('\n\n') : landing.intro
  return {
    actLabel: row?.eyebrow ?? landing.actLabel,
    counterSuffix: row?.subtitle ?? landing.counterSuffix,
    heading: row?.title ?? landing.heading,
    intro,
    materials: landing.materials,
  }
}

export type LookbookGalleryItem = {
  src: string
  caption?: string
  mediaType?: 'image' | 'video'
}

export function previewLookbookFields(row: LandingAct | undefined): {
  actLabel: string
  heading: string
  intro: string
  layout: 'masonry' | 'carousel' | 'editorial'
  items: LookbookGalleryItem[]
} {
  const c = (row?.content ?? {}) as Record<string, unknown>
  const rawItems = Array.isArray(c.galleryItems) ? c.galleryItems : []
  const items: LookbookGalleryItem[] = rawItems
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      const src = typeof o.src === 'string' ? o.src.trim() : ''
      if (!src) return null
      return {
        src,
        caption: typeof o.caption === 'string' ? o.caption : undefined,
        mediaType:
          o.mediaType === 'video' || o.mediaType === 'image'
            ? o.mediaType
            : undefined,
      }
    })
    .filter(Boolean) as LookbookGalleryItem[]

  const layoutRaw = readActStr(c, 'layout')
  const layout =
    layoutRaw === 'carousel' || layoutRaw === 'editorial' || layoutRaw === 'masonry'
      ? layoutRaw
      : 'masonry'

  return {
    actLabel: row?.eyebrow?.trim() || 'Lookbook',
    heading: row?.title?.trim() || 'Forged in motion',
    intro: row?.body?.trim() || row?.subtitle?.trim() || '',
    layout,
    items,
  }
}

export function previewSpecialEventFields(row: LandingAct | undefined): {
  actLabel: string
  heading: string
  intro: string
  eventTitle: string
  startsAtIso: string
  endsAtIso: string
  location: string
  linkHref: string
  rules: string
  cta: CmsCta
} {
  const c = (row?.content ?? {}) as Record<string, unknown>
  const ctaPartial = readActCta(c, 'cta')
  return {
    actLabel: row?.eyebrow?.trim() || 'Special event',
    heading: row?.title?.trim() || readActStr(c, 'eventTitle') || 'ANVL event',
    intro: row?.body?.trim() || row?.subtitle?.trim() || '',
    eventTitle: readActStr(c, 'eventTitle') || row?.title?.trim() || '',
    startsAtIso: readActStr(c, 'startsAtIso'),
    endsAtIso: readActStr(c, 'endsAtIso'),
    location: readActStr(c, 'location'),
    linkHref: readActStr(c, 'linkHref'),
    rules: readActStr(c, 'rules'),
    cta: {
      label: ctaPartial.label ?? 'Learn more',
      href: ctaPartial.href ?? (readActStr(c, 'linkHref') || '#'),
    },
  }
}

export function previewFinalCtaFields(row: LandingAct | undefined): {
  actLabel: string
  heading: string
  intro: string
  backgroundImageUrl: string
  primaryCta: CmsCta
  secondaryCta: CmsCta
  tertiaryCta: CmsCta
} {
  const c = (row?.content ?? {}) as Record<string, unknown>
  const primary = readActCta(c, 'primaryCta')
  const secondary = readActCta(c, 'secondaryCta')
  const tertiary = readActCta(c, 'tertiaryCta')
  return {
    actLabel: row?.eyebrow?.trim() || 'Final call',
    heading: row?.title?.trim() || 'Take the oath',
    intro: row?.body?.trim() || row?.subtitle?.trim() || '',
    backgroundImageUrl: readActStr(c, 'backgroundImageUrl'),
    primaryCta: {
      label: primary.label ?? 'Shop drop',
      href: primary.href ?? '/shop',
    },
    secondaryCta: {
      label: secondary.label ?? 'Join waitlist',
      href: secondary.href ?? '#waitlist',
    },
    tertiaryCta: {
      label: tertiary.label ?? '',
      href: tertiary.href ?? '#',
    },
  }
}

export function previewWaitlistFields(
  landing: LandingPageCmsContent['waitlist'],
  row: LandingAct | undefined,
): LandingPageCmsContent['waitlist'] {
  const c = (row?.content ?? {}) as Record<string, unknown>
  const formIntro = readActStr(c, 'formIntro')
  const introPieces = [row?.body, formIntro].filter(Boolean) as string[]
  const intro =
    introPieces.length > 0 ? introPieces.join('\n\n') : landing.intro
  return {
    ...landing,
    actLabel: row?.eyebrow ?? landing.actLabel,
    rightLabel: row?.subtitle ?? landing.rightLabel,
    heading: row?.title ?? landing.heading,
    intro,
  }
}
