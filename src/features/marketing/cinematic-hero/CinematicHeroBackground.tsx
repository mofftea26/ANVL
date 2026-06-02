import type { CinematicBackgroundMode, CinematicConfig } from './cinematicHero.types'
import { BRAND_HERO_ASSET_PATHS } from '@/features/marketing/default-landing/brandShowcaseAssets'
import { cn } from '@/shared/lib/cn'

type CinematicHeroBackgroundProps = {
  config: CinematicConfig
  className?: string
}

function gradientForge() {
  return [
    'radial-gradient(ellipse 70% 85% at 72% 38%, rgba(199, 194, 184, 0.14) 0%, transparent 58%)',
    'radial-gradient(ellipse 55% 70% at 88% 55%, rgba(120, 52, 28, 0.12) 0%, transparent 52%)',
    'linear-gradient(165deg, #0a0908 0%, #14110f 38%, #1a1512 72%, #0d0c0b 100%)',
  ].join(', ')
}

function resolveBackgroundMedia(
  mode: CinematicBackgroundMode,
  config: CinematicConfig,
): { video?: string; image?: string } {
  const first = config.sections[0]?.background
  if (mode === 'video') {
    return {
      video: first?.videoUrl || BRAND_HERO_ASSET_PATHS.warriorVideo,
      image: first?.imageUrl || BRAND_HERO_ASSET_PATHS.warrior,
    }
  }
  if (mode === 'image') {
    return { image: first?.imageUrl || BRAND_HERO_ASSET_PATHS.warrior }
  }
  return {}
}

export function CinematicHeroBackground({ config, className }: CinematicHeroBackgroundProps) {
  const mode = config.backgroundMode
  const media = resolveBackgroundMedia(mode, config)
  const overlay = config.sections[0]?.background?.overlayIntensity ?? 0.45

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}
      aria-hidden
    >
      {mode === 'gradient' || mode === 'forgeScene' ? (
        <div className="size-full" style={{ background: gradientForge() }} />
      ) : media.video ? (
        <video
          data-cinematic-hero-video
          src={media.video}
          poster={media.image}
          className="size-full object-cover object-center"
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
      ) : media.image ? (
        <img src={media.image} alt="" className="size-full object-cover" />
      ) : (
        <div className="size-full" style={{ background: gradientForge() }} />
      )}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 92% 68% at 50% 38%, transparent 0%, rgba(0,0,0,0.35) 100%)',
        }}
      />
    </div>
  )
}
