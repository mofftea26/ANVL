import { useMemo } from 'react'
import { AlertTriangle, Check, Wand2 } from 'lucide-react'
import {
  THEME_CONTRAST_PAIRS,
  type ContrastPair,
} from '@/features/cms/config/themeTokens'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import type { ThemePalette } from '@/features/cms/config/cmsSiteConfig.zod'
import { contrastRatio, suggestAccessibleColor } from '@/shared/lib/color'

type ThemeContrastReportProps = {
  palette: ThemePalette
  /** Apply a suggested fix to a single palette field (never silent — §13). */
  onApplyFix: (key: keyof ThemePalette, value: string) => void
}

type Row = {
  pair: ContrastPair
  ratio: number
  pass: boolean
  suggestion: string | null
}

function buildRows(palette: ThemePalette): Row[] {
  return THEME_CONTRAST_PAIRS.map((pair) => {
    const fg = palette[pair.fg] ?? ''
    const bg = palette[pair.bg] ?? ''
    const ratio = contrastRatio(fg, bg)
    const pass = ratio >= pair.min
    return {
      pair,
      ratio,
      pass,
      suggestion: pass ? null : suggestAccessibleColor(fg, bg, pair.min),
    }
  })
}

export function ThemeContrastReport({ palette, onApplyFix }: ThemeContrastReportProps) {
  const rows = useMemo(() => buildRows(palette), [palette])
  const failing = rows.filter((r) => !r.pass).length

  return (
    <section
      className="space-y-3 rounded-xl border border-[var(--color-line)] p-4"
      data-testid="theme-contrast-report"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--color-heading)]">
          Accessibility
        </h2>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{
            background: failing === 0 ? 'var(--color-success)' : 'var(--color-danger)',
            color: failing === 0 ? 'var(--color-on-success)' : 'var(--color-on-danger)',
          }}
        >
          {failing === 0 ? (
            <>
              <Check size={ICON_SIZE.xs} /> All pass
            </>
          ) : (
            <>
              <AlertTriangle size={ICON_SIZE.xs} /> {failing} failing
            </>
          )}
        </span>
      </div>

      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.pair.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs"
          >
            <span className="min-w-0 flex-1 truncate text-[var(--color-text)]">
              {row.pair.label}
            </span>
            <span
              className="shrink-0 font-mono tabular-nums"
              style={{ color: row.pass ? 'var(--color-success)' : 'var(--color-danger)' }}
              title={`Needs ≥ ${row.pair.min}:1`}
            >
              {row.ratio.toFixed(2)}:1
            </span>
            {row.suggestion ? (
              <button
                type="button"
                onClick={() => onApplyFix(row.pair.fg, row.suggestion!)}
                className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--color-line)] px-2 py-1 text-[11px] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-elevated)]"
                title={`Set ${row.pair.fg} to ${row.suggestion}`}
              >
                <Wand2 size={11} /> Fix
              </button>
            ) : (
              <Check size={ICON_SIZE.sm} className="shrink-0 text-[var(--color-success)]" />
            )}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-[var(--color-text-muted)]">
        Targets: body text 4.5:1, focus rings 3:1. Fixes are previewed before you
        save — nothing changes silently.
      </p>
    </section>
  )
}
