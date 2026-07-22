import { ICON_SIZE } from '@/shared/lib/iconSize'
import type { CareProductEntry } from '@/features/cms/support/supportContent.zod'
import { resolveCareItems } from '@/features/cms/support/resolveSupportContent'
import { CARE_ICON_COMPONENTS, formatCareValue } from './careIcons'

/**
 * Renders one product's care instructions from an authored `CareProductEntry`.
 * Structured `items` (icon + name + optional value + note) win when authored;
 * legacy free-text `lines` fall back as generic checklist rows — the mapping
 * happens in `resolveCareItems`, never against the stored data. Icons are
 * decorative (`aria-hidden`); the text always carries the full meaning.
 */
export function CareLines({ entry }: { entry: CareProductEntry }) {
  const items = resolveCareItems(entry)
  return (
    <div className="space-y-3">
      {entry.note.trim() ? (
        <p className="max-w-3xl text-sm text-[var(--color-text-muted)]">{entry.note}</p>
      ) : null}
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = CARE_ICON_COMPONENTS[item.icon]
            const value = formatCareValue(item.value)
            return (
              <li
                key={item.id}
                className="flex items-start gap-2.5 text-sm text-[var(--color-text-muted)]"
              >
                <span className="mt-0.5 shrink-0 text-[var(--color-highlight-bright)]">
                  <Icon size={ICON_SIZE.sm} aria-hidden="true" />
                </span>
                <span>
                  <span className="text-[var(--color-text)]">{item.name}</span>
                  {value ? <span> — {value}</span> : null}
                  {item.note ? (
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {item.note}
                    </span>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
