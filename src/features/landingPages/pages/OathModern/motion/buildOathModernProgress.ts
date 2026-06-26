import { ScrollTrigger } from '@/shared/lib/gsap'
import type { OathModernMotionState } from './oathModernMotionState'

/**
 * The single source of scroll truth. One **unpinned** ScrollTrigger spanning the
 * whole page maps the overall scroll fraction (0..1) into `motion.progress`,
 * which the persistent WebGL camera follows (descent → lateral → diagonal →
 * orbital → converge). Native scrolling is fully preserved — the 3D world evolves
 * as you scroll normally, no scroll-jacking, no frozen pinned view. The six
 * chapters' document order places the orbital camera phase over the Oath chapter.
 */
export function buildOathModernProgress(
  host: HTMLElement,
  motion: OathModernMotionState,
): () => void {
  const st = ScrollTrigger.create({
    trigger: host,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      motion.progress = self.progress
    },
  })
  return () => st.kill()
}
