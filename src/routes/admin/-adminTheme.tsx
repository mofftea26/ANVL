import { Navigate } from '@tanstack/react-router'

/** Brand fallbacks removed — loading emblem lives on Website layout. */
export function AdminThemePageRoute() {
  return <Navigate to="/admin/website-layout" replace />
}
