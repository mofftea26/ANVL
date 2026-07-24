import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

// Trailing `_` on `passports_` opts this route OUT of nesting under
// `passports.tsx` (which is a leaf with no <Outlet/>) — it is a standalone
// route at `/admin/passports/content/$slug`, while the URL prefix still maps to
// the Passports nav item for breadcrumbs + active state.
export const Route = createFileRoute('/admin/passports_/content/$slug')({
  component: lazyRouteComponent(
    () => import('./-adminPassportContent'),
    'AdminPassportContentPageRoute',
  ),
  pendingComponent: AdminEditorLoading,
})
