import { cn } from '@/shared/lib/cn'

/** Two initials from a name ("George Maalouf" → "GM"), or first 2 letters. */
function initialsFrom(name?: string, email?: string): string {
  const seed = (name || '').trim()
  if (seed) {
    const parts = seed.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
    return parts[0]!.slice(0, 2).toUpperCase()
  }
  const e = (email || 'A').trim()
  return e.slice(0, 2).toUpperCase()
}

/**
 * Round, forged avatar: photo when available, else two initials set in the
 * Cinzel display face on a steel-to-black gradient with a gilded inner ring.
 */
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
  const initials = initialsFrom(name, email)

  return (
    <span
      className={cn(
        'relative inline-grid select-none place-items-center overflow-hidden rounded-full text-[var(--anvl-bone,#E7E4DF)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-accent)_55%,transparent)]',
        className,
      )}
      style={
        src
          ? undefined
          : {
              background:
                'radial-gradient(130% 130% at 30% 18%, #4a4d50 0%, #26282b 42%, #0d0e0f 100%)',
              boxShadow:
                'inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -8px 16px rgba(0,0,0,0.55)',
            }
      }
      aria-hidden="true"
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span
          className="font-normal leading-none tracking-[0.04em] text-[0.92em] [font-family:var(--font-display,'Cinzel',serif)]"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
        >
          {initials}
        </span>
      )}
    </span>
  )
}
