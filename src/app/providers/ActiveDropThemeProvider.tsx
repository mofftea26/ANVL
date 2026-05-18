import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { subscribeDropsChange } from '@/features/cms/read/cmsSubscriptions'
import {
  ACTIVE_DROP_THEME_STYLE_ID,
  serializeDropPaletteForRootStyle,
} from '@/features/cms/theme/dropPaletteStyle'
import { runtimeClients } from '@/app/config/runtime'
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
}>

/**
 * Owns the public `:root` palette `<style>` for the active drop and keeps it
 * in sync when local CMS drop storage changes (no reliance on parent loader re-runs).
 */
export function ActiveDropThemeProvider({
  initialDrop,
  initialGlobalBrand,
  children,
}: Props) {
  const [drop, setDrop] = useState<Drop | null>(initialDrop)
  const [globalBrand] = useState<GlobalBrandSettings>(() =>
    initialGlobalBrand ?? createDefaultGlobalBrandSettings(),
  )

  useEffect(() => {
    setDrop(initialDrop)
  }, [initialDrop])

  useEffect(() => {
    return subscribeDropsChange(() => {
      void runtimeClients.cms.getActiveDrop().then(setDrop)
    })
  }, [])

  const themeCss =
    drop?.theme != null ? serializeDropPaletteForRootStyle(drop.theme) : null

  return (
    <StorefrontGlobalBrandContext.Provider value={globalBrand}>
      {themeCss ? (
        <style
          id={ACTIVE_DROP_THEME_STYLE_ID}
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      ) : null}
      {children}
    </StorefrontGlobalBrandContext.Provider>
  )
}
