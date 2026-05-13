import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import {
  getGlobalBrandSettings,
  saveGlobalBrandSettings,
} from '@/features/admin/global-brand/globalBrand.service'
import { subscribeGlobalBrandChange } from '@/features/admin/global-brand/globalBrand.storage'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'

export const Route = createFileRoute('/admin/theme')({
  component: ThemeSettingsRoute,
})

function ThemeSettingsRoute() {
  return (
    <ProtectedAdminRoute>
      <ThemeSettingsPage />
    </ProtectedAdminRoute>
  )
}

function ThemeSettingsPage() {
  const [settings, setSettings] = useState(getGlobalBrandSettings)

  useEffect(() => {
    return subscribeGlobalBrandChange(() =>
      setSettings(getGlobalBrandSettings()),
    )
  }, [])

  const save = () => {
    saveGlobalBrandSettings(settings)
    toast.success('Global emblem fallbacks saved.')
  }

  return (
    <AdminLayout
      title="Theme & brand"
      description="Fallback crests when a drop omits loader paths. Live palettes always follow the active drop."
    >
      <AdminSectionHeader
        eyebrow="Fallbacks"
        title="Emblems before hydration"
        actions={
          <Button type="button" variant="primary" size="sm" onClick={save}>
            Save fallbacks
          </Button>
        }
      />

      <AdminCard title="Paths" description="Use public assets (/brand/...) or full URLs.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Default emblem">
            <Input
              value={settings.emblemFallbackUrl}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  emblemFallbackUrl: e.target.value,
                }))
              }
            />
          </FormField>
          <FormField label="Loading emblem">
            <Input
              value={settings.loadingEmblemFallbackUrl}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  loadingEmblemFallbackUrl: e.target.value,
                }))
              }
            />
          </FormField>
        </div>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Tip: Active drop visuals override these automatically. Adjust drop-level
          emblems inside each drop&apos;s Visuals tab.
        </p>
        <p className="mt-4 text-sm">
          <Link
            to="/admin/drops"
            className="font-semibold text-[var(--color-accent)] no-underline"
          >
            Go to Drops →
          </Link>
        </p>
      </AdminCard>
    </AdminLayout>
  )
}
