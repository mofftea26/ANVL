import { create } from 'zustand'

/**
 * Ephemeral mini-cart drawer open/close state (NOT persisted — the drawer
 * should never reopen itself on reload). Separate from the persisted cart store.
 */
interface CartDrawerState {
  open: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

export const useCartDrawerStore = create<CartDrawerState>((set) => ({
  open: false,
  openDrawer: () => set({ open: true }),
  closeDrawer: () => set({ open: false }),
}))
