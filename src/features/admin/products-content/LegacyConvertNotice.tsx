import { Button } from '@/shared/components/ui/Button'

interface LegacyConvertNoticeProps {
  label: string
  lines: string[]
  onConvert: () => void
}

/**
 * Read-only preview of legacy free-text content still stored on a product,
 * with a one-click "Convert to structured" that seeds the structured editor
 * below it. Non-destructive — the original legacy strings are kept on the
 * stored entry so old blobs keep rendering until the structured version saves
 * (mirrors the support care/size "Convert to structured" affordance).
 */
export function LegacyConvertNotice({ label, lines, onConvert }: LegacyConvertNoticeProps) {
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-[var(--color-line)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
        {label} (read-only)
      </p>
      <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--color-text-muted)]">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      <p className="text-[11px] text-[var(--color-text-muted)]">
        These render on the storefront until structured entries exist. Convert them to editable
        cards below — the originals are kept as a backup.
      </p>
      <Button type="button" variant="secondary" size="sm" density="compact" onClick={onConvert}>
        Convert to structured
      </Button>
    </div>
  )
}
