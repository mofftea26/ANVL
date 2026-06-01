import { useRouterState } from '@tanstack/react-router'
import type { HomepageMode } from '@/features/cms/siteHomepage.settings'
import { useHomepageMode } from '@/features/cms/hooks/useSiteHomepageMode'

/** True when `/` is in brand showcase mode (no chrome, default palette). */
export function useBrandShowcaseShell(ssrMode?: HomepageMode): boolean {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const homepageMode = useHomepageMode(ssrMode)
  return pathname === '/' && homepageMode === 'default'
}
