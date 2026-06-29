import type { ReactNode } from 'react'

/**
 * Titled filter section. Uses a real `<fieldset>`/`<legend>` so grouped controls
 * (checkboxes, radios, pills) are announced together by screen readers.
 */
export function ShopFilterGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="anvl-micro mb-3 text-[var(--shop-text-muted)]">{title}</legend>
      {children}
    </fieldset>
  )
}
