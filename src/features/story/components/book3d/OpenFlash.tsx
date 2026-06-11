import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { hexToRgb, makeRadialGlow } from '@/features/story/lib/bookTextures'

interface OpenFlashProps {
  /** Foil colour — the flash is tinted to match the book. */
  color: string
  /** Bumped to (re)play the flash. */
  seq: number
}

/**
 * A soft additive bloom that blooms outward as the cover opens — it masks the
 * closed→open swap and gives the opening a "magical" beat. Plays once per `seq`.
 */
export function OpenFlash({ color, seq }: OpenFlashProps) {
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const t = useRef(1)
  const texture = useMemo(() => makeRadialGlow(hexToRgb(color)), [color])
  useEffect(() => () => texture.dispose(), [texture])

  useEffect(() => {
    if (seq > 0) t.current = 0
  }, [seq])

  useFrame((_state, delta) => {
    const m = mesh.current
    if (!m) return
    if (t.current >= 1) {
      m.visible = false
      return
    }
    t.current = Math.min(1, t.current + delta / 0.7)
    const p = t.current
    m.visible = true
    const s = 0.6 + p * 2.6
    m.scale.setScalar(s)
    if (mat.current) mat.current.opacity = (1 - p) * 0.5
  })

  return (
    <mesh ref={mesh} position={[0, 0, 0.9]} visible={false}>
      <planeGeometry args={[2.4, 2.4]} />
      <meshBasicMaterial
        ref={mat}
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
