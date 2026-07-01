import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AboutEditor } from '@/features/admin/about/AboutEditor'

export function AdminAboutPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout
        title="About Page"
        description="Author the cinematic About page — hero, philosophy, forge process, fun facts, and finale."
        layout="workspace"
      >
        <AboutEditor />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
