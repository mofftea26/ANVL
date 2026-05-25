import type { useAdminAuth } from '@/features/admin/auth/useAdminAuth'

type AdminSession = NonNullable<ReturnType<typeof useAdminAuth>['session']>

export function sessionInitial(session: AdminSession): string {
  if (session.kind === 'supabase') {
    const email = session.email.trim()
    if (email) return (email[0] ?? 'A').toUpperCase()
    const name = session.displayName.trim()
    return (name[0] ?? 'A').toUpperCase()
  }
  return (session.username[0] ?? 'A').toUpperCase()
}

export function sessionPrimaryLabel(session: AdminSession): string {
  if (session.kind === 'supabase') {
    return session.displayName.trim() || session.email.split('@')[0] || 'Admin'
  }
  return session.username
}

export function sessionSecondaryLabel(session: AdminSession): string {
  if (session.kind === 'supabase') return session.email
  return 'Local session'
}

export function sessionShortLabel(session: AdminSession): string {
  if (session.kind === 'supabase') {
    const email = session.email.trim()
    if (email) {
      const local = email.split('@')[0] ?? email
      return local.length > 18 ? `${local.slice(0, 16)}…` : local
    }
    return session.displayName.trim() || 'Admin'
  }
  return session.username
}
