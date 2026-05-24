import { useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { getSupabaseEnvIssue, isSupabaseAuthTarget } from '@/features/cms/api/supabasePublicEnv'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { Container } from '@/shared/components/ui/Container'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'

const schema = z.object({
  username: z.string().min(1, 'This field is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof schema>

const supabaseConfigured = isSupabaseAuthTarget()
const supabaseEnvIssue = getSupabaseEnvIssue()

const ADMIN_LOGIN_PASSWORD_ID = 'admin-login-password'

export function AdminLoginPageRoute() {
  const [showPassword, setShowPassword] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const {
    login,
    isAuthenticated,
    isHydrated,
    remoteHydrateError,
    authMode,
  } = useAdminAuth()
  const navigate = useNavigate()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      void navigate({ to: '/admin', replace: true })
    }
  }, [isHydrated, isAuthenticated, navigate])

  const onSubmit = form.handleSubmit(async (values) => {
    setSigningIn(true)
    try {
      const result = await login(values)
      if (!result.ok) {
        form.setError('password', { message: result.error })
        toast.error(result.error)
        return
      }
      toast.success('Signed in to ANVL Admin.')
      void navigate({ to: '/admin', replace: true })
    } finally {
      setSigningIn(false)
    }
  })

  const idLabel = supabaseConfigured ? 'Email' : 'Username'
  const idAutoComplete = supabaseConfigured ? 'email' : 'username'
  const idPlaceholder = supabaseConfigured ? 'you@company.com' : 'admin'

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--color-bg)] px-4 py-10">
      <Container className="max-w-md">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-7 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3 border-b border-[var(--color-line)] pb-5">
            <AnvlCompactMark
              className="h-8 w-auto text-[var(--color-heading)]"
              aria-hidden="true"
            />
            <div>
              <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
                ANVL Admin
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
            <AdminFormField
              label={idLabel}
              error={form.formState.errors.username?.message}
            >
              <AdminInput
                type={supabaseConfigured ? 'email' : 'text'}
                autoComplete={idAutoComplete}
                placeholder={idPlaceholder}
                {...form.register('username')}
              />
            </AdminFormField>
            <AdminFormField
              label="Password"
              htmlFor={ADMIN_LOGIN_PASSWORD_ID}
              error={form.formState.errors.password?.message}
            >
              <div className="relative">
                <AdminInput
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
                    <EyeOff size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                </IconButton>
              </div>
            </AdminFormField>
            <AdminButton
              type="submit"
              className="w-full"
              loading={signingIn}
              disabled={signingIn}
            >
              Sign in
            </AdminButton>
          </form>

          <p className="mt-5 rounded-lg border border-dashed border-[var(--color-line)] px-3 py-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            {authMode === 'supabase' ? (
              <>
                Supabase Auth — only users with{' '}
                <span className="font-mono text-[10px]">cms_profiles.role = admin</span>{' '}
                can use this panel. Create the user in Supabase Authentication and add
                their row in{' '}
                <span className="font-mono text-[10px]">public.cms_profiles</span>.
              </>
            ) : (
              <>
                Local static admin login — not production-ready. Set{' '}
                <span className="font-mono text-[10px]">VITE_ANVL_ADMIN_PASSWORD</span>{' '}
                in a local <span className="font-mono text-[10px]">.env</span> (see{' '}
                <span className="font-mono text-[10px]">.env.example</span>). When{' '}
                <span className="font-mono text-[10px]">VITE_SUPABASE_*</span> is set, this
                app uses Supabase instead.
              </>
            )}
          </p>
        </div>
      </Container>
    </div>
  )
}
