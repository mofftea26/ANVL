import type { ComponentType, LazyExoticComponent } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { ResolvedDropAssets } from '@/features/cms/assets/resolvePublishedAssets'

export interface LandingPageThemedMarkups {
  dropLogo?: string | null
  crestSvg?: string | null
}

export interface LandingPageComponentProps {
  products: Product[]
  assets: ResolvedDropAssets
  themedMarkups?: LandingPageThemedMarkups
}

export type LandingPageComponent = ComponentType<LandingPageComponentProps>

export interface LandingPageDefinition {
  key: string
  name: string
  description: string
  previewImage: string
  isAvailable: boolean
  component: LazyExoticComponent<LandingPageComponent>
}

export type LandingPageMeta = Omit<LandingPageDefinition, 'component'>
