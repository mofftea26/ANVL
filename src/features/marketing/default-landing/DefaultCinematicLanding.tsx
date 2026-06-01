import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { Product } from '@/features/products/types/product.types'
import { BrandShowcaseExperience } from './BrandShowcaseExperience'

export type DefaultCinematicLandingProps = {
  landing: LandingPageCmsContent
  products: Product[]
}

/**
 * Default homepage — cinematic 3D scroll brand showcase (not oath act panels).
 */
export function DefaultCinematicLanding(props: DefaultCinematicLandingProps) {
  return <BrandShowcaseExperience {...props} />
}
