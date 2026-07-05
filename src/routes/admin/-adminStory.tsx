import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { StoryEditor } from '@/features/admin/story/StoryEditor'

export function AdminStoryPageRoute() {
  return (
    <AdminLayout
      title="Story"
      description="Author the saga — chapters (drops), acts, and the army cast."
      layout="workspace"
    >
      <StoryEditor />
    </AdminLayout>
  )
}
