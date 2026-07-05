import type { AdminSession } from '@/features/admin/auth/adminAuth.types'

export function sessionInitial(session: AdminSession): string {
  const email = session.email.trim()
  if (email) return (email[0] ?? 'A').toUpperCase()
  const name = session.displayName.trim()
  return (name[0] ?? 'A').toUpperCase()
}

export function sessionPrimaryLabel(session: AdminSession): string {
  return session.displayName.trim() || session.email.split('@')[0] || 'Admin'
}

export function sessionSecondaryLabel(session: AdminSession): string {
  return session.email
}

export function sessionShortLabel(session: AdminSession): string {
  const email = session.email.trim()
  if (email) {
    const local = email.split('@')[0] ?? email
    return local.length > 18 ? `${local.slice(0, 16)}…` : local
  }
  return session.displayName.trim() || 'Admin'
}
