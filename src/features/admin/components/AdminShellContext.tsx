import { createContext, useContext } from 'react'

/** Whether the live-preview panel is currently docked open (set by AdminShell). */
export const AdminPreviewOpenContext = createContext(false)

export function useAdminPreviewOpen(): boolean {
  return useContext(AdminPreviewOpenContext)
}
