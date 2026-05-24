import { AdminCard } from '@/features/admin/components/AdminCard'
import type { SiteSeoGlobalDefaults } from '@/features/cms/siteSeo.local'
import { SeoFieldsGroup } from './siteSeoEditor.shared'

export function SiteSeoGlobalPanel({
  defaults,
  onChange,
}: {
  defaults: SiteSeoGlobalDefaults
  onChange: (patch: Partial<SiteSeoGlobalDefaults>) => void
}) {
  return (
    <AdminCard title="Global defaults">
      <SeoFieldsGroup
        value={defaults}
        onChange={onChange}
        includeDefaultShareImage
        includeStructuredData
      />
    </AdminCard>
  )
}
