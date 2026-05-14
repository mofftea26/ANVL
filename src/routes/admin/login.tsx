import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { Button } from '@/shared/components/ui/Button'
import { Container } from '@/shared/components/ui/Container'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof schema>

export const Route = createFileRoute('/admin/login')({
  component: AdminLoginPage,
})

function AdminLoginPage() {
  const { login, isAuthenticated, isHydrated } = useAdminAuth()
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

  const onSubmit = form.handleSubmit((values) => {
    const result = login(values)
    if (!result.ok) {
      form.setError('password', { message: result.error })
      toast.error(result.error)
      return
    }
    toast.success('Signed in to ANVL Admin.')
    void navigate({ to: '/admin', replace: true })
  })

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

          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            <FormField
              label="Username"
              error={form.formState.errors.username?.message}
            >
              <Input
                autoComplete="username"
                placeholder="admin"
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
            Temporary static admin login — not production-ready. Replace with server
            sessions, rate-limited auth, HttpOnly cookies, and CSP before launch.
          </p>
        </div>
      </Container>
    </div>
  )
}
