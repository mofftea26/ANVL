import { Monitor, Smartphone } from 'lucide-react'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import type { ThemePalette } from '@/features/cms/config/cmsSiteConfig.zod'
import type { ThemePreset } from '@/features/cms/config/themeLibrary'
import { ThemeComponentPreview } from './ThemeComponentPreview'
import { ThemeContrastReport } from './ThemeContrastReport'

export type ThemePreviewMode = 'desktop' | 'mobile'

interface SiteThemePreviewRailProps {
  preset: ThemePreset
  mode: ThemePreviewMode
  onModeChange: (mode: ThemePreviewMode) => void
  onApplyFix: (key: keyof ThemePalette, value: string) => void
}

/**
 * Theme editor contextual rail: a real-component live preview (desktop/mobile)
 * plus the WCAG contrast report. Docked into the {@link AdminWorkspace} side rail
 * so the wide-screen space mirrors the storefront while you edit colors.
 */
export function SiteThemePreviewRail({
  preset,
  mode,
  onModeChange,
  onApplyFix,
}: SiteThemePreviewRailProps) {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Live preview
          </span>
          <div className="flex gap-1.5">
            <AdminTopbarChipButton
              type="button"
              size="icon"
              variant={mode === 'desktop' ? 'primary' : undefined}
              icon={<Monitor size={15} />}
              onClick={() => onModeChange('desktop')}
              aria-label="Desktop preview"
              title="Desktop preview"
            />
            <AdminTopbarChipButton
              type="button"
              size="icon"
              variant={mode === 'mobile' ? 'primary' : undefined}
              icon={<Smartphone size={15} />}
              onClick={() => onModeChange('mobile')}
              aria-label="Mobile preview"
              title="Mobile preview"
            />
          </div>
        </div>
        <ThemeComponentPreview preset={preset} mode={mode} />
      </div>
      <ThemeContrastReport palette={preset.palette} onApplyFix={onApplyFix} />
    </>
  )
}
