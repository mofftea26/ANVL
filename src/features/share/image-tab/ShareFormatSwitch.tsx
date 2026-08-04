import { useMemo } from 'react'
import { cn } from '@/shared/lib/cn'
import type { ShareFormatKey } from '../types'
import { SHARE_FORMAT_META } from './presetMeta'
import { useRovingRadio } from '../useRovingRadio'

/**
 * Story / Post / Message.
 *
 * The names alone do not say what a canvas is — "Message" could be anything —
 * so each segment carries a proportion box drawn at the real ratio. The shape
 * is the label; the word is the confirmation. Segments are `h-11`, the 44px
 * touch floor, because this is a phone-first sheet and the old pills were 28px.
 */
export function ShareFormatSwitch({
  value,
  onChange,
}: {
  value: ShareFormatKey
  onChange: (next: ShareFormatKey) => void
}) {
  const keys = useMemo(() => SHARE_FORMAT_META.map((meta) => meta.key), [])
  const { register, onKeyDown } = useRovingRadio(keys, value, onChange)

  return (
    <div
      role="radiogroup"
      aria-label="Image size"
      onKeyDown={onKeyDown}
      className={cn(
        // `shrink-0`: from `lg` this is a flex child of the preview column and
        // must not be squeezed by the stage growing beside it.
        'mt-3 grid shrink-0 grid-cols-3 gap-1 rounded-xl p-1 lg:mt-4',
        'bg-[var(--color-surface-elevated)] ring-1 ring-inset ring-[var(--color-line)]',
      )}
    >
      {SHARE_FORMAT_META.map((meta) => {
        const selected = meta.key === value
        return (
          <button
            key={meta.key}
            ref={register(meta.key)}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${meta.label} — ${meta.purpose}, ${meta.dimensions}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(meta.key)}
            className={cn(
              'focus-ring flex h-11 items-center justify-center gap-2 rounded-lg',
              'text-[11px] font-semibold uppercase tracking-[0.1em]',
              'motion-safe:transition-colors',
              selected
                ? 'bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] text-[color:var(--color-on-highlight)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'block h-[18px] shrink-0 rounded-[2px] border border-current opacity-70',
                meta.glyphClass,
              )}
            />
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}
