import { useEffect, useRef } from 'react'
import { Facebook, Instagram, Mail, Youtube } from 'lucide-react'
import { gsap } from '@/shared/lib/gsap'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import type {
  ComingSoonSocialKind,
  ComingSoonSocialLink,
} from '@/features/comingSoon/content/resolveComingSoonContent'

/** lucide has no TikTok mark — minimal brand glyph, `currentColor` like the rest. */
function TikTokIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

function iconFor(kind: ComingSoonSocialKind) {
  switch (kind) {
    case 'instagram':
      return <Instagram size={ICON_SIZE.sm} aria-hidden="true" />
    case 'tiktok':
      return <TikTokIcon size={ICON_SIZE.sm} />
    case 'youtube':
      return <Youtube size={ICON_SIZE.sm} aria-hidden="true" />
    case 'facebook':
      return <Facebook size={ICON_SIZE.sm} aria-hidden="true" />
    case 'email':
      return <Mail size={ICON_SIZE.sm} aria-hidden="true" />
  }
}

/**
 * Circular social buttons with a magnetic pull on fine pointers — each button
 * leans toward the cursor inside its gravity well and snaps back elastically.
 * Only links resolved (and sanitized) by the content resolver render.
 */
export function ComingSoonSocials({ socials }: { socials: ComingSoonSocialLink[] }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (!window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
      return
    }

    const buttons = Array.from(root.querySelectorAll<HTMLAnchorElement>('a'))
    const setters = buttons.map((el) => ({
      el,
      x: gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' }),
    }))

    const onPointerMove = (e: PointerEvent) => {
      for (const s of setters) {
        const rect = s.el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        const dist = Math.hypot(dx, dy)
        const reach = 90
        if (dist < reach) {
          const pull = (1 - dist / reach) * 0.45
          s.x(dx * pull)
          s.y(dy * pull)
        } else {
          s.x(0)
          s.y(0)
        }
      }
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      for (const s of setters) gsap.set(s.el, { x: 0, y: 0 })
    }
  }, [socials.length])

  if (socials.length === 0) return null

  return (
    <div
      ref={rootRef}
      data-cs-reveal="socials"
      className="pointer-events-auto flex items-center justify-center gap-3 sm:gap-4"
    >
      {socials.map((social) => (
        <a
          key={social.kind}
          href={social.href}
          {...(social.kind === 'email' ? {} : { target: '_blank', rel: 'noreferrer' })}
          aria-label={social.label}
          title={social.label}
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--color-text)_32%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_55%,transparent)] text-[color:color-mix(in_oklab,var(--color-text)_85%,transparent)] backdrop-blur-[2px] transition-[border-color,color,box-shadow,background-color] duration-300 hover:border-[color-mix(in_oklab,var(--cs-accent)_75%,transparent)] hover:bg-[color-mix(in_oklab,var(--cs-accent)_12%,transparent)] hover:text-[color:var(--cs-accent)] hover:shadow-[0_0_26px_color-mix(in_oklab,var(--cs-accent)_30%,transparent)]"
        >
          {iconFor(social.kind)}
        </a>
      ))}
    </div>
  )
}
