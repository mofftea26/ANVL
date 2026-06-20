import { gsap } from '@/shared/lib/gsap'
import type { OathMotionState } from './oathMotionState'
import { pinTrigger, type Selector } from './oathMotionHelpers'

/**
 * Scene 04 — The Arsenal (desktop/tablet). The three pieces assemble
 * **horizontally** while the section is pinned: the outer banners march in from
 * the left/right edges and the centre one drops onto the forged rail — a
 * sideways read driven by vertical scroll (the second horizontal-in-vertical
 * moment). Hovering a piece lifts the dust glint via `hoveredPiece`.
 */
export function buildOathProducts(
  host: HTMLElement,
  q: Selector,
  intensity: number,
  motion: OathMotionState,
): () => void {
  const scene = host.querySelector('[data-product-reveal]')
  if (!scene) return () => {}
  const banners = q('[data-banner]')
  if (banners.length === 0) return () => {}
  const heading = q('[data-products-heading]')
  const rail = q('[data-banner-rail]')

  banners.forEach((banner, i) => {
    const isLeft = i === 0
    const isRight = i === banners.length - 1 && banners.length > 1
    const isCenter = !isLeft && !isRight
    gsap.set(banner, {
      opacity: 0,
      transformPerspective: 1600,
      transformOrigin: 'top center',
      xPercent: isLeft ? -210 : isRight ? 210 : 0,
      yPercent: isLeft || isRight ? -12 : 42,
      rotateY: isLeft ? 48 : isRight ? -48 : 0,
      rotateX: isCenter ? -22 : isLeft ? 8 : -8,
      scale: isCenter ? 0.82 : 0.92,
    })
  })
  if (heading.length) gsap.set(heading, { opacity: 0, y: 28 })
  if (rail.length) gsap.set(rail, { scaleX: 0, transformOrigin: 'center center' })

  const tl = gsap.timeline({ scrollTrigger: pinTrigger(scene, 110 * intensity) })
  if (heading.length) tl.to(heading, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0)
  if (rail.length) tl.to(rail, { scaleX: 1, duration: 0.5, ease: 'power2.out' }, 0.25)
  tl.to(
    banners,
    {
      opacity: 1,
      xPercent: 0,
      yPercent: 0,
      rotateY: 0,
      rotateX: 0,
      scale: 1,
      duration: 1.05,
      ease: 'back.out(1.15)',
      stagger: { each: 0.16, from: 'edges' },
    },
    0.38,
  )

  // Hover glint — feed the hovered index to the dust field.
  const cleanups: Array<() => void> = []
  banners.forEach((banner, i) => {
    const onEnter = () => {
      motion.hoveredPiece = i
    }
    const onLeave = () => {
      if (motion.hoveredPiece === i) motion.hoveredPiece = -1
    }
    banner.addEventListener('pointerenter', onEnter, { passive: true })
    banner.addEventListener('pointerleave', onLeave, { passive: true })
    cleanups.push(() => {
      banner.removeEventListener('pointerenter', onEnter)
      banner.removeEventListener('pointerleave', onLeave)
    })
  })

  return () => {
    motion.hoveredPiece = -1
    for (const c of cleanups) c()
  }
}
