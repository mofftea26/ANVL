import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/Button'
import {
  isStorefrontAuthEnabled,
  signInWithOAuthStorefront,
  type StorefrontOAuthProvider,
} from './storefrontAuth'

/** The official multicolor Google "G" (brand guidelines require these hues). */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  )
}

// Google only for now. Facebook removed; Apple deferred (needs a paid Apple
// Developer account). Add entries here once enabled in the Supabase dashboard.
const PROVIDERS: {
  id: StorefrontOAuthProvider
  name: string
  Icon: () => React.ReactNode
}[] = [{ id: 'google', name: 'Google', Icon: GoogleGlyph }]

/**
 * Premium social sign-in button (Google). Renders ONLY when Supabase is
 * configured — so the current mock app is unchanged. The provider itself must
 * be enabled in the Supabase dashboard (see docs).
 */
export function SocialAuthButtons({ verb = 'Continue with' }: { verb?: string }) {
  const [pending, setPending] = useState<StorefrontOAuthProvider | null>(null)
  if (!isStorefrontAuthEnabled()) return null

  async function start(provider: StorefrontOAuthProvider) {
    setPending(provider)
    const res = await signInWithOAuthStorefront(provider)
    if (!res.ok) {
      toast.error(res.error ?? 'Could not start sign-in.')
      setPending(null)
    }
    // On success the browser redirects to the provider.
  }

  return (
    <div className="space-y-2.5">
      {PROVIDERS.map((p) => (
        <Button
          key={p.id}
          variant="secondary"
          className="w-full gap-2.5"
          disabled={pending !== null}
          onClick={() => start(p.id)}
        >
          <p.Icon />
          {pending === p.id ? 'Redirecting…' : `${verb} ${p.name}`}
        </Button>
      ))}
      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-[var(--color-line)]" />
        <span className="anvl-micro text-[10px] text-[var(--color-text-muted)]">or</span>
        <span className="h-px flex-1 bg-[var(--color-line)]" />
      </div>
    </div>
  )
}
