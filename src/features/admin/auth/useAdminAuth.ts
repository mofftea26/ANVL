import { useContext } from 'react'
import { AdminAuthContext } from './AdminAuthProvider'
import type { AdminAuthContextValue } from './adminAuth.types'

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) {
    throw new Error('useAdminAuth must be used inside <AdminAuthProvider />')
  }
  return ctx
}
