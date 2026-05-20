import type { LazyExoticComponent, JSX } from 'react'
import type { LandingAct, PublicLandingAct } from '@/features/cms/landing/landingActs.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { Product } from '@/features/products/types/product.types'

/** Act natures wired in PR-8 (storefront preset registry). */
export type LandingActNature =
  | 'hero'
  | 'manifesto'
  | 'storytelling'
  | 'dropReveal'
  | 'productShowcase'
  | 'materialShowcase'
  | 'newsletterWaitlist'

export const LANDING_ACT_NATURES: readonly LandingActNature[] = [
  'hero',
  'manifesto',
  'storytelling',
  'dropReveal',
  'productShowcase',
  'materialShowcase',
  'newsletterWaitlist',
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
  component: LazyExoticComponent<(props: ActPresetProps) => JSX.Element>
}
