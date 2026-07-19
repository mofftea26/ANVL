import type { PropsWithChildren } from 'react'

import { AdminPreviewLocateButton } from '@/features/admin/preview/AdminPreviewLocateButton'
import { usePreviewHoverProps } from '@/features/admin/preview/usePreviewHoverProps'
import type { PreviewTarget } from '@/features/cms/preview'

/** Scene-grouped card for the landing content editor. */
export function ContentSection({
  title,
  hint,
  previewTarget,
  children,
}: PropsWithChildren<{
  title: string
  hint?: string
  /**
   * Wires the section to the live preview: a locate button next to the title,
   * plus inspection-style hover — while the mouse/focus is anywhere in this
   * section, the preview rings the matching storefront element.
   */
  previewTarget?: PreviewTarget
}>) {
  const hoverProps = usePreviewHoverProps(previewTarget ?? null)

  return (
    <section
      className="rounded-xl border border-[var(--color-line)] p-5"
      {...hoverProps}
    >
      <div className="flex items-center gap-2">
        <h2 className="anvl-heading text-base font-normal">{title}</h2>
        {previewTarget ? <AdminPreviewLocateButton target={previewTarget} /> : null}
      </div>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>
      ) : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}
