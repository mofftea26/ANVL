import { useRef } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'

const DESKTOP = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'

/**
 * Hanging-banner physics — rod stays fixed; fabric sways from the top clasp like cloth in wind.
 */
export function useKingdomBannerTilt() {
  const mountRef = useRef<HTMLElement>(null)
  const fabricRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useGSAP(
    () => {
      const mount = mountRef.current
      const fabric = fabricRef.current
      const inner = innerRef.current
      if (!mount || !fabric || reducedMotion) return

      gsap.set(fabric, { transformOrigin: '50% 0%', transformStyle: 'preserve-3d' })
      gsap.set(mount, { transformStyle: 'preserve-3d' })

      const mm = gsap.matchMedia()
      mm.add(DESKTOP, () => {
        let idleTween: gsap.core.Tween | null = gsap.to(fabric, {
          rotateZ: 1.4,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })

        const pauseIdle = () => {
          idleTween?.pause()
        }
        const resumeIdle = () => {
          idleTween?.resume()
        }

        const onMove = (event: MouseEvent) => {
          const rect = mount.getBoundingClientRect()
          const x = (event.clientX - rect.left) / rect.width - 0.5
          const y = (event.clientY - rect.top) / rect.height - 0.5

          gsap.to(fabric, {
            rotateY: x * 16,
            rotateX: -y * 7 - 2,
            rotateZ: x * 3.5,
            z: 14,
            transformPerspective: 1000,
            duration: 0.35,
            ease: 'sine.out',
            overwrite: 'auto',
          })
          if (inner) {
            gsap.to(inner, {
              x: x * 8,
              y: y * 5,
              duration: 0.42,
              ease: 'power2.out',
              overwrite: 'auto',
            })
          }
        }

        const onEnter = () => {
          pauseIdle()
          gsap.to(fabric, {
            rotateX: -4,
            z: 8,
            duration: 0.45,
            ease: 'power2.out',
          })
        }

        const onLeave = () => {
          gsap.to(fabric, {
            rotateY: 0,
            rotateX: 0,
            rotateZ: 0,
            z: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.68)',
            onComplete: resumeIdle,
          })
          if (inner) {
            gsap.to(inner, {
              x: 0,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
            })
          }
        }

        mount.addEventListener('mouseenter', onEnter)
        mount.addEventListener('mousemove', onMove)
        mount.addEventListener('mouseleave', onLeave)

        return () => {
          idleTween?.kill()
          idleTween = null
          mount.removeEventListener('mouseenter', onEnter)
          mount.removeEventListener('mousemove', onMove)
          mount.removeEventListener('mouseleave', onLeave)
        }
      })

      return () => mm.revert()
    },
    { scope: mountRef, dependencies: [reducedMotion] },
  )

  return { mountRef, fabricRef, innerRef }
}
