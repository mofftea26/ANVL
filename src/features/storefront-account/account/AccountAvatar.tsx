import { cn } from '@/shared/lib/cn'

/** Round avatar: photo when available, else initials on a forged gradient. */
export function AccountAvatar({
  name,
  email,
  src,
  className,
}: {
  name?: string
  email?: string
  src?: string
  className?: string
}) {
  const seed = (name || email || 'A').trim()
  const initials =
    seed
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'A'

  return (
    <span
      className={cn(
        'inline-grid place-items-center overflow-hidden rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-heading)] ring-1 ring-[var(--color-line)]',
        className,
      )}
      style={
        src
          ? undefined
          : { background: 'radial-gradient(120% 120% at 30% 20%, var(--color-graphite,#5B5E61), var(--color-bg))' }
      }
      aria-hidden="true"
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="anvl-display text-[0.7em] tracking-wide">{initials}</span>
      )}
    </span>
  )
}
