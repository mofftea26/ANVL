import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { AboutScrollMotion } from '../motion/aboutMotionState'
import { ABOUT_DEPTH } from './aboutDepthPath'

/**
 * The film's camera — scroll IS the dolly. `scrollDepth` (written by the
 * film-wide ScrollTrigger) maps onto a straight z path through the dust and
 * atmosphere; the pointer adds the same gentle parallax the altar's old rig
 * had, and everything lerps so scrub jitter never reaches the lens. The look
 * target rides `lookAhead` units down the path — the camera always faces
 * where the journey is going, which at `scrollDepth = 1` is exactly the
 * altar stage's seat.
 *
 * Reads the mutable motion state only — zero React state in the loop.
 */
export function AboutDepthRig({ motion }: { motion: AboutScrollMotion }) {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3())

  useFrame((_frame, delta) => {
    const k = Math.min(1, delta * ABOUT_DEPTH.lerp)
    const z =
      ABOUT_DEPTH.cameraStartZ +
      (ABOUT_DEPTH.cameraEndZ - ABOUT_DEPTH.cameraStartZ) * motion.scrollDepth

    camera.position.z += (z - camera.position.z) * k
    camera.position.x += (motion.pointerX * ABOUT_DEPTH.parallaxX - camera.position.x) * k
    camera.position.y +=
      (ABOUT_DEPTH.cameraHeight + motion.pointerY * ABOUT_DEPTH.parallaxY - camera.position.y) * k

    look.current.set(0, ABOUT_DEPTH.lookHeight, camera.position.z - ABOUT_DEPTH.lookAhead)
    camera.lookAt(look.current)
  })
  return null
}
