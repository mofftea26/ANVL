import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminGamificationPage } from '@/features/admin/gamification/AdminGamificationPage'

export function AdminGamificationPageRoute() {
  return (
    <AdminLayout layout="workspace">
      <AdminGamificationPage />
    </AdminLayout>
  )
}
