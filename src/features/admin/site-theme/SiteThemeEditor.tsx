import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminButtonVariants } from '@/features/admin/components/AdminButton'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminSaveBar } from '@/features/admin/components/AdminSaveBar'
import {
  ensureDropSystemHydrated,
  getActiveDrop,
} from '@/features/admin/drops/drops.service'
import {
  getGlobalBrandSettings,
  saveGlobalBrandSettingsAsync,
} from '@/features/admin/global-brand/globalBrand.service'
import type { GlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.types'
import { subscribeGlobalBrandChange } from '@/features/admin/global-brand/globalBrand.storage'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  fetchStorefrontPublicationView,
  STOREFRONT_PUBLICATION_QUERY_KEY,
} from '@/features/cms/hooks/storefrontPublicationQuery'
import type { DropThemePalette } from '@/features/drops/theme/dropThemePalette.types'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'
import { cn } from '@/shared/lib/cn'
import { isValidColor, parseColor, rgbaToCss } from '@/shared/lib/color'

export function SiteThemeEditor() {
  const [settings, setSettings] = useState<GlobalBrandSettings>(() =>
    getGlobalBrandSettings(),
  )
  const [saving, setSaving] = useState(false)
  const [localDropTitle, setLocalDropTitle] = useState<string | null>(null)
  const [localPalette, setLocalPalette] = useState<DropThemePalette | null>(null)

  const supabaseConfigured = Boolean(getSupabasePublicEnv())

  const publishedDropQuery = useQuery({
    queryKey: STOREFRONT_PUBLICATION_QUERY_KEY,
    queryFn: fetchStorefrontPublicationView,
    enabled: supabaseConfigured,
    select: (view) => view?.projection.drop ?? null,
    staleTime: 30_000,
  })

  useEffect(() => {
    return subscribeGlobalBrandChange(() =>
      setSettings(getGlobalBrandSettings()),
    )
  }, [])

  useEffect(() => {
    ensureDropSystemHydrated()
    const drop = getActiveDrop()
    setLocalDropTitle(drop?.title?.trim() || null)
    setLocalPalette(drop?.theme ?? null)
  }, [])

  const activePalette =
    publishedDropQuery.data?.theme ?? localPalette ?? null

  const paletteLabel = useMemo(() => {
    if (publishedDropQuery.data?.title?.trim()) {
      return publishedDropQuery.data.title.trim()
    }
    if (localDropTitle) return localDropTitle
    return null
  }, [publishedDropQuery.data, localDropTitle])

  const save = useCallback(() => {
    void (async () => {
      setSaving(true)
      try {
        await saveGlobalBrandSettingsAsync(settings)
        toast.success('Brand fallbacks saved.')
        setSettings(getGlobalBrandSettings())
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not save brand fallbacks.'
        toast.error(message)
      } finally {
        setSaving(false)
      }
    })()
  }, [settings])

  return (
    <div className="space-y-6" data-testid="site-theme-editor">
      <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 px-4 py-3 text-sm text-[var(--color-text-muted)]">
        These show before the active drop loads.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="min-h-[220px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-4">
          <MediaPickerField
            label="Default emblem"
            kind="image"
            value={settings.emblemFallbackUrl}
            onChange={(next) =>
              setSettings((prev) => ({ ...prev, emblemFallbackUrl: next }))
            }
            fallback="crest"
          />
        </div>
        <div className="min-h-[220px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-4">
          <MediaPickerField
            label="Loading emblem"
            kind="image"
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
      </div>

      <AdminCard title="Active drop palette">
        {activePalette ? (
          <div className="space-y-3">
            {paletteLabel ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                <span className="font-medium text-[var(--color-text)]">
                  {paletteLabel}
                </span>
                {supabaseConfigured && publishedDropQuery.isFetching
                  ? ' · refreshing'
                  : null}
              </p>
            ) : null}
            <PaletteSwatchRow palette={activePalette} />
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            No active drop palette yet. Set one in Drops.
          </p>
        )}
        <Link
          to="/admin/drops"
          className={cn(
            adminButtonVariants({ variant: 'secondary', size: 'sm' }),
            'mt-4 inline-flex no-underline',
          )}
        >
          Edit drop theme
        </Link>
      </AdminCard>

      <AdminSaveBar
        saveLabel="Save brand fallbacks"
        saving={saving}
        onSave={save}
      />
    </div>
  )
}

function PaletteSwatchRow({ palette }: { palette: DropThemePalette }) {
  const entries = Object.entries(palette.colors) as Array<
    [keyof DropThemePalette['colors'], string | undefined]
  >

  return (
    <div
      className="flex flex-wrap gap-1"
      data-testid="active-drop-palette-swatches"
      aria-label={`${palette.name} color tokens`}
    >
      {entries.map(([key, val]) => (
        <PaletteSwatch key={key} label={key} color={val} />
      ))}
    </div>
  )
}

function PaletteSwatch({
  label,
  color,
}: {
  label: string
  color: string | undefined
}) {
  const css = useMemo(() => {
    if (!color?.trim()) return 'transparent'
    const p = parseColor(color)
    return p ? rgbaToCss(p) : 'transparent'
  }, [color])
  const ok = Boolean(color?.trim() && isValidColor(color))

  return (
    <span
      className={cn(
        'h-10 flex-1 min-w-[2.25rem] rounded-md border border-[var(--color-line)]',
        !ok &&
          'bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,.06)_4px,rgba(255,255,255,.06)_8px)]',
      )}
      style={{ backgroundColor: ok ? css : undefined }}
      title={`${label}: ${color?.trim() || 'unset'}`}
    />
  )
}
