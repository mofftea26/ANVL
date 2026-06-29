import { useEffect, useState } from 'react'
import type { ShopConfig } from '@/features/cms/shop/shopExperience.zod'
import {
  hasStoredShopConfig,
  readShopConfigFromStorage,
  subscribeShopConfigChange,
} from '@/features/cms/shop/shopExperience.settings'

/**
 * Resolve the active Shop Experience config for the storefront.
 *
 * First render returns the SSR `initial` value (from the storefront projection)
 * so there is no hydration mismatch. After mount, the editing browser's local
 * working copy wins when present — so "save in CMS → see it on /shop" holds for
 * the editor immediately, while every other visitor sees the published value.
 */
export function useShopConfig(initial: ShopConfig): ShopConfig {
  const [config, setConfig] = useState<ShopConfig>(initial)

  useEffect(() => {
    const sync = () => {
      setConfig(hasStoredShopConfig() ? readShopConfigFromStorage() : initial)
    }
    sync()
    return subscribeShopConfigChange(sync)
  }, [initial])

  return config
}
