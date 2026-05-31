import { HeroForgeSequence } from '@/features/marketing/components/HeroForgeSequence'

import { previewHeroFields } from '@/features/cms/landing/landingActPreviewOverlay'

import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'

import {

  normalizeActMotionType,

  resolveActAnimation,

} from '../shared/actAnimationConfig'

import { hasActRowMedia } from '../shared/actPresetUtils'

import type { ActPresetProps } from '../types'



/** Default hero — wraps the forged cinematic sequence. */

export function TheOathCinematicPreset({

  landing,

  row,

  emblemSrc,

}: ActPresetProps) {

  const hero = previewHeroFields(landing.hero, row)

  const animation = resolveActAnimation(row)

  const showCampaignMark = !hasActRowMedia(row)



  return (

    <div className="relative">

      <ActMediaBackdrop row={row} />

      <HeroForgeSequence

        badgeText={hero.badgeText}

        title={hero.title}

        subtitle={hero.subtitle}

        primaryCta={hero.primaryCta}

        secondaryCta={hero.secondaryCta}

        meta={hero.meta}

        emblemSrc={showCampaignMark ? emblemSrc : undefined}

        countdownTargetIso={hero.countdownTargetIso}

        motionType={normalizeActMotionType(animation.type)}

        motionEnabled={animation.enabled}

        motionIntensity={animation.intensity}

      />

    </div>

  )

}

