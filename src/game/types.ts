export type SkillKey =
  | 'RESTORATION' | 'ENCHANTING' | 'SMITHING' | 'SPEECH'
  | 'ALCHEMY' | 'ONE-HANDED' | 'TWO-HANDED' | 'ALTERATION'

export const SKILL_KEYS: SkillKey[] = [
  'RESTORATION', 'ENCHANTING', 'SMITHING', 'SPEECH', 'ALCHEMY', 'ONE-HANDED', 'TWO-HANDED', 'ALTERATION',
]

export type HoldId =
  | 'riverwood' | 'whiterun' | 'solitude' | 'riften' | 'winterhold'
  | 'markarth' | 'falkreath' | 'windhelm' | 'dawnstar' | 'stones'

export type QuestKind = 'side' | 'misc' | 'main'
export type QuestSize = 'small' | 'medium' | 'large'

export interface Objective { id: string; title: string; done: boolean }

export interface Quest {
  id: string
  kind: QuestKind
  title: string
  lore?: string
  skill: SkillKey
  hold: HoldId
  size: QuestSize
  /** ISO day (yyyy-mm-dd). Side and main quests only. */
  due?: string
  createdAt: number
  doneAt?: number
  /** Main quests: the steps to clear before the dragon. */
  objectives?: Objective[]
  /** Main quests: the final step. */
  dragon?: string
  /** Misc objectives: the last day this was done. */
  lastDone?: string
  /** Dailies: how many days this has been done. Each one counts toward opening the map. */
  completions?: number
}

export interface Chronicle {
  day: string
  mood: number
  energy: number
  rest: number
  triumphs: string[]
  at: number
}

export type StoneId = 'warrior' | 'mage' | 'thief'
export type ShoutId = 'fus' | 'tiid' | 'feim'
export type SpellId = 'heal' | 'calm' | 'transmute' | 'familiar'

export type ItemId =
  | 'potion-health' | 'potion-magicka' | 'potion-stamina'
  | 'book-restoration' | 'book-enchanting' | 'book-smithing' | 'book-speech'
  | 'book-alchemy' | 'book-one-handed' | 'book-two-handed' | 'book-alteration'
  | 'amulet-akatosh' | 'gauntlets-scribe' | 'skeleton-key'

export interface Skill { level: number; xp: number; xpToNext: number }

export interface GameFile {
  slot: number
  name: string
  race: string
  createdAt: number
  updatedAt: number
  level: number
  xp: number
  xpToNext: number
  pendingLevels: number
  perkPoints: number
  perks: string[]
  skills: Record<SkillKey, Skill>
  /** Quarter hearts, like the classics. */
  health: number
  containers: number
  magicka: number
  magickaMax: number
  stamina: number
  staminaMax: number
  gold: number
  souls: number
  shoutWords: Record<ShoutId, number>
  stone: StoneId | null
  holds: HoldId[]
  hold: HoldId
  quests: Quest[]
  chronicles: Chronicle[]
  streak: number
  bestStreak: number
  lastTick: string
  tips: string[]
  deaths: number
  items: { uid: string; id: ItemId }[]
  equipped: ItemId | null
  surgeUntil: number
  slowUntil: number
  zen: boolean
}

/** Things that happened as a result of play, shown to the player one at a time. */
export type GameEvent =
  | { type: 'gold'; amount: number }
  | { type: 'xp'; skill: SkillKey; amount: number }
  | { type: 'heal'; quarters: number }
  | { type: 'stamina'; segments: number }
  | { type: 'skillUp'; skill: SkillKey; level: number }
  | { type: 'levelUp'; level: number }
  | { type: 'perk'; perk: string }
  | { type: 'objective'; quest: string; remaining: number }
  | { type: 'dragon'; quest: string; dragon: string }
  | { type: 'soul'; total: number }
  | { type: 'container' }
  | { type: 'word'; shout: ShoutId; words: number }
  | { type: 'hold'; hold: HoldId }
  | { type: 'item'; item: ItemId }
  | { type: 'streak'; days: number }
  | { type: 'damage'; quarters: number; overdue: number }
  | { type: 'stone'; stone: StoneId }
  | { type: 'died' }
