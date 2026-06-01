import { useRef } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { BRAND_SHOWCASE_MOTION } from './brandShowcaseAssets'

/** Desktop mouse tilt + image parallax for brand showcase product cards. */
export function useProductCardParallaxTilt() {
  const cardRef = useRef<HTMLElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useGSAP(
    () => {
      const card = cardRef.current
      const img = imgRef.current
      if (!card || reducedMotion) return

      const mm = gsap.matchMedia()
      mm.add(BRAND_SHOWCASE_MOTION.desktop, () => {
        const onMove = (event: MouseEvent) => {
          const rect = card.getBoundingClientRect()
          const x = (event.clientX - rect.left) / rect.width - 0.5
          const y = (event.clientY - rect.top) / rect.height - 0.5

          gsap.to(card, {
            rotateY: x * 7,
            rotateX: -y * 5,
            transformPerspective: 900,
            duration: 0.35,
            ease: 'power2.out',
          })
          if (img) {
            gsap.to(img, {
              x: x * 10,
              y: y * 8,
              duration: 0.45,
              ease: 'power2.out',
            })
          }
        }

        const onLeave = () => {
          gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.55,
            ease: 'power2.out',
          })
          if (img) {
            gsap.to(img, { x: 0, y: 0, duration: 0.55, ease: 'power2.out' })
          }
        }

        card.addEventListener('mousemove', onMove)
        card.addEventListener('mouseleave', onLeave)

        return () => {
          card.removeEventListener('mousemove', onMove)
          card.removeEventListener('mouseleave', onLeave)
        }
      })

      return () => mm.revert()
    },
    { scope: cardRef, dependencies: [reducedMotion] },
  )

  return { cardRef, imgRef }
}
