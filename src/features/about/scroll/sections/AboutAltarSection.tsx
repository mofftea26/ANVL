import { Suspense, lazy, useEffect, useState } from 'react'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import type { AboutResolvedContent } from '../../content/aboutContent.defaults'
import type { AboutPageAssets } from '../../index'

const AboutAltar = lazy(() => import('../../altar/AboutAltar'))

/**
 * The finale — the interactive Forge Altar as the film's last section. The
 * experience gate already guarantees ≥1280px + no reduced motion, so the only
 * check left here is WebGL itself; without it the forge backdrop stands alone
 * as the closing frame. `buildAboutAltarPin` pins this section and ramps
 * `altarApproach` ahead of it (the mount that triggers the GLB prefetch).
 *
 * A struck orb answers through `onOrbStruck` — the scroll pulls back up to
 * that orb's chapter.
 */
export function AboutAltarSection({
  content,
  assets,
  onOrbStruck,
}: {
  content: AboutResolvedContent
  assets: AboutPageAssets
  onOrbStruck: (index: number) => void
}) {
  const [webgl, setWebgl] = useState(false)
  useEffect(() => {
    setWebgl(isWebglAvailable())
  }, [])

  return (
    <section
      data-scene="altar"
      id="about-altar"
      aria-labelledby="about-altar-heading"
      className="relative h-[100svh] overflow-hidden"
    >
      <h2 id="about-altar-heading" className="sr-only">
        The Forge Altar
      </h2>
      {webgl ? (
        <Suspense fallback={<AltarStandby backdrop={assets.forgeBackdrop} />}>
          <AboutAltar content={content} assets={assets} onOrbStruck={onOrbStruck} />
        </Suspense>
      ) : (
        <AltarStandby backdrop={assets.forgeBackdrop} />
      )}
    </section>
  )
}

/** The stage before (or without) the 3D altar — the forge holds the frame. */
function AltarStandby({ backdrop }: { backdrop?: string }) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {backdrop ? (
        <img
          src={backdrop}
          alt=""
          width={2560}
          height={1440}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover opacity-70"
          style={{ objectPosition: '50% 65%' }}
        />
      ) : (
        <div
          className="h-full w-full"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 60%, var(--color-surface-elevated,#1D1F21) 0%, var(--color-bg,#0B0B0C) 75%)',
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 58%, transparent 30%, color-mix(in srgb, var(--color-bg) 55%, transparent) 100%), linear-gradient(to bottom, color-mix(in srgb, var(--color-bg) 55%, transparent) 0%, transparent 30%, transparent 70%, var(--color-bg) 100%)',
        }}
      />
    </div>
  )
}
