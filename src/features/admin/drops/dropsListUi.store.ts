import { create } from 'zustand'

export type DropsListStatusTab = 'all' | 'inactive' | 'scheduled' | 'active'

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
