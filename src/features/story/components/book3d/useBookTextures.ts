import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import {
  makeClothTexture,
  makePageEdgeTexture,
  makeParchmentTexture,
} from '@/features/story/lib/bookTextures'

export interface BookTextures {
  cloth: THREE.CanvasTexture
  parchment: THREE.CanvasTexture
  pageEdge: THREE.CanvasTexture
}

/** Memoized procedural textures for one book scene, disposed on unmount. */
export function useBookTextures(): BookTextures {
  const textures = useMemo<BookTextures>(
    () => ({
      cloth: makeClothTexture(),
      parchment: makeParchmentTexture(),
      pageEdge: makePageEdgeTexture(),
    }),
    [],
  )

  useEffect(() => {
    return () => {
      textures.cloth.dispose()
      textures.parchment.dispose()
      textures.pageEdge.dispose()
    }
  }, [textures])

  return textures
}

/**
 * Loads an external image (e.g. a CMS cover) into a texture without suspending —
 * returns `null` until ready and stays `null` on error, so a failed/CORS-blocked
 * cover never crashes the canvas (the cloth cover shows instead).
 */
export function useImageTexture(src: string | null): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if (!src) {
      setTexture(null)
      return
    }
    let active = true
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      src,
      (tex) => {
        if (!active) {
          tex.dispose()
          return
        }
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 8
        setTexture(tex)
      },
      undefined,
      () => {
        if (active) setTexture(null)
      },
    )
    return () => {
      active = false
    }
  }, [src])

  useEffect(() => {
    return () => {
      texture?.dispose()
    }
  }, [texture])

  return texture
}
