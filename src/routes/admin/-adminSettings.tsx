import { RotateCcw } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import {
  isAdminLoginConfigured,
  verifyAdminPassword,
} from '@/features/admin/auth/adminAuth.storage'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { resetAllLocalCmsKeys } from '@/features/admin/drops/drops.service'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'

const FORGED_MODAL_PANEL =
  'max-w-md border-[var(--color-line)] bg-[var(--color-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.42),0_1px_0_rgba(255,255,255,0.04),0_20px_56px_-36px_rgba(0,0,0,0.82)] ring-1 ring-inset ring-[color:color-mix(in_srgb,var(--anvl-bone)_10%,transparent)] motion-safe:transition-[box-shadow] motion-safe:duration-200 motion-reduce:transition-none'

function formatSessionAt(iso: string | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function AdminSettingsPageRoute() {
  return (
    <ProtectedAdminRoute>
      <SettingsPage />
    </ProtectedAdminRoute>
  )
}

function SettingsPage() {
  const { session } = useAdminAuth()
  const [confirmReset, setConfirmReset] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const supabaseMode = Boolean(getSupabasePublicEnv())

  const descId = useId()
  const passwordFieldId = useId()
  const confirmFieldId = useId()

  function closeResetModal() {
    setConfirmReset(false)
    setPassword('')
    setConfirmPassword('')
  }

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword

  const authMatches = supabaseMode
    ? passwordsMatch
    : passwordsMatch && verifyAdminPassword(password)

  const matchError =
    confirmPassword.length > 0 && password !== confirmPassword
      ? 'Passwords must match.'
      : undefined

  const authError =
    !supabaseMode && passwordsMatch && !verifyAdminPassword(password)
      ? 'Does not match the admin password for this workspace.'
      : undefined

  const canSubmit = supabaseMode
    ? passwordsMatch && !matchError
    : isAdminLoginConfigured && Boolean(authMatches) && !matchError

  const sessionUserLabel =
    session == null
      ? '—'
      : session.kind === 'legacy'
        ? session.username
        : `${session.displayName} (${session.email})`

  return (
    <AdminLayout
      title="Settings"
      description="Workspace session and local-only CMS tools for this browser."
    >
      <div className="space-y-8">
        <AdminCard title="Session">
          <div className="space-y-1 text-sm text-[var(--color-text-muted)]">
            <p>
              <span className="text-[var(--color-text)]">User:</span>{' '}
              {sessionUserLabel}
            </p>
            <p>
              <span className="text-[var(--color-text)]">Signed in:</span>{' '}
              {formatSessionAt(session?.loggedInAt)}
            </p>
          </div>
        </AdminCard>

        <AdminCard title="Danger zone" description="Irreversible for this browser’s CMS storage.">
          <div className="space-y-4">
            <AdminSectionHeader
              eyebrow="Local dev"
              title="Reset all local CMS data"
              description="Clears drops, products, layout keys, legacy landing JSON, and re-seeds The Oath defaults."
            />
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={() => setConfirmReset(true)}
              className={cn(
                'focus-ring min-h-11 w-full max-w-xl whitespace-normal px-4 py-3 text-center leading-snug sm:min-h-12',
                'border-red-500/45 bg-red-950/30 text-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-inset ring-red-500/25',
                'hover:border-red-400/55 hover:bg-red-500/15 hover:text-red-50',
              )}
            >
              <RotateCcw size={18} className="mr-2 shrink-0" aria-hidden="true" />
              Reset all local CMS data…
            </Button>
          </div>
        </AdminCard>
      </div>

      <Modal
        open={confirmReset}
        onClose={closeResetModal}
        title="Reset all local CMS data?"
        aria-describedby={descId}
        className={FORGED_MODAL_PANEL}
      >
        <div className="space-y-4">
          <p
            id={descId}
            className="text-sm leading-relaxed text-[var(--color-text-muted)]"
          >
            This clears drops, products, layout keys, any leftover legacy landing JSON key, and
            re-seeds The Oath defaults in this browser.{' '}
            <span className="font-semibold text-[var(--color-text)]">
              This cannot be undone.
            </span>
          </p>

          {supabaseMode ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              Type the same value in both fields (for example your Supabase sign-in password) to
              confirm. This only clears this browser’s cached CMS copy; remote data in Supabase is
              unchanged.
            </p>
          ) : !isAdminLoginConfigured ? (
            <p className="rounded-lg border border-dashed border-[var(--color-line)] px-3 py-2 text-xs text-[var(--color-text-muted)]" role="alert">
              Admin password is not configured — cannot verify reset. Set{' '}
              <span className="font-mono text-[10px]">VITE_ANVL_ADMIN_PASSWORD</span> in{' '}
              <span className="font-mono text-[10px]">.env</span> (see{' '}
              <span className="font-mono text-[10px]">.env.example</span>).
            </p>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">
              Type your admin password twice to confirm. Use the same credential as the sign-in
              screen.
            </p>
          )}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!canSubmit) return
              resetAllLocalCmsKeys()
              toast.success('Local CMS reset — defaults restored.')
              closeResetModal()
            }}
          >
            <FormField
              label={supabaseMode ? 'Confirmation' : 'Admin password'}
              htmlFor={passwordFieldId}
              error={authError}
            >
              <Input
                id={passwordFieldId}
                type="password"
                autoComplete="current-password"
                name="admin-reset-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!supabaseMode && !isAdminLoginConfigured}
                aria-invalid={Boolean(authError)}
              />
            </FormField>
            <FormField
              label={supabaseMode ? 'Confirm' : 'Confirm admin password'}
              htmlFor={confirmFieldId}
              error={matchError}
            >
              <Input
                id={confirmFieldId}
                type="password"
                autoComplete="new-password"
                name="admin-reset-password-confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!supabaseMode && !isAdminLoginConfigured}
                aria-invalid={Boolean(matchError)}
              />
            </FormField>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" size="md" onClick={closeResetModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="lg"
                disabled={!canSubmit}
                className={cn(
                  'min-h-11 sm:min-w-[12rem]',
                  'border-red-500/50 bg-red-950/35 text-red-100 hover:bg-red-500/20',
                  'disabled:pointer-events-none disabled:opacity-40',
                )}
              >
                Reset everything
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </AdminLayout>
  )
}
