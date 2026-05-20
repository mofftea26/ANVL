import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import {
  getGlobalBrandSettings,
  saveGlobalBrandSettingsAsync,
} from '@/features/admin/global-brand/globalBrand.service'
import { subscribeGlobalBrandChange } from '@/features/admin/global-brand/globalBrand.storage'
import { Button } from '@/shared/components/ui/Button'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'

export function AdminThemePageRoute() {
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
    void (async () => {
      try {
        await saveGlobalBrandSettingsAsync(settings)
        toast.success('Global emblem fallbacks saved.')
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not save brand fallbacks.'
        toast.error(message)
      }
    })()
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

      <AdminCard title="Crest fallbacks" description="Used while an active drop hydrates, or when a drop omits emblem paths. Empty fields default to the bundled ANVL crest.">
        <div className="grid gap-5 md:grid-cols-2">
          <MediaPickerField
            label="Default emblem"
            kind="image"
            hint="Used before the active drop emblem is known."
            value={settings.emblemFallbackUrl}
            onChange={(next) =>
              setSettings((prev) => ({
                ...prev,
                emblemFallbackUrl: next,
              }))
            }
            fallback="crest"
          />
          <MediaPickerField
            label="Loading emblem"
            kind="image"
            hint="Shown during initial mark hydration."
            value={settings.loadingEmblemFallbackUrl}
            onChange={(next) =>
              setSettings((prev) => ({
                ...prev,
                loadingEmblemFallbackUrl: next,
              }))
            }
            fallback="crest"
          />
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
