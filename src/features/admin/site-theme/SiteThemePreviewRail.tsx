import type { ThemePalette } from '@/features/cms/config/cmsSiteConfig.zod'
import type { ThemePreset } from '@/features/cms/config/themeLibrary'
import { useDeferredValue } from 'react'
import { ThemeComponentPreview } from './ThemeComponentPreview'
import { ThemeContrastReport } from './ThemeContrastReport'

interface SiteThemePreviewRailProps {
  preset: ThemePreset
  onApplyFix: (key: keyof ThemePalette, value: string) => void
}

/**
 * Theme editor contextual rail: the Palette Mockup (a real-component render of
 * the palette being edited) plus the WCAG contrast report. Docked into the
 * {@link AdminWorkspace} side rail so the wide-screen space mirrors the
 * storefront while you edit colors. The preview consumes a deferred copy of
 * the preset so rapid color-input keystrokes never wait on the mockup render.
 */
export function SiteThemePreviewRail({ preset, onApplyFix }: SiteThemePreviewRailProps) {
  const deferredPreset = useDeferredValue(preset)
  return (
    <>
      <div className="space-y-4">
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Palette Mockup
        </span>
        <ThemeComponentPreview preset={deferredPreset} />
      </div>
      <ThemeContrastReport palette={deferredPreset.palette} onApplyFix={onApplyFix} />
    </>
  )
}
