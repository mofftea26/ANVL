import {
  cloneLandingCmsDefaults,
  LANDING_CMS_VERSION,
} from './landingCms.defaults'
import type {
  LandingPageCmsContent,
} from './landingCms.types'
import { defaultLandingActSequence } from '@/features/admin/drops/drops.actSequence'
import {
  publicLandingActsFromSequence,
  publicLandingActsFromUnknownList,
} from '@/features/admin/drops/acts/landingActs.normalize'

/**
 * Deep-merge stored content over defaults. Each section falls back
 * to defaults whole-sale if the stored version is malformed (missing
 * keys, wrong types). Arrays are taken from the stored content if it
 * is an array, otherwise the default array is used.
 */
export function mergeLandingCmsWithDefaults(
  stored: Partial<LandingPageCmsContent> | null,
): LandingPageCmsContent {
  const defaults = cloneLandingCmsDefaults()
  if (!stored || typeof stored !== 'object') return defaults

  const merged: LandingPageCmsContent = {
    ...defaults,
    ...stored,
    version: LANDING_CMS_VERSION,
    updatedAt:
      typeof stored.updatedAt === 'string'
        ? stored.updatedAt
        : defaults.updatedAt,
    seo: { ...defaults.seo, ...(stored.seo ?? {}) },
    navigation: { ...defaults.navigation, ...(stored.navigation ?? {}) },
    hero: { ...defaults.hero, ...(stored.hero ?? {}) },
    manifesto: { ...defaults.manifesto, ...(stored.manifesto ?? {}) },
    dropReveal: {
      ...defaults.dropReveal,
      ...(stored.dropReveal ?? {}),
      dropIcon: {
        ...defaults.dropReveal.dropIcon,
        ...(stored.dropReveal?.dropIcon ?? {}),
      },
    },
    pieces: { ...defaults.pieces, ...(stored.pieces ?? {}) },
    materials: { ...defaults.materials, ...(stored.materials ?? {}) },
    waitlist: {
      ...defaults.waitlist,
      ...(stored.waitlist ?? {}),
      form: {
        ...defaults.waitlist.form,
        ...(stored.waitlist?.form ?? {}),
      },
    },
    landingActs: (() => {
      const parsed = publicLandingActsFromUnknownList(stored?.landingActs)
      if (parsed && parsed.length > 0) return parsed
      return publicLandingActsFromSequence(defaultLandingActSequence())
    })(),
  }

  return merged
}

/** Merge partial CMS JSON over defaults so imports missing new keys still validate. */
export function normalizeLandingCmsImport(raw: unknown): LandingPageCmsContent {
  if (!raw || typeof raw !== 'object') return cloneLandingCmsDefaults()
  return mergeLandingCmsWithDefaults(raw as Partial<LandingPageCmsContent>)
}
