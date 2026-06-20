import { type ReactNode, useMemo } from 'react'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { readThemeCssColor } from '@/shared/lib/themeColor'

interface StudioStageProps {
  children: ReactNode
  /** Y position of the soft ground shadow (book sits just above it). */
  shadowY?: number
  shadowOpacity?: number
}

/**
 * Shared studio lighting rig for the chapter books — image-based lighting from a
 * baked set of soft lightformers (no HDR download) plus a soft contact shadow.
 * This is what gives the cloth + foil + gilded edges their premium Stripe-Press
 * sheen and grounding.
 */
export function StudioStage({
  children,
  shadowY = -1.15,
  shadowOpacity = 0.5,
}: StudioStageProps) {
  // The warm rim light follows the active theme ember so the studio reflections
  // on the cover/foil complement the CMS theme (key + fill stay neutral-warm so
  // the parchment pages remain legible).
  const emberLight = useMemo(() => readThemeCssColor('--color-highlight', '#ff7a2a'), [])
  return (
    <>
      <ambientLight intensity={0.32} color="#fbeede" />
      <directionalLight position={[2.5, 4, 3]} intensity={1.1} color="#fff4e6" />

      {/* Baked studio environment — drives reflections on the cover + foil. */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          intensity={2.2}
          form="rect"
          position={[0, 2.6, 2.2]}
          scale={[7, 5, 1]}
          color="#fff3e8"
        />
        <Lightformer
          intensity={1.3}
          form="rect"
          position={[-3.4, 1, 1.4]}
          scale={[4, 5, 1]}
          color="#9fb6d6"
        />
        <Lightformer
          intensity={2.6}
          form="rect"
          position={[3, 1.4, -1.8]}
          scale={[3, 4, 1]}
          color={emberLight}
        />
        <Lightformer
          intensity={0.9}
          form="circle"
          position={[0, -2, 1]}
          scale={[3, 3, 1]}
          color="#5b5e61"
        />
      </Environment>

      <ContactShadows
        position={[0, shadowY, 0]}
        opacity={shadowOpacity}
        scale={11}
        blur={2.8}
        far={4.5}
        resolution={1024}
        color="#000000"
      />

      {children}
    </>
  )
}
