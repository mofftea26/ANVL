import type { CSSProperties } from 'react'
import { themeConfigToCssVars, type ThemeConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import {
  appearanceToDataTheme,
  type ThemePreset,
} from '@/features/cms/config/themeLibrary'

type SiteThemePreviewProps = {
  preset: ThemePreset
}

function cssVarsForPreset(preset: ThemePreset): Record<string, string> {
  const theme: ThemeConfig = {
    dataTheme: appearanceToDataTheme(preset.appearance),
    palette: preset.palette,
  }
  return themeConfigToCssVars(theme)
}

export function SiteThemePreview({ preset }: SiteThemePreviewProps) {
  const vars = cssVarsForPreset(preset)

  return (
    <div
      className="overflow-hidden rounded-2xl border border-[var(--color-line)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      style={vars as CSSProperties}
      data-testid="site-theme-preview"
    >
      <div
        className="border-b px-4 py-3"
        style={{
          background: preset.palette.colorSurface,
          borderColor: preset.palette.colorLine,
        }}
      >
        <p
          className="text-[10px] uppercase tracking-[0.22em]"
          style={{ color: preset.palette.colorTextMuted }}
        >
          Live preview
        </p>
        <p
          className="mt-1 font-display text-lg uppercase leading-tight"
          style={{ color: preset.palette.colorHeading, fontFamily: 'var(--font-heading)' }}
        >
          {preset.name}
        </p>
      </div>

      <div className="space-y-4 p-4" style={{ background: preset.palette.colorBg }}>
        <div
          className="rounded-xl border p-4"
          style={{
            background: preset.palette.colorSurfaceElevated,
            borderColor: preset.palette.colorLine,
          }}
        >
          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: preset.palette.colorAccent }}>
            Drop 01 — The Oath
          </p>
          <h3
            className="mt-2 font-display text-2xl uppercase leading-none"
            style={{ color: preset.palette.colorHeading, fontFamily: 'var(--font-heading)' }}
          >
            Forged under pressure
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: preset.palette.colorTextMuted }}>
            Body copy, buttons, and surfaces update as you edit colors.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className="inline-flex px-4 py-2 text-[10px] uppercase tracking-[0.18em]"
              style={{
                background: preset.palette.colorHeading,
                color: preset.palette.colorBg,
              }}
            >
              Primary CTA
            </span>
            <span
              className="inline-flex border px-4 py-2 text-[10px] uppercase tracking-[0.18em]"
              style={{
                borderColor: preset.palette.colorLine,
                color: preset.palette.colorText,
              }}
            >
              Secondary
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Highlight', color: preset.palette.colorEmber },
            { label: 'Accent', color: preset.palette.colorAccent },
            { label: 'Muted', color: preset.palette.colorTextMuted },
          ].map((swatch) => (
            <div
              key={swatch.label}
              className="rounded-lg border p-2 text-center text-[10px] uppercase tracking-[0.14em]"
              style={{
                borderColor: preset.palette.colorLine,
                color: preset.palette.colorTextMuted,
                background: preset.palette.colorSurface,
              }}
            >
              <span
                className="mx-auto mb-1.5 block h-6 w-full rounded-md"
                style={{ background: swatch.color }}
              />
              {swatch.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
