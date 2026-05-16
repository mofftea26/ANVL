import { create } from 'zustand'
import type { DropStatus } from '@/features/admin/drops/drops.types'

export type DropsListStatusTab = 'all' | DropStatus

type DropsListUiState = {
  search: string
  statusTab: DropsListStatusTab
  setSearch: (value: string) => void
  setStatusTab: (tab: DropsListStatusTab) => void
}

export const useDropsListUiStore = create<DropsListUiState>((set) => ({
  search: '',
  statusTab: 'all',
  setSearch: (search) => set({ search }),
  setStatusTab: (statusTab) => set({ statusTab }),
}))
