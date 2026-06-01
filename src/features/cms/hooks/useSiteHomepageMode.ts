import { useEffect, useState } from 'react'
import {
  readSiteHomepageFromStorage,
  SITE_HOMEPAGE_CHANGE_EVENT,
  type HomepageMode,
  type SiteHomepageSettings,
} from '@/features/cms/siteHomepage.settings'

export function useSiteHomepageMode(
  ssr?: SiteHomepageSettings,
): SiteHomepageSettings {
  const [settings, setSettings] = useState<SiteHomepageSettings>(
    () => ssr ?? readSiteHomepageFromStorage(),
  )

  useEffect(() => {
    const onChange = () => setSettings(readSiteHomepageFromStorage())
    window.addEventListener(SITE_HOMEPAGE_CHANGE_EVENT, onChange)
    return () => window.removeEventListener(SITE_HOMEPAGE_CHANGE_EVENT, onChange)
  }, [])

  return settings
}

export function useHomepageMode(ssr?: HomepageMode): HomepageMode {
  return useSiteHomepageMode(
    ssr ? { mode: ssr, updatedAt: '' } : undefined,
  ).mode
}
