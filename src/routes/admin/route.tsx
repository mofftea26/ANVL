import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AdminAuthProvider } from '@/features/admin/auth/AdminAuthProvider'

export const Route = createFileRoute('/admin')({
  component: AdminRouteShell,
})

function AdminRouteShell() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  )
}
