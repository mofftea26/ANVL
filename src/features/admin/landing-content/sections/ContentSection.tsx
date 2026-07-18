import type { PropsWithChildren } from 'react'

import { AdminPreviewLocateButton } from '@/features/admin/preview/AdminPreviewLocateButton'
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
  /** Adds a "locate in live preview" affordance next to the title. */
  previewTarget?: PreviewTarget
}>) {
  return (
    <section className="rounded-xl border border-[var(--color-line)] p-5">
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
