import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react'
import { ColorField } from '@/shared/components/ui/ColorField'
import { adminFieldControlClass } from '@/features/admin/drops/dropEditorRoute.shared'

type DebouncedColorFieldProps = ComponentProps<typeof ColorField> & {
  /** Debounce commits to parent state (reduces editor jank while dragging sliders). */
  debounceMs?: number
}

/**
 * Keeps `ColorField` responsive locally while batching upstream `Drop` draft updates.
 */
export function DebouncedColorField({
  value,
  onChange,
  debounceMs = 64,
  ...rest
}: DebouncedColorFieldProps) {
  const [draft, setDraft] = useState<string | undefined>(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const flush = useCallback(
    (next: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        startTransition(() => onChange(next))
        timerRef.current = null
      }, debounceMs)
    },
    [onChange, debounceMs],
  )

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  return (
    <ColorField
      {...rest}
      fineInputControlClass={adminFieldControlClass}
      value={draft}
      onChange={(next) => {
        setDraft(next)
        flush(next)
      }}
    />
  )
}
