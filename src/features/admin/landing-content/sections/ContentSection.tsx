import type { PropsWithChildren } from 'react'

/** Scene-grouped card for the landing content editor. */
export function ContentSection({
  title,
  hint,
  children,
}: PropsWithChildren<{ title: string; hint?: string }>) {
  return (
    <section className="rounded-xl border border-[var(--color-line)] p-5">
      <h2 className="anvl-heading text-base font-normal">{title}</h2>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>
      ) : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}
