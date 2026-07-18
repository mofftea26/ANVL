import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminGamificationPage } from '@/features/admin/gamification/AdminGamificationPage'

export function AdminGamificationPageRoute() {
  return (
    <AdminLayout
      title="Gamification"
      description="Ranks, challenges, Forge XP, and badges — the Armory's progression rules."
      layout="workspace"
    >
      <AdminGamificationPage />
    </AdminLayout>
  )
}
