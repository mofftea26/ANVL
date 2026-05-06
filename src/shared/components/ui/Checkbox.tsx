import type { InputHTMLAttributes } from 'react'

export function Checkbox(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className="focus-ring h-4 w-4 rounded border-[var(--color-line)] bg-[var(--color-surface)]"
      {...props}
    />
  )
}
