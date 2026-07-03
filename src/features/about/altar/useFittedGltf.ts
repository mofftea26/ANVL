import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

export interface FittedGltf {
  /** Cloned scene, re-centered on its bounding-box centre. */
  object: THREE.Object3D
  /** Uniform scale that fits the largest dimension to `targetSize`. */
  scale: number
  /** Pre-scale bounding-box size (multiply by `scale` for world units). */
  size: THREE.Vector3
}

/**
 * Load + normalize an arbitrary GLB (CMS uploads have unknown units): clone
 * the scene, center it on its bounding-box centre, and compute the uniform
 * scale that fits its largest dimension to `targetSize` world units. Mount as
 * `<group scale={scale}><primitive object={object} /></group>`.
 */
export function useFittedGltf(url: string, targetSize: number): FittedGltf {
  const { scene } = useGLTF(url)
  return useMemo(() => {
    const object = scene.clone(true)
    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    object.position.sub(center)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    return { object, scale: targetSize / maxDim, size }
  }, [scene, targetSize])
}
