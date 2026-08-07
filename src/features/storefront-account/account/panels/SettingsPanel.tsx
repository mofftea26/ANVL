import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Bell, KeyRound, ShieldCheck } from '@/shared/icons'
import type { Customer } from '@/app/config/accountContracts'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Switch } from '@/shared/components/ui/Switch'
import {
  useNewPasswordForm,
  useSettingsForm,
  useStorefrontAccountSession,
  useUpdateCustomerProfileMutation,
} from '@/features/storefront-account/publicAccount.core'
// Deliberately NOT the `./auth` barrel: it re-exports `getStorefrontSupabaseClient`
// and `supabaseAccountClient`, so importing it from here — this panel is part of
// the eager entry chunk — pulled all of `@supabase/supabase-js` onto the
// storefront's first-paint graph. Import the leaf modules instead; the SDK-bound
// client is loaded lazily in `signOutEverywhere` below.
import { isStorefrontAuthEnabled } from '@/features/storefront-account/auth/storefrontAuthEnabled'
import { updatePasswordStorefront } from '@/features/storefront-account/auth/storefrontAuth'
import { AccountBentoCard } from '@/features/storefront-account/account/AccountBentoCard'
import { accountCardBg } from '@/features/storefront-account/account/accountCardBg'
import { useRegisterAccountSave } from '@/features/storefront-account/account/accountSave.store'

export function SettingsPanel({ customer }: { customer: Customer | undefined }) {
  const prefsMutation = useUpdateCustomerProfileMutation()
  const prefsForm = useSettingsForm(customer)
  const pwForm = useNewPasswordForm()
  const logout = useStorefrontAccountSession((s) => s.logout)
  const realAuth = isStorefrontAuthEnabled()
  const [pwPending, setPwPending] = useState(false)

  const submitPrefs = useCallback(() => {
    void prefsForm.handleSubmit((values) => {
      prefsMutation.mutate(
        { marketingOptIn: values.marketingOptIn, orderUpdatesOptIn: values.orderUpdatesOptIn },
        {
          onSuccess: () => toast.success('Preferences saved.'),
          onError: () => toast.error('Could not save preferences.'),
        },
      )
    })()
  }, [prefsForm, prefsMutation.mutate])
  useRegisterAccountSave('settings', submitPrefs, prefsMutation.isPending)

  const onChangePassword = pwForm.handleSubmit(async (values) => {
    setPwPending(true)
    const res = await updatePasswordStorefront(values.password)
    setPwPending(false)
    if (res.ok) {
      toast.success('Password changed.')
      pwForm.reset({ password: '', confirmPassword: '' })
    } else {
      toast.error(res.error ?? 'Could not change password.')
    }
  })

  const signOutEverywhere = async () => {
    const { getStorefrontSupabaseClient } = await import(
      '@/features/storefront-account/auth/storefrontSupabaseClient'
    )
    const client = getStorefrontSupabaseClient()
    if (client) await client.auth.signOut({ scope: 'global' })
    logout()
    window.location.assign('/auth/sign-in')
  }

  const orderUpdates = prefsForm.watch('orderUpdatesOptIn')
  const marketing = prefsForm.watch('marketingOptIn')

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Notifications */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submitPrefs()
        }}
      >
        <AccountBentoCard bg={accountCardBg('carbon')} eyebrow="Notifications" icon={<Bell size={17} />} className="h-full">
          <div className="space-y-4">
            <Switch
              label="Order updates"
              description="Confirmations, shipping, and delivery emails."
              checked={Boolean(orderUpdates)}
              onChange={(v) => prefsForm.setValue('orderUpdatesOptIn', v, { shouldDirty: true })}
            />
            <Switch
              label="Drops & marketing"
              description="New releases and offers."
              checked={Boolean(marketing)}
              onChange={(v) => prefsForm.setValue('marketingOptIn', v, { shouldDirty: true })}
            />
            <p className="anvl-micro text-[var(--color-text-muted)]">Save with the button in the header.</p>
          </div>
        </AccountBentoCard>
      </form>

      {/* Change password */}
      {realAuth ? (
        <form onSubmit={onChangePassword} noValidate>
          <AccountBentoCard bg={accountCardBg('stone')} eyebrow="Password" icon={<KeyRound size={17} />} className="h-full">
            <div className="space-y-3">
              <FormField label="New password" error={pwForm.formState.errors.password?.message} htmlFor="set-pass">
                <Input id="set-pass" type="password" autoComplete="new-password" {...pwForm.register('password')} />
              </FormField>
              <FormField label="Confirm password" error={pwForm.formState.errors.confirmPassword?.message} htmlFor="set-pass2">
                <Input id="set-pass2" type="password" autoComplete="new-password" {...pwForm.register('confirmPassword')} />
              </FormField>
              <Button type="submit" disabled={pwPending}>{pwPending ? 'Updating…' : 'Update password'}</Button>
            </div>
          </AccountBentoCard>
        </form>
      ) : null}

      {/* Security */}
      <AccountBentoCard bg={accountCardBg('ember')} eyebrow="Security" icon={<ShieldCheck size={17} />} className="lg:col-span-2">
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Sign out of every device where you&rsquo;re logged in.
        </p>
        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={() => void signOutEverywhere()}>
            Sign out everywhere
          </Button>
        </div>
      </AccountBentoCard>
    </div>
  )
}
