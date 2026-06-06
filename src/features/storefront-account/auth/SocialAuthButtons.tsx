import { useState } from 'react'
import { toast } from 'sonner'
import {
  isStorefrontAuthEnabled,
  signInWithOAuthStorefront,
  type StorefrontOAuthProvider,
} from './storefrontAuth'

const PROVIDERS: { id: StorefrontOAuthProvider; name: string }[] = [
  { id: 'google', name: 'Google' },
  { id: 'apple', name: 'Apple' },
  { id: 'facebook', name: 'Facebook' },
]

/**
 * Premium social sign-in buttons (Google / Apple / Facebook). Renders ONLY when
 * Supabase is configured — so the current mock app is unchanged. The providers
 * themselves must be enabled in the Supabase dashboard (see docs).
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
        <button
          key={p.id}
          type="button"
          disabled={pending !== null}
          onClick={() => start(p.id)}
          className="focus-ring flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === p.id ? 'Redirecting…' : `${verb} ${p.name}`}
        </button>
      ))}
      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-[var(--color-line)]" />
        <span className="anvl-micro text-[10px] text-[var(--color-text-muted)]">or</span>
        <span className="h-px flex-1 bg-[var(--color-line)]" />
      </div>
    </div>
  )
}
