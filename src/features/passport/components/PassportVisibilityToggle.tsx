import { Eye, EyeOff } from '@/shared/icons'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/cn'
import { useSetVisibilityMutation } from '../hooks/usePassport'
import type { PassportView } from '../schemas/passport.schema'

/**
 * Owner-only switch: public passports show the engraved name to anyone who
 * scans the piece (authenticity/flex); private (default) shows an anonymous
 * "already registered" view. Server-enforced via `set_passport_visibility`.
 */
export function PassportVisibilityToggle({
  token,
  view,
}: {
  token: string
  view: PassportView
}) {
  const mutation = useSetVisibilityMutation()
  const isPublic = view.isPublic

  const toggle = async () => {
    const ok = await mutation.mutateAsync({ token, isPublic: !isPublic })
    if (!ok) {
      toast.error('Could not update passport visibility.')
      return
    }
    toast.success(
      !isPublic
        ? 'Passport is now public — scans show your engraved name.'
        : 'Passport is now private — scans show an anonymous verification.',
    )
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPublic}
      disabled={mutation.isPending}
      onClick={() => void toggle()}
      className={cn(
        'focus-ring anvl-micro mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors',
        isPublic
          ? 'border-[color-mix(in_oklab,var(--color-highlight)_45%,var(--color-line))] text-[var(--color-highlight-bright)]'
          : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
      )}
    >
      {isPublic ? (
        <Eye aria-hidden="true" className="h-3.5 w-3.5" />
      ) : (
        <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      {isPublic ? 'Public passport' : 'Private passport'}
      <span
        aria-hidden="true"
        className={cn(
          'relative ml-1 inline-flex h-3.5 w-6 items-center rounded-full transition-colors',
          isPublic ? 'bg-[var(--color-highlight)]' : 'bg-[var(--color-surface-elevated)]',
        )}
      >
        <span
          className={cn(
            'absolute h-2.5 w-2.5 rounded-full bg-[var(--color-heading)] transition-transform',
            isPublic ? 'translate-x-3' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}
