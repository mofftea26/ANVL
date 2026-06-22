import type { ComponentType, LazyExoticComponent } from 'react'
import type { MediaIndexEntry } from '@/features/admin/media/mediaAssets.types'
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
  /**
   * CMS copy overrides for this page (raw slice from
   * `storefront_publication.landing_content[pageKey]`). Each page parses its
   * own slice with its own Zod schema; code defaults fill every gap.
   */
  landingContent?: Record<string, unknown>
  /** Denormalized media library index for resolving landing-content media ids. */
  mediaIndex?: MediaIndexEntry[]
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
