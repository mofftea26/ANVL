import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import {
  DEFAULT_OATH_PRODUCT_IDS,
  createDefaultTheOathDrop,
} from '@/features/admin/drops/drops.defaults'
import type { Drop } from '@/features/drops/drop.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'

/** Stable timestamp for deterministic SSR seed snapshots. */
const SEED_NOW_ISO = '2026-01-01T00:00:00.000Z'

export const SEED_DROP: Drop = createDefaultTheOathDrop(
  [...DEFAULT_OATH_PRODUCT_IDS],
  SEED_NOW_ISO,
)

export const SEED_WEBSITE_LAYOUT: WebsiteLayoutContent =
  createDefaultWebsiteLayout(SEED_NOW_ISO)

export const SEED_LANDING_PAGE_CMS: LandingPageCmsContent =
  composeLandingPageFromDrop(SEED_DROP, SEED_WEBSITE_LAYOUT)
