import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPassportsEditor } from '@/features/admin/passports/AdminPassportsEditor'

export function AdminPassportsPageRoute() {
  return (
    <AdminLayout
      title="Passports"
      description="Generate and track per-unit QR product passports."
      layout="workspace"
    >
      <AdminPassportsEditor />
    </AdminLayout>
  )
}
