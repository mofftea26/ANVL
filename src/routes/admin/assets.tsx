import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export type AdminAssetsSearch = {
  /** Slot scope to open — 'general', a landing key, or a storefront page key. */
  page?: string
  /** Slot key to scroll to + highlight inside the assignment panel. */
  slot?: string
  /** Initial media-library search text (deep links filter by filename prefix). */
  q?: string
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export const Route = createFileRoute('/admin/assets')({
  validateSearch: (search: Record<string, unknown>): AdminAssetsSearch => ({
    page: optionalString(search.page),
    slot: optionalString(search.slot),
    q: optionalString(search.q),
  }),
  component: lazyRouteComponent(
    () => import('./-adminAssets'),
    'AdminAssetsPageRoute',
  ),
  pendingComponent: AdminEditorLoading,
})
