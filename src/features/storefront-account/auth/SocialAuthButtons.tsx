import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/Button'
import {
  isStorefrontAuthEnabled,
  signInWithOAuthStorefront,
  type StorefrontOAuthProvider,
} from './storefrontAuth'

// Google only for now. Facebook removed; Apple deferred (needs a paid Apple
// Developer account). Add entries here once enabled in the Supabase dashboard.
const PROVIDERS: { id: StorefrontOAuthProvider; name: string }[] = [
  { id: 'google', name: 'Google' },
]

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
          className="w-full"
          disabled={pending !== null}
          onClick={() => start(p.id)}
        >
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
