import { create } from 'zustand'

export type Screen = 'learn' | 'review' | 'league' | 'dictionary' | 'profile'

export interface Toast {
  id: string
  title: string
  body?: string
  icon?: string
}

interface UiState {
  screen: Screen
  lesson: { unitId: number; lesson: number } | null
  reviewSession: { mode: 'due' | 'mistakes'; wordIds: string[] } | null
  settingsOpen: boolean
  installOpen: boolean
  profileOpen: boolean
  toasts: Toast[]
  setScreen: (screen: Screen) => void
  openLesson: (unitId: number, lesson: number) => void
  closeLesson: () => void
  startReview: (mode: 'due' | 'mistakes', wordIds: string[]) => void
  closeReview: () => void
  openSettings: () => void
  closeSettings: () => void
  openInstall: () => void
  closeInstall: () => void
  openProfile: () => void
  closeProfile: () => void
  pushToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  screen: 'learn',
  lesson: null,
  reviewSession: null,
  settingsOpen: false,
  installOpen: false,
  profileOpen: false,
  toasts: [],
  setScreen: (screen) => set({ screen }),
  openLesson: (unitId, lesson) => set({ lesson: { unitId, lesson } }),
  closeLesson: () => set({ lesson: null }),
  startReview: (mode, wordIds) => set({ reviewSession: { mode, wordIds } }),
  closeReview: () => set({ reviewSession: null }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  openInstall: () => set({ installOpen: true }),
  closeInstall: () => set({ installOpen: false }),
  openProfile: () => set({ profileOpen: true }),
  closeProfile: () => set({ profileOpen: false }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
      ].slice(-3),
    })),
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
