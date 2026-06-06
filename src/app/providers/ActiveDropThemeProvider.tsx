import { createContext, useContext, type PropsWithChildren } from 'react'
import type { GlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.types'
import { createDefaultGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.defaults'

const StorefrontGlobalBrandContext = createContext<GlobalBrandSettings | null>(
  null,
)

/** Published global brand from `storefront_publication` (when Supabase SSR path wins). */
export function useStorefrontPublishedGlobalBrand(): GlobalBrandSettings | null {
  return useContext(StorefrontGlobalBrandContext)
}

type Props = PropsWithChildren<{
  /** From published projection — loading emblem fallbacks match SSR without localStorage. */
  initialGlobalBrand?: GlobalBrandSettings
}>

/**
 * Provides the published global brand to the storefront chrome. The active-drop
 * `:root` palette injection was removed in the CMS teardown — the storefront now
 * uses the static theme tokens in `styles.css`.
 */
export function ActiveDropThemeProvider({
  initialGlobalBrand,
  children,
}: Props) {
  const globalBrand = initialGlobalBrand ?? createDefaultGlobalBrandSettings()

  return (
    <StorefrontGlobalBrandContext.Provider value={globalBrand}>
      {children}
    </StorefrontGlobalBrandContext.Provider>
  )
}
