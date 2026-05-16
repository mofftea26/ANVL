import type { Product } from '@/features/products/types/product.types'
import type { HomePageContent, SeoContent } from '@/features/cms/types/cms.types'
import type { LandingPageCmsContent } from '@/features/admin/landing-cms/landingCms.types'
import type { WebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.types'
import type { CartLine } from '@/features/cart/types/cart.types'
import type {
  CheckoutInput,
  CheckoutOrderResult,
} from '@/features/checkout/types/checkout.types'

export interface CommerceClient {
  /** Full shop listing — publicly visible catalog items. */
  getProducts(): Promise<Product[]>
  /** Homepage Act III–IV — limited to active drop assignment order. */
  getHomeProducts(): Promise<Product[]>
  getProductBySlug(slug: string): Promise<Product | null>
  getRelatedProducts(slug: string): Promise<Product[]>
}

export interface CmsClient {
  getLandingCmsContent(): Promise<LandingPageCmsContent>
  getHomepageContent(): Promise<HomePageContent>
  getAnnouncementBar(): Promise<{ message: string; ctaLabel: string; ctaHref: string }>
  getNavigation(): Promise<Array<{ label: string; href: string }>>
  getCampaigns(): Promise<Array<{ id: string; title: string; description: string }>>
  getLookbook(): Promise<Array<{ id: string; alt: string; src: string }>>
}

/** Per-path SEO cards for public routes — replace with CMS/API-backed documents later. */
export interface SeoClient {
  getSeoByPath(path: string): Promise<SeoContent | null>
}

/** Site chrome (header/footer layout) separate from page-level landing CMS. */
export interface SiteSettingsClient {
  getWebsiteLayout(): Promise<WebsiteLayoutContent>
}

export interface AnalyticsClient {
  trackPageView(payload: { path: string; title?: string }): void
  trackProductView(payload: { slug: string; name: string }): void
  trackAddToCart(payload: { productId: string; quantity: number; price: number }): void
  trackBeginCheckout(payload: { lineCount: number; subtotal: number }): void
  trackOrderPlaced(payload: { orderId: string; total: number }): void
  trackWaitlistSignup(payload: { email: string; preferredProduct?: string }): void
}

export interface PaymentClient {
  placeOrder(input: CheckoutInput, lines: CartLine[]): Promise<CheckoutOrderResult>
}

export type RuntimeClients = {
  cms: CmsClient
  commerce: CommerceClient
  seo: SeoClient
  siteSettings: SiteSettingsClient
  analytics: AnalyticsClient
  payment: PaymentClient
}
