import type { Product } from '@/features/products/types/product.types'
import type { HomePageContent, SeoContent } from '@/features/cms/types/cms.types'
import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import type { Drop } from '@/features/admin/drops/drops.types'
import type { LandingPageCmsContent } from '@/features/admin/landing-cms/landingCms.types'
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
  /** Active campaign drop for storefront theming and `/drop/:slug`; null when none. */
  getActiveDrop(): Promise<Drop | null>
  getLandingCmsContent(): Promise<LandingPageCmsContent>
  getHomepageContent(): Promise<HomePageContent>
  getAnnouncementBar(): Promise<{ message: string; ctaLabel: string; ctaHref: string }>
  getNavigation(): Promise<Array<{ label: string; href: string }>>
  getCampaigns(): Promise<Array<{ id: string; title: string; description: string }>>
  getLookbook(): Promise<Array<{ id: string; alt: string; src: string }>>
  getSeoByPath(path: string): Promise<SeoContent | null>
  getAdminDropsList(): Promise<AdminDropListItem[]>
  duplicateAdminDrop(id: string): Promise<AdminDropListItem | null>
  setAdminActiveDrop(id: string): Promise<void>
  scheduleAdminDrop(id: string, activationIso: string): Promise<void>
  archiveAdminDrop(id: string): Promise<void>
  deleteAdminDrop(id: string): Promise<void>
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
