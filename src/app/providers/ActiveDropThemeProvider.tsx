import { createContext, useContext, type PropsWithChildren } from 'react'
import {
  ACTIVE_DROP_THEME_STYLE_ID,
  serializeDropPaletteForRootStyle,
} from '@/features/cms/theme/dropPaletteStyle'
import { useActiveDrop } from '@/features/drops/hooks/useActiveDrop'
import type { Drop } from '@/features/drops/drop.types'
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
  initialDrop: Drop | null
  /** From published projection — loading emblem fallbacks match SSR without localStorage. */
  initialGlobalBrand?: GlobalBrandSettings
  /** When false, skip injecting the active drop palette onto `:root`. */
  applyDropTheme?: boolean
}>

/**
 * Owns the public `:root` palette `<style>` for the active drop. With Supabase,
 * palette tracks the published snapshot (same source as the landing page).
 */
export function ActiveDropThemeProvider({
  initialDrop,
  initialGlobalBrand,
  applyDropTheme = true,
  children,
}: Props) {
  const drop = useActiveDrop(initialDrop)
  const globalBrand = initialGlobalBrand ?? createDefaultGlobalBrandSettings()

  const themeCss =
    applyDropTheme && drop?.theme != null
      ? serializeDropPaletteForRootStyle(drop.theme)
      : null

  return (
    <StorefrontGlobalBrandContext.Provider value={globalBrand}>
      {themeCss && drop ? (
        <style
          id={ACTIVE_DROP_THEME_STYLE_ID}
          key={`${drop.id}:${drop.updatedAt}`}
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      ) : null}
      {children}
    </StorefrontGlobalBrandContext.Provider>
  )
}
