import { motion } from 'framer-motion'
import { AnvlLogoImage } from '@/shared/components/brand/AnvlLogoImage'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { cn } from '@/shared/lib/cn'

const SPIN_S = 22

export function HeroSpinningMark({ className }: { className?: string }) {
  const reduced = useReducedMotion()

  return (
    <div
      className={cn(
        'w-full [perspective:1600px] [perspective-origin:32%_45%] lg:[perspective-origin:22%_45%]',
        className,
      )}
      aria-hidden
    >
      <motion.div
        className="relative mx-auto w-fit origin-center will-change-transform [transform-style:preserve-3d] lg:mx-0"
        initial={false}
        animate={reduced ? { rotateY: 0 } : { rotateY: 360 }}
        transition={{ duration: SPIN_S, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="relative w-fit [transform:translateZ(22px)] [transform-style:preserve-3d]"
          style={{
            filter:
              'drop-shadow(0 28px 42px rgba(0,0,0,0.5)) drop-shadow(0 10px 20px rgba(0,0,0,0.35)) drop-shadow(4px 0 1px rgba(0,0,0,0.12))',
          }}
        >
          <AnvlLogoImage
            variant="mark"
            ink="dark"
            decorative
            fetchPriority="high"
            className="h-44 w-auto max-w-[min(100%,34rem)] md:h-56 lg:h-[17.5rem] xl:h-[21rem]"
          />
        </div>
      </motion.div>
    </div>
  )
}
