import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'

/** Stable timestamp for deterministic SSR seed snapshots. */
const SEED_NOW_ISO = '2026-01-01T00:00:00.000Z'

export const SEED_WEBSITE_LAYOUT: WebsiteLayoutContent =
  createDefaultWebsiteLayout(SEED_NOW_ISO)
