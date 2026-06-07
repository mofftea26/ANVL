import type { WebsiteNavigationContent } from '@/features/cms/navigation/websiteNavigation'

/**
 * Storefront nav is code-owned. SSR loader passes the static shell; this hook
 * is a pass-through so routes can keep a stable API without Supabase/layout reads.
 */
export function useWebsiteNavigation(
  navigation: WebsiteNavigationContent,
): WebsiteNavigationContent {
  return navigation
}
