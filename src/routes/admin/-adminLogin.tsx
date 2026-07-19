import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from '@/shared/icons'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { getSupabaseEnvIssue } from '@/features/cms/api/supabasePublicEnv'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { ICON_SIZE } from '@/shared/lib/iconSize'

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
})

type LoginFormValues = z.infer<typeof schema>

const supabaseEnvIssue = getSupabaseEnvIssue()

const ADMIN_LOGIN_PASSWORD_ID = 'admin-login-password'
const ADMIN_LOGIN_REMEMBER_ID = 'admin-login-remember'

export function AdminLoginPageRoute() {
  const [showPassword, setShowPassword] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const { login, remoteHydrateError } = useAdminAuth()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: true },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSigningIn(true)
    try {
      const result = await login(values)
      if (!result.ok) {
        form.setError('password', { message: result.error })
        toast.error(result.error)
        return
      }
      toast.success('Signed in to ANVL Studio.')
      window.location.assign('/admin')
    } finally {
      setSigningIn(false)
    }
  })

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-7 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3 border-b border-[var(--color-line)] pb-5">
            <AnvlCompactMark
              className="h-8 w-auto text-[var(--color-heading)]"
              aria-hidden="true"
            />
            <div>
              <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
                ANVL Studio
              </p>
              <h1 className="anvl-heading text-2xl font-normal leading-tight">
                Sign in
              </h1>
            </div>
          </div>

          {remoteHydrateError || supabaseEnvIssue ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-[12px] text-[var(--color-text-muted)]"
            >
              {remoteHydrateError ?? supabaseEnvIssue}
            </p>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            <FormField label="Email" error={form.formState.errors.email?.message} labelStyle="stacked">
              <Input
                density="compact"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...form.register('email')}
              />
            </FormField>
            <FormField
              label="Password"
              htmlFor={ADMIN_LOGIN_PASSWORD_ID}
              error={form.formState.errors.password?.message}
              labelStyle="stacked"
            >
              <div className="relative">
                <Input
                  density="compact"
                  id={ADMIN_LOGIN_PASSWORD_ID}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-12"
                  {...form.register('password')}
                />
                <IconButton
                  type="button"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 h-11 w-11 -translate-y-1/2 border-transparent bg-transparent hover:bg-[var(--color-surface-elevated)]"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff size={ICON_SIZE.lg} aria-hidden="true" />
                  ) : (
                    <Eye size={ICON_SIZE.lg} aria-hidden="true" />
                  )}
                </IconButton>
              </div>
            </FormField>

            <label
              htmlFor={ADMIN_LOGIN_REMEMBER_ID}
              className="focus-ring flex cursor-pointer items-center gap-2.5 rounded-md py-1 text-sm text-[var(--color-text-muted)]"
            >
              <Checkbox id={ADMIN_LOGIN_REMEMBER_ID} {...form.register('rememberMe')} />
              Remember me for 30 days
            </label>

            <Button
              type="submit"
              density="compact"
              className="w-full"
              loading={signingIn}
              disabled={signingIn}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-5 rounded-lg border border-dashed border-[var(--color-line)] px-3 py-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            Supabase Auth — only users with{' '}
            <span className="font-mono text-[10px]">cms_profiles.role = admin</span>{' '}
            can use this panel. Create the user in Supabase Authentication and add
            their row in <span className="font-mono text-[10px]">public.cms_profiles</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
