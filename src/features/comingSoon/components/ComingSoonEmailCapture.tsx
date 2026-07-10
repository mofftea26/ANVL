import { useState } from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { subscribeComingSoon } from '@/features/comingSoon/api/subscribeComingSoon'
import type { ResolvedComingSoonContent } from '@/features/comingSoon/content/resolveComingSoonContent'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'

type FormPhase = 'idle' | 'submitting' | 'success' | 'error'

/**
 * The single conversion moment on the page: a centered hairline input — no
 * card, no pill, just a luminous underline that charges gold on focus — and a
 * circular strike button. Explicit idle/submitting/success/duplicate/error
 * states; a honeypot absorbs naive bots; duplicates resolve as success.
 */
export function ComingSoonEmailCapture({
  emailCapture,
}: {
  emailCapture: ResolvedComingSoonContent['emailCapture']
}) {
  const [phase, setPhase] = useState<FormPhase>('idle')
  const [message, setMessage] = useState('')

  if (!emailCapture.enabled) return null

  const submitting = phase === 'submitting'

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return
    const form = e.currentTarget
    const data = new FormData(form)
    // Honeypot: real visitors never see or fill this field.
    if (String(data.get('company') ?? '').length > 0) {
      setPhase('success')
      setMessage('You are on the list.')
      return
    }
    setPhase('submitting')
    setMessage('')
    const result = await subscribeComingSoon(String(data.get('email') ?? ''))
    if (result.ok) {
      setPhase('success')
      setMessage(
        result.alreadySubscribed
          ? 'You are already on the list.'
          : 'You are in. The forge will find you.',
      )
      form.reset()
    } else {
      setPhase('error')
      setMessage(result.error)
    }
  }

  return (
    <div
      data-cs-reveal="email"
      className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-2"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-[color:color-mix(in_oklab,var(--color-text)_75%,transparent)] [text-shadow:0_1px_8px_rgba(0,0,0,0.9)] sm:text-[11px]">
        {emailCapture.title}
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="w-full">
        <div className="group flex items-center gap-3 rounded-t-md border-b border-[color-mix(in_oklab,var(--color-text)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_45%,transparent)] px-2 pb-1 backdrop-blur-[2px] transition-colors duration-300 focus-within:border-[color-mix(in_oklab,var(--cs-accent)_85%,transparent)]">
          <label htmlFor="cs-email" className="sr-only">
            Email address
          </label>
          <input
            id="cs-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder={emailCapture.placeholder}
            disabled={submitting}
            className="h-11 min-w-0 flex-1 bg-transparent text-center text-base text-[color:var(--color-text)] outline-none placeholder:text-[color:color-mix(in_oklab,var(--color-text)_55%,transparent)] md:text-sm"
          />
          {/* Honeypot — removed from real users visually and programmatically. */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          <button
            type="submit"
            disabled={submitting}
            aria-label={emailCapture.buttonText}
            title={emailCapture.buttonText}
            className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--cs-accent)_55%,transparent)] text-[color:var(--cs-accent)] transition-all duration-300 hover:bg-[color-mix(in_oklab,var(--cs-accent)_18%,transparent)] hover:shadow-[0_0_24px_color-mix(in_oklab,var(--cs-accent)_35%,transparent)] active:scale-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 size={ICON_SIZE.sm} className="animate-spin" aria-hidden="true" />
            ) : phase === 'success' ? (
              <Check size={ICON_SIZE.sm} aria-hidden="true" />
            ) : (
              <ArrowRight size={ICON_SIZE.sm} aria-hidden="true" />
            )}
          </button>
        </div>
        <p
          aria-live="polite"
          className={cn(
            'mt-2 min-h-[1.1rem] text-center text-xs',
            phase === 'error'
              ? 'text-[color:var(--color-danger)]'
              : 'text-[color:color-mix(in_oklab,var(--cs-accent)_85%,var(--color-text))]',
          )}
        >
          {message}
        </p>
      </form>
    </div>
  )
}
