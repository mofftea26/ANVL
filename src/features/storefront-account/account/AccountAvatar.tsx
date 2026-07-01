import { cn } from '@/shared/lib/cn'

/** First initial of the first name + first initial of the last name ("George Maalouf" → "GM"). */
function initialsFrom(firstName?: string, lastName?: string, email?: string): string {
  const f = (firstName ?? '').trim()
  const l = (lastName ?? '').trim()
  if (f && l) return (f[0]! + l[0]!).toUpperCase()
  if (f) return f.slice(0, 2).toUpperCase()
  if (l) return l.slice(0, 2).toUpperCase()
  const e = (email || 'A').trim()
  return e.slice(0, 2).toUpperCase()
}

/**
 * Round, forged avatar: photo when available, else initials — first name's
 * initial + last name's initial — set in the bold Anton heading face on a
 * steel-to-black gradient with a gilded inner ring.
 */
export function AccountAvatar({
  firstName,
  lastName,
  email,
  src,
  className,
}: {
  firstName?: string
  lastName?: string
  email?: string
  src?: string
  className?: string
}) {
  const initials = initialsFrom(firstName, lastName, email)

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
          className="font-normal leading-none tracking-[0.02em] text-[0.85em] [font-family:var(--font-heading,'Anton',sans-serif)]"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
        >
          {initials}
        </span>
      )}
    </span>
  )
}
