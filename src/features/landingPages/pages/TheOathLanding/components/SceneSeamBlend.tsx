import { cn } from '@/shared/lib/cn'

type SceneSeamBlendProps = {
  edge: 'top' | 'bottom'
  className?: string
}

const SEAM_GRADIENT = {
  top: 'linear-gradient(180deg, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 78%, transparent) 28%, color-mix(in srgb, var(--color-bg) 32%, transparent) 52%, transparent 100%)',
  bottom:
    'linear-gradient(0deg, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 78%, transparent) 28%, color-mix(in srgb, var(--color-bg) 32%, transparent) 52%, transparent 100%)',
}

/** Soft edge fade so adjacent scenes melt into one continuous scroll. */
export function SceneSeamBlend({ edge, className }: SceneSeamBlendProps) {
  return (
    <div
      aria-hidden="true"
      data-scene-seam={edge}
      className={cn(
        'pointer-events-none absolute inset-x-0 z-[3] h-[min(16rem,24%)]',
        edge === 'top' ? 'top-0' : 'bottom-0',
        className,
      )}
      style={{ background: SEAM_GRADIENT[edge] }}
    />
  )
}
