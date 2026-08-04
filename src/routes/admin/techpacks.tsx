import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export type AdminTechpacksSearch = {
  /** Techpack id to open on load — makes a parsed pack linkable from a review note. */
  techpack?: string
}

export const Route = createFileRoute('/admin/techpacks')({
  validateSearch: (search: Record<string, unknown>): AdminTechpacksSearch => ({
    techpack:
      typeof search.techpack === 'string' && search.techpack.length > 0
        ? search.techpack
        : undefined,
  }),
  component: lazyRouteComponent(() => import('./-adminTechpacks'), 'AdminTechpacksPageRoute'),
  pendingComponent: AdminEditorLoading,
})
