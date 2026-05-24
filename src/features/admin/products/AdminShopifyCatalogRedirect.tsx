import { ExternalLink } from 'lucide-react'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { getShopifyAdminUrl } from '@/features/shopify/config/shopifyPublicEnv'
import { Button } from '@/shared/components/ui/Button'

/**
 * Catalog editing lives in Shopify Admin when Storefront API env is configured.
 */
export function AdminShopifyCatalogRedirect() {
  const productsUrl = getShopifyAdminUrl('/products')
  const collectionsUrl = getShopifyAdminUrl('/collections')

  return (
    <AdminLayout
      title="Catalog"
      description="Products, variants, inventory, and pricing are managed in Shopify."
    >
      <AdminSectionHeader
        title="Shopify catalog"
        description="Link products to drops using the `anvl.drop_ids` metafield in Shopify. The storefront reads live catalog data from the Storefront API."
      />
      <AdminCard className="space-y-4 p-6">
        <p className="text-sm text-[var(--color-text-muted)]">
          ANVL CMS keeps campaigns (drops, landing, header/footer, theme). Commerce
          truth — SKUs, stock, checkout — stays in Shopify so operations stay mature
          and secure.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {productsUrl ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => window.open(productsUrl, '_blank', 'noopener,noreferrer')}
            >
              Open products in Shopify
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Set <span className="font-mono text-xs">VITE_SHOPIFY_STORE_DOMAIN</span>{' '}
              in your <span className="font-mono text-xs">.env</span> to enable the
              admin link.
            </p>
          )}
          {collectionsUrl ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                window.open(collectionsUrl, '_blank', 'noopener,noreferrer')
              }
            >
              Collections
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </AdminCard>
    </AdminLayout>
  )
}
