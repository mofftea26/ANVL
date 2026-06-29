import type { Product, ShopDropFilterOption } from '@/features/products/types/product.types'
import type { SeoContent } from '@/features/cms/types/cms.types'
import type { SiteSeoContent } from '@/features/cms/siteSeo.local'
import type { SiteHomepageSettings } from '@/features/cms/siteHomepage.settings'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'
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
import type { StoryChapter } from '@/features/story/schemas/story.schema'

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
  /**
   * Create a hosted checkout from the current cart lines and return its redirect
   * URL. Returns `null` when no hosted checkout is available (seed/local
   * adapters), signalling the caller to use the internal checkout flow.
   */
  startCheckout(lines: CartLine[]): Promise<string | null>
}

export interface CmsClient {
  getAnnouncementBar(): Promise<{ message: string; ctaLabel: string; ctaHref: string }>
  getNavigation(): Promise<Array<{ label: string; href: string }>>
  getCampaigns(): Promise<Array<{ id: string; title: string; description: string }>>
  getLookbook(): Promise<Array<{ id: string; alt: string; src: string }>>
  /** Published homepage extras (campaign/lookbook routing metadata). */
  getSiteHomepage(): Promise<SiteHomepageSettings>
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

/** Published Story saga (chapters → acts → cast) for the `/story` page. */
export interface StoryClient {
  /** Ordered, published chapters with their acts + cast. */
  getPublishedChapters(): Promise<StoryChapter[]>
  getChapterBySlug(slug: string): Promise<StoryChapter | null>
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
  story: StoryClient
  analytics: AnalyticsClient
  payment: PaymentClient
  account: AccountClient
}
