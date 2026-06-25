import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { ExperienceConfig } from './experience.types'
import { resolveExperience } from './experienceRegistry'

const ExperienceContext = createContext<ExperienceConfig | null>(null)

/**
 * Provides the resolved {@link ExperienceConfig} to the whole storefront tree.
 *
 * `activeLandingPageKey` comes from the SSR storefront projection (already
 * resolved in the root loader), so the value is identical on server and client —
 * no refetch, no hydration mismatch.
 *
 * The `data-experience` attribute is rendered on a `display:contents` wrapper
 * (not `<html>`) so it scopes the experience CSS layer to the **storefront**
 * subtree only — the admin CMS never renders this provider, so it is never
 * re-skinned. `display:contents` keeps the wrapper out of layout, so fixed nav
 * and grid flow are unaffected.
 */
export function ExperienceProvider({
  activeLandingPageKey,
  children,
}: {
  activeLandingPageKey: string | null | undefined
  children: ReactNode
}) {
  const value = useMemo(
    () => resolveExperience(activeLandingPageKey),
    [activeLandingPageKey],
  )

  return (
    <ExperienceContext.Provider value={value}>
      <div data-experience={value.key} style={{ display: 'contents' }}>
        {children}
      </div>
    </ExperienceContext.Provider>
  )
}

/**
 * Read the active experience config. Falls back to the classic Oath experience
 * when used outside a provider (e.g. isolated tests) so components never crash.
 */
export function useExperience(): ExperienceConfig {
  return useContext(ExperienceContext) ?? resolveExperience('the-oath')
}
