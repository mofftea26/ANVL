import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { StoryEditor } from '@/features/admin/story/StoryEditor'

export function AdminStoryPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout
        title="Story"
        description="Author the saga — chapters (drops), acts, and the army cast."
      >
        <StoryEditor />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
