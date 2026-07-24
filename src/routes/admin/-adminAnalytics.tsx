import { AdminAnalyticsEditor } from '@/features/admin/analytics/AdminAnalyticsEditor'
import { AdminLayout } from '@/features/admin/components/AdminLayout'

export function AdminAnalyticsPageRoute() {
  return (
    <AdminLayout layout="workspace">
      <AdminAnalyticsEditor />
    </AdminLayout>
  )
}
