import { useState } from 'react'
import { toast } from 'sonner'
import { Bell, KeyRound, ShieldCheck } from 'lucide-react'
import type { Customer } from '@/app/config/accountContracts'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import {
  useNewPasswordForm,
  useSettingsForm,
  useStorefrontAccountSession,
  useUpdateCustomerProfileMutation,
} from '@/features/storefront-account/publicAccount.core'
import {
  getStorefrontSupabaseClient,
  isStorefrontAuthEnabled,
  updatePasswordStorefront,
} from '@/features/storefront-account/auth'
import { AccountBentoCard } from '@/features/storefront-account/account/AccountBentoCard'
import { accountCardBg } from '@/features/storefront-account/account/accountCardBg'

export function SettingsPanel({ customer }: { customer: Customer | undefined }) {
  const prefsMutation = useUpdateCustomerProfileMutation()
  const prefsForm = useSettingsForm(customer)
  const pwForm = useNewPasswordForm()
  const logout = useStorefrontAccountSession((s) => s.logout)
  const realAuth = isStorefrontAuthEnabled()
  const [pwPending, setPwPending] = useState(false)

  const onSavePrefs = prefsForm.handleSubmit((values) => {
    prefsMutation.mutate(
      { marketingOptIn: values.marketingOptIn, orderUpdatesOptIn: values.orderUpdatesOptIn },
      {
        onSuccess: () => toast.success('Preferences saved.'),
        onError: () => toast.error('Could not save preferences.'),
      },
    )
  })

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
    const client = getStorefrontSupabaseClient()
    if (client) await client.auth.signOut({ scope: 'global' })
    logout()
    window.location.assign('/auth/sign-in')
  }

  const check = 'focus-ring mt-0.5 h-4 w-4 accent-[var(--color-accent)]'

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Notifications */}
      <form onSubmit={onSavePrefs}>
        <AccountBentoCard bg={accountCardBg('carbon')} eyebrow="Notifications" icon={<Bell size={15} />} className="h-full">
          <div className="space-y-3">
            <label className="flex items-start gap-3 text-sm text-[var(--color-text)]">
              <input type="checkbox" className={check} {...prefsForm.register('orderUpdatesOptIn')} />
              <span>Order updates — confirmations, shipping, and delivery emails.</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-[var(--color-text)]">
              <input type="checkbox" className={check} {...prefsForm.register('marketingOptIn')} />
              <span>Drops &amp; marketing — new releases and offers.</span>
            </label>
            <Button type="submit" disabled={prefsMutation.isPending}>
              {prefsMutation.isPending ? 'Saving…' : 'Save preferences'}
            </Button>
          </div>
        </AccountBentoCard>
      </form>

      {/* Change password */}
      {realAuth ? (
        <form onSubmit={onChangePassword} noValidate>
          <AccountBentoCard bg={accountCardBg('stone')} eyebrow="Password" icon={<KeyRound size={15} />} className="h-full">
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
      <AccountBentoCard bg={accountCardBg('ember')} eyebrow="Security" icon={<ShieldCheck size={15} />} className="lg:col-span-2">
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
