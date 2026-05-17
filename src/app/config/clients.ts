import type { Product, ShopDropFilterOption } from '@/features/products/types/product.types'
import type { HomePageContent, SeoContent } from '@/features/cms/types/cms.types'
import type { SiteSeoContent } from '@/features/cms/siteSeo.local'
import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import type { Drop } from '@/features/admin/drops/drops.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { WebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.types'
import type { CartLine } from '@/features/cart/types/cart.types'
import type {
  CheckoutInput,
  CheckoutOrderResult,
} from '@/features/checkout/types/checkout.types'
import type {
  Customer,
  CustomerProfileUpdate,
  Order,
} from '@/app/config/accountContracts'

export interface CommerceClient {
  /** Full shop listing — publicly visible catalog items. */
  getProducts(): Promise<Product[]>
  /** Homepage Act III–IV — limited to active drop assignment order. */
  getHomeProducts(): Promise<Product[]>
  getProductBySlug(slug: string): Promise<Product | null>
  getRelatedProducts(slug: string): Promise<Product[]>
  getShopListingCatalog(): Promise<{
    items: Product[]
    drops: ShopDropFilterOption[]
  }>
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
  getAdminDropsList(): Promise<AdminDropListItem[]>
  duplicateAdminDrop(id: string): Promise<AdminDropListItem | null>
  setAdminActiveDrop(id: string): Promise<void>
  scheduleAdminDrop(id: string, activationIso: string): Promise<void>
  archiveAdminDrop(id: string): Promise<void>
  deleteAdminDrop(id: string): Promise<void>
}

/** Per-path SEO cards for public routes — replace with CMS/API-backed documents later. */
export interface SeoClient {
  getSeoByPath(path: string): Promise<SeoContent | null>
  getSiteSeo(): Promise<SiteSeoContent>
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

/** TODO: Medusa customer + order APIs with secure server session — replace mock AccountClient. */
export interface AccountClient {
  getCustomerProfile(): Promise<Customer>
  updateCustomerProfile(input: CustomerProfileUpdate): Promise<Customer>
  listOrders(): Promise<Order[]>
  getOrderById(id: string): Promise<Order | null>
}

export type RuntimeClients = {
  cms: CmsClient
  commerce: CommerceClient
  seo: SeoClient
  siteSettings: SiteSettingsClient
  analytics: AnalyticsClient
  payment: PaymentClient
  account: AccountClient
}
