import { useEffect } from 'react'
import { criticalOathAssets } from '../theOathAssets'

/**
 * Warms the critical above-the-fold assets after mount (client only). Only
 * touches assets that actually exist, so missing files are never requested.
 * Heavy below-the-fold media is left to lazy loading inside MediaPlane.
 */
export function usePreloadLandingAssets() {
  useEffect(() => {
    const assets = criticalOathAssets()
    if (assets.length === 0) return
    const images = assets.map((src) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = src
      return img
    })
    return () => {
      images.forEach((img) => {
        img.src = ''
      })
    }
  }, [])
}
