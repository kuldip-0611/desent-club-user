import { create } from 'zustand'

type GstStore = {
  rate: number // e.g. 0.05 = 5%
  setRate: (rate: number) => void
}

export const useGstStore = create<GstStore>((set) => ({
  rate: 0.18, // default until fetched from settings
  setRate: (rate) => set({ rate }),
}))

/** Read current rate outside React (for cart summary calculations) */
export const getLiveGstRate = () => useGstStore.getState().rate
