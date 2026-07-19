import { Check } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import type { CareProductEntry } from '@/features/cms/support/supportContent.zod'

/**
 * Renders one product's care instructions from an authored `CareProductEntry`
 * (an optional note plus a checklist of care lines).
 */
export function CareLines({ entry }: { entry: CareProductEntry }) {
  const lines = entry.lines.map((line) => line.trim()).filter((line) => line.length > 0)
  return (
    <div className="space-y-3">
      {entry.note.trim() ? (
        <p className="max-w-3xl text-sm text-[var(--color-text-muted)]">{entry.note}</p>
      ) : null}
      {lines.length > 0 ? (
        <ul className="space-y-2">
          {lines.map((line, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm text-[var(--color-text-muted)]">
              <span className="mt-0.5 shrink-0 text-[var(--color-highlight-bright)]">
                <Check size={ICON_SIZE.sm} aria-hidden="true" />
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
