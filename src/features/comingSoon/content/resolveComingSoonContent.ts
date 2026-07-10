import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import { resolveMediaUrl } from '@/features/cms/assets/resolvePublishedAssets'
import {
  DEFAULT_COMING_SOON_CONFIG,
  type ComingSoonConfig,
  type ComingSoonLogoVariant,
  type ComingSoonThemeVariant,
} from '@/features/cms/comingSoon/comingSoon.zod'
import { sanitizeHref } from '@/shared/lib/url'
import { resolveCountdownTargetMs } from '@/features/comingSoon/lib/countdownTarget'

/**
 * Render-ready Coming Soon content: CMS blob merged over designed defaults
 * (blank string = "use the default"), media ids resolved to URLs, social
 * hrefs sanitized, and the countdown wall-clock+timezone pair resolved to a
 * UTC target.
 */

/**
 * Bundled fallbacks (committed to `public/brand/coming-soon/`). Named to stay
 * self-descriptive when the same files are uploaded into the CMS media
 * library and assigned via `/admin/coming-soon` → Assets & look.
 */
export const COMING_SOON_DEFAULT_BACKDROP =
  '/brand/coming-soon/anvl-coming-soon-backdrop.webp'
export const COMING_SOON_DEFAULT_AMBIENT =
  '/brand/coming-soon/anvl-coming-soon-ambient.webp'
export const COMING_SOON_DEFAULT_OG_IMAGE =
  '/brand/coming-soon/anvl-coming-soon-og.webp'

export type ComingSoonSocialKind =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'email'

export type ComingSoonSocialLink = {
  kind: ComingSoonSocialKind
  href: string
  /** Accessible name, e.g. "ANVL on Instagram". */
  label: string
}

export type ResolvedComingSoonContent = {
  eyebrow: string
  headline: string
  subheadline: string
  body: string
  tagline: string
  countdown: {
    enabled: boolean
    /** UTC epoch of the launch instant; null when unset/invalid (row hides). */
    targetMs: number | null
    label: string
  }
  emailCapture: {
    enabled: boolean
    title: string
    placeholder: string
    buttonText: string
  }
  /** Sanitized, non-empty social links in display order (email always last). */
  socials: ComingSoonSocialLink[]
  supportEmail: string
  backgroundUrl: string
  ambientUrl: string
  /** Custom logo image URL — only when `logoVariant` is `custom` and resolvable. */
  logoUrl: string | null
  logoVariant: ComingSoonLogoVariant
  themeVariant: ComingSoonThemeVariant
  seo: {
    title: string
    description: string
    ogTitle: string
    ogDescription: string
    ogImageUrl: string
  }
}

const D = DEFAULT_COMING_SOON_CONFIG

function text(value: string, fallback: string): string {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function instagramUrlFromHandle(handle: string): string | null {
  const clean = handle.trim().replace(/^@/, '')
  if (!clean || !/^[\w.]+$/.test(clean)) return null
  return `https://instagram.com/${clean}`
}

function socialFromUrl(
  kind: ComingSoonSocialKind,
  raw: string,
  label: string,
): ComingSoonSocialLink | null {
  const href = sanitizeHref(raw, { allowRelative: false })
  if (!href) return null
  return { kind, href, label }
}

export function resolveComingSoonContent(
  config: ComingSoonConfig,
  mediaIndex: MediaIndexEntry[],
): ResolvedComingSoonContent {
  const media = (id: string): string | undefined =>
    resolveMediaUrl(id.trim() || undefined, mediaIndex)

  const supportEmail = text(config.supportEmail, D.supportEmail)
  const seoTitle = text(config.seoTitle, D.seoTitle)
  const seoDescription = text(config.seoDescription, D.seoDescription)

  const socials: ComingSoonSocialLink[] = []
  const instagramUrl = instagramUrlFromHandle(
    text(config.instagramHandle, D.instagramHandle),
  )
  if (instagramUrl) {
    socials.push({ kind: 'instagram', href: instagramUrl, label: 'ANVL on Instagram' })
  }
  const tiktok = socialFromUrl('tiktok', config.tiktokUrl, 'ANVL on TikTok')
  if (tiktok) socials.push(tiktok)
  const youtube = socialFromUrl('youtube', config.youtubeUrl, 'ANVL on YouTube')
  if (youtube) socials.push(youtube)
  const facebook = socialFromUrl('facebook', config.facebookUrl, 'ANVL on Facebook')
  if (facebook) socials.push(facebook)
  socials.push({
    kind: 'email',
    href: `mailto:${supportEmail}`,
    label: `Email ${supportEmail}`,
  })

  return {
    eyebrow: text(config.eyebrowText, D.eyebrowText),
    headline: text(config.headline, D.headline),
    subheadline: text(config.subheadline, D.subheadline),
    body: text(config.bodyText, D.bodyText),
    tagline: text(config.tagline, D.tagline),
    countdown: {
      enabled: config.countdownEnabled,
      targetMs: config.countdownEnabled
        ? resolveCountdownTargetMs(
            config.countdownDate,
            text(config.countdownTimezone, D.countdownTimezone),
          )
        : null,
      label: text(config.countdownLabel, D.countdownLabel),
    },
    emailCapture: {
      enabled: config.showEmailCapture,
      title: text(config.emailCaptureTitle, D.emailCaptureTitle),
      placeholder: text(config.emailCapturePlaceholder, D.emailCapturePlaceholder),
      buttonText: text(config.emailCaptureButtonText, D.emailCaptureButtonText),
    },
    socials,
    supportEmail,
    backgroundUrl: media(config.backgroundMediaId) ?? COMING_SOON_DEFAULT_BACKDROP,
    ambientUrl: media(config.ambientMediaId) ?? COMING_SOON_DEFAULT_AMBIENT,
    logoUrl:
      config.logoVariant === 'custom' ? (media(config.logoMediaId) ?? null) : null,
    logoVariant: config.logoVariant,
    themeVariant: config.themeVariant,
    seo: {
      title: seoTitle,
      description: seoDescription,
      ogTitle: text(config.ogTitle, seoTitle),
      ogDescription: text(config.ogDescription, seoDescription),
      ogImageUrl: media(config.ogImageMediaId) ?? COMING_SOON_DEFAULT_OG_IMAGE,
    },
  }
}
