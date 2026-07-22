import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'
import { StoryEditor } from '@/features/admin/story/StoryEditor'

export function AdminStoryPageRoute() {
  return (
    <AdminLayout layout="workspace">
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'site:page' }}>
        <StoryEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
