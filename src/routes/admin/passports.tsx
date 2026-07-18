import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export type AdminPassportsSearch = {
  /** Tab to open — QR code ledger or per-product passport content. */
  tab?: 'codes' | 'content'
  /** Product slug — with `tab: 'content'`, opens that product's wizard. */
  product?: string
}

export const Route = createFileRoute('/admin/passports')({
  validateSearch: (search: Record<string, unknown>): AdminPassportsSearch => ({
    tab: search.tab === 'codes' || search.tab === 'content' ? search.tab : undefined,
    product:
      typeof search.product === 'string' && search.product.length > 0
        ? search.product
        : undefined,
  }),
  component: lazyRouteComponent(() => import('./-adminPassports'), 'AdminPassportsPageRoute'),
})
