import { useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { Button } from '@/shared/components/ui/Button'
import { Container } from '@/shared/components/ui/Container'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'

const schema = z.object({
  username: z.string().min(1, 'This field is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof schema>

const supabaseConfigured = Boolean(getSupabasePublicEnv())

export function AdminLoginPageRoute() {
  const {
    login,
    isAuthenticated,
    isHydrated,
    isRemoteCmsReady,
    remoteHydrateError,
    authMode,
  } = useAdminAuth()
  const navigate = useNavigate()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  useEffect(() => {
    if (isHydrated && isRemoteCmsReady && isAuthenticated) {
      void navigate({ to: '/admin', replace: true })
    }
  }, [isHydrated, isRemoteCmsReady, isAuthenticated, navigate])

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await login(values)
    if (!result.ok) {
      form.setError('password', { message: result.error })
      toast.error(result.error)
      return
    }
    toast.success('Signed in to ANVL Admin.')
    void navigate({ to: '/admin', replace: true })
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

          {remoteHydrateError ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-[12px] text-[var(--color-text-muted)]"
            >
              {remoteHydrateError}
            </p>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            <FormField
              label={idLabel}
              error={form.formState.errors.username?.message}
            >
              <Input
                type={supabaseConfigured ? 'email' : 'text'}
                autoComplete={idAutoComplete}
                placeholder={idPlaceholder}
                {...form.register('username')}
              />
            </FormField>
            <FormField
              label="Password"
              error={form.formState.errors.password?.message}
            >
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...form.register('password')}
              />
            </FormField>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
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
