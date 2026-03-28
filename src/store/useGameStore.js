import { create } from 'zustand'

const PHASE_ORDER = [
  'splash',
  'laser1',
  'slots',
  'laser2',
  'roulette',
  'laser3',
  'blackjack',
  'vault',
  'reveal',
]

const INITIAL = {
  phase: 'splash',
  score: 1000,
  vaultDigits: ['_', '_', '_', '_', '_', '_', '_'],
  laserSection: 1,
  isInvincible: false,
  transitioning: false,
  sensorPermission: null,
}

const useGameStore = create((set, get) => ({
  ...INITIAL,

  setPhase: (phase) => {
    const section = phase === 'laser1' ? 1 : phase === 'laser2' ? 2 : phase === 'laser3' ? 3 : get().laserSection
    set({ phase, laserSection: section })
  },

  nextPhase: () => {
    const { phase } = get()
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx < PHASE_ORDER.length - 1) {
      const next = PHASE_ORDER[idx + 1]
      get().setPhase(next)
    }
  },

  addScore: (delta) => set((s) => ({ score: s.score + delta })),
  subtractScore: (delta) => set((s) => ({ score: Math.max(0, s.score - delta) })),

  setVaultDigits: (startIndex, digits) =>
    set((s) => {
      const next = [...s.vaultDigits]
      digits.forEach((d, i) => {
        next[startIndex + i] = d
      })
      return { vaultDigits: next }
    }),

  setInvincible: (val) => set({ isInvincible: val }),
  setTransitioning: (val) => set({ transitioning: val }),
  setSensorPermission: (val) => set({ sensorPermission: val }),

  resetGame: () => set({ ...INITIAL }),
}))

export default useGameStore
