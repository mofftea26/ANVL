import { useEffect, type PropsWithChildren } from 'react'

import { ADMIN_STUDIO_CSS_VARS, ADMIN_STUDIO_DATA_THEME } from './adminStudioTheme'

/**
 * Applies the fixed ANVL Studio identity to `<html>` while any `/admin` route
 * is mounted — same inline-var mechanism as the storefront's SiteThemeProvider
 * (inline beats every stylesheet selector, and portalled UI — modals, drawers,
 * toasts — inherits too, since the vars live on the root element).
 *
 * No cleanup teardown is needed: navigating back to the storefront remounts
 * SiteThemeProvider, whose effect rewrites the same var vocabulary and
 * `data-theme` (both sides derive their sets from `themeConfigToCssVars`).
 */
export function AdminThemeProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', ADMIN_STUDIO_DATA_THEME)
    for (const [key, value] of Object.entries(ADMIN_STUDIO_CSS_VARS)) {
      root.style.setProperty(key, value)
    }
  }, [])

  return <>{children}</>
}
