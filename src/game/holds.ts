import type { GameFile, HoldId } from './types'

export interface Hold {
  id: HoldId
  name: string
  /** What sort of quests belong here. */
  hint: string
  sky: [string, string]
  ground: string
  unlock: string
  unlocked: (f: GameFile) => boolean
  /** For locked holds: how far along the player is, as [have, need]. */
  progress?: (f: GameFile) => [number, number]
}

export const mainsCleared = (f: GameFile) => f.quests.filter((q) => q.kind === 'main' && q.doneAt).length
/** Quests that count toward opening the map: every finished side or main quest, plus every day a daily was done. */
export const questsDone = (f: GameFile) => f.quests.reduce((n, q) => n + (q.kind === 'misc' ? (q.completions ?? 0) : q.doneAt ? 1 : 0), 0)

export const HOLDS: Hold[] = [
  { id: 'riverwood', name: 'Riverwood', hint: 'Every quest in Skyrim, in one place', sky: ['#2b3a4a', '#9fb3c8'], ground: '#3f5a3a', unlock: 'Always open', unlocked: () => true },
  { id: 'whiterun', name: 'Whiterun', hint: 'Home and chores', sky: ['#5a7aa8', '#e8d9b0'], ground: '#8a8a4a', unlock: 'Finish the quest Unbound', unlocked: (f) => mainsCleared(f) >= 1 },
  { id: 'stones', name: 'The Guardian Stones', hint: 'Choose the sign you train under', sky: ['#0a0e1a', '#2a3a6a'], ground: '#2a2f3a', unlock: 'Finish the quest Unbound', unlocked: (f) => mainsCleared(f) >= 1 },
  { id: 'solitude', name: 'Solitude', hint: 'Work and career', sky: ['#3a4a6a', '#c8d8e8'], ground: '#6a6a7a', unlock: 'Complete 5 quests', unlocked: (f) => questsDone(f) >= 5, progress: (f) => [questsDone(f), 5] },
  { id: 'riften', name: 'Riften', hint: 'Money and admin', sky: ['#5a3a1a', '#e8a860'], ground: '#5a4a2a', unlock: 'Complete 10 quests', unlocked: (f) => questsDone(f) >= 10, progress: (f) => [questsDone(f), 10] },
  { id: 'winterhold', name: 'Winterhold', hint: 'Learning and study', sky: ['#0e1a3a', '#8ab0e0'], ground: '#c8d8e8', unlock: 'Complete 15 quests', unlocked: (f) => questsDone(f) >= 15, progress: (f) => [questsDone(f), 15] },
  { id: 'markarth', name: 'Markarth', hint: 'Health and fitness', sky: ['#4a2a1a', '#d8a070'], ground: '#7a5a3a', unlock: 'Slay two dragons', unlocked: (f) => mainsCleared(f) >= 2, progress: (f) => [mainsCleared(f), 2] },
  { id: 'falkreath', name: 'Falkreath', hint: 'Rest and self-care', sky: ['#1a2a1a', '#6a8a5a'], ground: '#2a4a2a', unlock: 'Scribe seven chronicles', unlocked: (f) => f.chronicles.length >= 7, progress: (f) => [f.chronicles.length, 7] },
  { id: 'windhelm', name: 'Windhelm', hint: 'Friends and family', sky: ['#1a2a3a', '#a0b8c8'], ground: '#4a5a6a', unlock: 'Complete 25 quests', unlocked: (f) => questsDone(f) >= 25, progress: (f) => [questsDone(f), 25] },
  { id: 'dawnstar', name: 'Dawnstar', hint: 'The hard things', sky: ['#0a0a1a', '#5a6a8a'], ground: '#3a4a5a', unlock: 'Slay three dragons', unlocked: (f) => mainsCleared(f) >= 3, progress: (f) => [mainsCleared(f), 3] },
]

/** Riverwood is the hub: standing there you see every quest, as Hyrule Field did in the old app. */
export const questsVisibleFrom = (f: GameFile, hold: HoldId) => f.quests.filter((q) => hold === 'riverwood' || q.hold === hold)

export const holdById = (id: HoldId): Hold => HOLDS.find((h) => h.id === id) ?? HOLDS[0]
