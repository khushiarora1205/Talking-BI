// src/store/dashboardStore.js
import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('tbi_token')
    set({ user: null, isConnected: false, dbTables: [], messages: [] })
  },

  // DB
  isConnected: false,
  dbTables: [],
  setConnected: (tables) => set({ isConnected: true, dbTables: tables }),

  // Chat
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  // UI
  activeTheme: 'minimal',
  isLoading: false,
  voiceEnabled: false,
  setTheme: (theme) => set({ activeTheme: theme }),
  setLoading: (v) => set({ isLoading: v }),
  toggleVoice: () => set((s) => ({ voiceEnabled: !s.voiceEnabled })),
}))