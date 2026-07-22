import { RotateCcw } from '@/shared/icons'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { resetAllLocalCmsKeys } from '@/features/admin/lib/resetLocalCms'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { AdminWorkspaceStatusPanel } from '@/features/admin/components/AdminWorkspaceStatusPanel'
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
  return <SettingsPage />
}

function SettingsPage() {
  const { session } = useAdminAuth()
  const [confirmReset, setConfirmReset] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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

  const matchError =
    confirmPassword.length > 0 && password !== confirmPassword
      ? 'Passwords must match.'
      : undefined

  const canSubmit = passwordsMatch && !matchError

  const sessionUserLabel =
    session == null ? '—' : `${session.displayName} (${session.email})`

  const settingsRail = (
    <>
      <AdminWorkspaceStatusPanel />
      <AdminRailPanel
        title="About settings"
        description="This surface manages your session and local working copy only."
      >
        <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
          Resetting clears this browser&rsquo;s cached CMS copy and re-seeds The Oath defaults.
          Remote data in Supabase is left untouched.
        </p>
      </AdminRailPanel>
    </>
  )

  return (
    <AdminLayout layout="workspace">
      <AdminWorkspace asideLabel="Workspace settings context" aside={settingsRail}>
      <div className="space-y-8">
        <AdminCard title="Session">
          <div className="space-y-1 text-sm text-[var(--color-text-muted)]">
            <p>
              <span className="text-[var(--color-text)]">User:</span>{' '}
              {sessionUserLabel}
            </p>
            <p>
              <span className="text-[var(--color-text)]">Last verified:</span>{' '}
              {formatSessionAt(session?.verifiedAt)}
            </p>
          </div>
        </AdminCard>

        <AdminCard title="Danger zone">
          <div className="space-y-4">
            <Button
              type="button"
              variant="destructive"
              size="lg"
              density="compact"
              onClick={() => setConfirmReset(true)}
              className={cn(
                'focus-ring min-h-11 w-full max-w-xl whitespace-normal px-4 py-3 text-center leading-snug sm:min-h-12',
                'border-[color-mix(in_oklab,var(--color-danger)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_18%,var(--color-surface))] text-[color:var(--color-danger)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-danger)_25%,transparent)]',
                'hover:border-[color-mix(in_oklab,var(--color-danger)_55%,transparent)] hover:bg-[color-mix(in_oklab,var(--color-danger)_28%,var(--color-surface))]',
              )}
            >
              <RotateCcw size={20} className="mr-2 shrink-0" aria-hidden="true" />
              Reset all local CMS data…
            </Button>
          </div>
        </AdminCard>
      </div>
      </AdminWorkspace>

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

          <p className="text-xs text-[var(--color-text-muted)]">
            Type the same value in both fields (for example your Supabase sign-in password) to
            confirm. This only clears this browser’s cached CMS copy; remote data in Supabase is
            unchanged.
          </p>

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
            <FormField label="Confirmation" htmlFor={passwordFieldId} labelStyle="stacked">
              <Input
                density="compact"
                id={passwordFieldId}
                type="password"
                autoComplete="current-password"
                name="admin-reset-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>
            <FormField label="Confirm" htmlFor={confirmFieldId} error={matchError} labelStyle="stacked">
              <Input
                density="compact"
                id={confirmFieldId}
                type="password"
                autoComplete="new-password"
                name="admin-reset-password-confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={Boolean(matchError)}
              />
            </FormField>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" size="md" density="compact" onClick={closeResetModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="lg"
                density="compact"
                disabled={!canSubmit}
                className={cn(
                  'min-h-11 sm:min-w-[12rem]',
                  'border-[color-mix(in_oklab,var(--color-danger)_50%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_20%,var(--color-surface))] text-[color:var(--color-danger)] hover:bg-[color-mix(in_oklab,var(--color-danger)_30%,var(--color-surface))]',
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
