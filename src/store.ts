import { create } from 'zustand'
import { backend, type Slots, type User } from './lib/backend'
import { dailyTick, loadLastSave, newFile, travel as travelFile } from './game/logic'
import { LOADING_TIPS } from './game/spells'
import type { GameEvent, GameFile, HoldId } from './game/types'

export type Screen = 'title' | 'menu' | 'login' | 'files' | 'new' | 'game'

/** The Skyrim loading screen between places: cube, tip, bar; skippable once the work behind it is done. */
export interface Loading { tip: string; hold?: HoldId; ready: boolean }

interface State {
  user: User | null | undefined
  slots: Slots
  slotsLoaded: boolean
  screen: Screen
  newSlot: number | null
  file: GameFile | null
  events: GameEvent[]
  loading: Loading | null
  paused: boolean
  died: boolean
  init(): void
  go(screen: Screen): void
  loadThrough(mid: () => void, hold?: HoldId): Promise<void>
  skipLoading(): void
  startFile(slot: number): void
  createFile(slot: number, name: string, race: string): void
  eraseFile(slot: number): Promise<void>
  commit(file: GameFile, events?: GameEvent[]): void
  shiftEvent(): void
  travel(hold: HoldId): void
  setPaused(p: boolean): void
  continueAfterDeath(): void
  quitToMenu(): void
  signOut(): Promise<void>
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const MIN_LOADING_MS = 2200
let initialized = false
let unwatch: (() => void) | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null
let skipResolve: (() => void) | null = null

export const useGame = create<State>((set, get) => {
  const flushSave = () => {
    const { user, file } = get()
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = null
    if (user && file) backend.saveFile(user.uid, file).catch((e: unknown) => console.error('save failed', e))
  }
  const queueSave = () => { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(flushSave, 300) }
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flushSave)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick() })
  }
  const tick = () => {
    const { file } = get()
    if (!file) return
    const { file: next, events } = dailyTick(file)
    if (next !== file) get().commit(next, events)
  }

  return {
    user: undefined, slots: [null, null, null], slotsLoaded: false, screen: 'title', newSlot: null,
    file: null, events: [], loading: null, paused: false, died: false,

    init() {
      if (initialized) return
      initialized = true
      backend.onAuth((user) => {
        unwatch?.(); unwatch = null
        set({ user, slotsLoaded: false })
        if (!user) { set({ slots: [null, null, null], file: null }); return }
        unwatch = backend.watchFiles(user.uid, (slots) => {
          set({ slots, slotsLoaded: true })
          const { file } = get()
          const incoming = file && slots[file.slot - 1]
          if (incoming && incoming.updatedAt > file.updatedAt) set({ file: incoming })
        })
      })
    },

    go: (screen) => set({ screen }),

    /** Show the loading screen for at least MIN_LOADING_MS, then until the player taps (or at once if they already did). */
    async loadThrough(mid, hold) {
      const tip = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]
      set({ loading: { tip, hold, ready: false } })
      await wait(500)
      mid()
      await wait(MIN_LOADING_MS - 500)
      set((s) => (s.loading ? { loading: { ...s.loading, ready: true } } : {}))
      await Promise.race([new Promise<void>((r) => { skipResolve = r }), wait(2500)])
      skipResolve = null
      set({ loading: null })
    },

    skipLoading: () => { if (get().loading?.ready) skipResolve?.() },

    startFile(slot) {
      const file = get().slots[slot - 1]
      if (!file) return
      void get().loadThrough(() => { set({ file, screen: 'game', events: [], paused: false, died: false }); tick() }, file.hold)
    },

    createFile(slot, name, race) {
      const { user } = get()
      if (!user) return
      const file = newFile(slot, name, race)
      const slots = [...get().slots]; slots[slot - 1] = file
      set({ slots, newSlot: null })
      backend.saveFile(user.uid, file).catch((e: unknown) => console.error('save failed', e))
      void get().loadThrough(() => set({ file, screen: 'game', events: [], paused: false, died: false }), 'riverwood')
    },

    async eraseFile(slot) { const { user } = get(); if (user) await backend.eraseFile(user.uid, slot) },

    commit(file, events = []) {
      const stamped = { ...file, updatedAt: Date.now() }
      const died = events.some((e) => e.type === 'died')
      set((s) => ({ file: stamped, events: [...s.events, ...events], died: s.died || died }))
      queueSave()
    },

    shiftEvent: () => set((s) => ({ events: s.events.slice(1) })),

    travel(hold) {
      const { file } = get()
      if (!file || file.hold === hold) return
      void get().loadThrough(() => { get().commit(travelFile(file, hold)); set({ paused: false }) }, hold)
    },

    setPaused: (paused) => set({ paused }),

    continueAfterDeath() {
      const { file } = get()
      if (!file) return
      get().commit(loadLastSave(file))
      set({ died: false, events: [] })
    },

    quitToMenu() {
      flushSave()
      void get().loadThrough(() => set({ file: null, screen: 'menu', paused: false, events: [], died: false }))
    },

    async signOut() { flushSave(); await backend.signOut(); set({ screen: 'title', file: null }) },
  }
})
