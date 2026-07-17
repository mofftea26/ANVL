import { Eye, EyeOff } from '@/shared/icons'
import { useSetVisibilityMutation } from '@/features/passport/hooks/usePassport'
import { cn } from '@/shared/lib/cn'

/**
 * Per-piece sharing switch, right on the Armory grid card: public pieces show
 * on the shared armory page (and their passport engraves the owner's name);
 * private ones stay yours alone. Same RPC as the passport's visibility toggle.
 */
export function PieceShareSwitch({
  token,
  isPublic,
}: {
  token: string
  isPublic: boolean
}) {
  const setVisibility = useSetVisibilityMutation()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPublic}
      aria-label={isPublic ? 'Piece is public — make it private' : 'Piece is private — share it'}
      title={isPublic ? 'Shown on your shared armory' : 'Hidden from your shared armory'}
      disabled={setVisibility.isPending}
      onClick={() => setVisibility.mutate({ token, isPublic: !isPublic })}
      className={cn(
        'focus-ring inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] motion-safe:transition-colors disabled:opacity-50',
        isPublic
          ? 'bg-[color-mix(in_oklab,var(--color-highlight)_16%,transparent)] text-[var(--color-heading)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
      )}
    >
      {isPublic ? (
        <Eye size={12} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
      ) : (
        <EyeOff size={12} aria-hidden="true" />
      )}
      {isPublic ? 'Public' : 'Private'}
    </button>
  )
}
