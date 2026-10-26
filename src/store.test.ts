import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { backend } from './lib/backend'
import { scribeChronicle } from './game/logic'
import type { GameFile } from './game/types'
import { useGame } from './store'

// No Firebase config under test, so the store runs on the localStorage backend.
const KEY = 'skyrim.local.saves.local-dragonborn@skyrim.test'
const stored = (): GameFile => (JSON.parse(localStorage.getItem(KEY) ?? '[]') as GameFile[]).find((f) => f.slot === 1)!
/** Another device writes straight to storage, without this one hearing about it. */
const writeElsewhere = (f: GameFile) => localStorage.setItem(KEY, JSON.stringify([f]))
const entry = { mood: 7, energy: 6, rest: 8, triumphs: [] }

beforeEach(async () => {
  vi.useFakeTimers()
  localStorage.clear()
  await backend.signIn('dragonborn@skyrim.test', '')
  useGame.getState().init()
  await vi.advanceTimersByTimeAsync(0)
  useGame.getState().createFile(1, 'Ysolda', 'Nord')
  await vi.advanceTimersByTimeAsync(6000)
})

afterEach(() => { vi.useRealTimers() })

it('saves progress made on this device', async () => {
  const { file, commit } = useGame.getState()
  commit(scribeChronicle(file!, entry, '2026-10-26').file)
  await vi.advanceTimersByTimeAsync(400)
  expect(stored().chronicles.map((c) => c.day)).toEqual(['2026-10-26'])
  expect(useGame.getState().notice).toBeNull()
})

it('a device holding an old copy loads the newer save instead of overwriting it', async () => {
  const old = useGame.getState().file!
  // The phone scribes Monday's chronicle; this tab slept through it.
  const phone = { ...scribeChronicle(old, entry, '2026-10-26').file, updatedAt: old.updatedAt + 60_000 }
  writeElsewhere(phone)

  // The sleeping tab wakes and changes its stale copy.
  useGame.getState().commit({ ...old, lastTick: '2026-10-26' })
  await vi.advanceTimersByTimeAsync(400)

  expect(stored()).toEqual(phone)
  expect(useGame.getState().file!.chronicles.map((c) => c.day)).toEqual(['2026-10-26'])
  expect(useGame.getState().notice).toMatch(/newer save/)

  // Having caught up, this device saves normally again.
  const { file, commit } = useGame.getState()
  commit({ ...file!, gold: 5 })
  await vi.advanceTimersByTimeAsync(400)
  expect(stored().gold).toBe(5)
  expect(stored().chronicles).toHaveLength(1)
})
