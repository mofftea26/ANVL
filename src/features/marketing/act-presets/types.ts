import type { LazyExoticComponent, JSX } from 'react'
import type { LandingAct, PublicLandingAct } from '@/features/cms/landing/landingActs.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { Product } from '@/features/products/types/product.types'

/** Act natures wired in the storefront preset registry (PR-8 + PR-9). */
export type LandingActNature =
  | 'hero'
  | 'manifesto'
  | 'storytelling'
  | 'dropReveal'
  | 'productShowcase'
  | 'materialShowcase'
  | 'specialEvent'
  | 'lookbook'
  | 'newsletterWaitlist'
  | 'finalCTA'

export const LANDING_ACT_NATURES: readonly LandingActNature[] = [
  'hero',
  'manifesto',
  'storytelling',
  'dropReveal',
  'productShowcase',
  'materialShowcase',
  'specialEvent',
  'lookbook',
  'newsletterWaitlist',
  'finalCTA',
] as const

export type ActPresetProps = {
  act: PublicLandingAct
  landing: LandingPageCmsContent
  products: Product[]
  emblemSrc?: string
  /** Drop editor draft row overlay (optional). */
  row?: LandingAct
}

export type ActPresetEntry = {
  nature: LandingActNature
  preset: string
  label: string
  component: LazyExoticComponent<(props: ActPresetProps) => JSX.Element | null>
}
