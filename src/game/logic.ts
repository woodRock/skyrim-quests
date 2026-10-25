/**
 * Pure game rules. Every function takes a GameFile and returns a new one plus
 * the events that happened, so the UI can play them back one at a time.
 */
import { CONSTELLATIONS } from './constellations'
import { HOLDS } from './holds'
import { DRAGON_DROPS, itemById } from './items'
import { raceByName } from './races'
import { SHOUTS, SHOUT_MINUTES, SPELLS, STONES, STONE_BONUS } from './spells'
import type { Chronicle, GameEvent, GameFile, HoldId, ItemId, Quest, QuestSize, ShoutId, SkillKey, SpellId, StoneId } from './types'
import { SKILL_KEYS } from './types'

export const GOLD: Record<QuestSize, number> = { small: 10, medium: 25, large: 100 }
export const SIDE_XP: Record<QuestSize, number> = { small: 20, medium: 40, large: 80 }
export const MISC_XP = 15
export const OBJECTIVE_XP = 25
export const DRAGON_XP = 150
export const DRAGON_GOLD = 100
export const PERK_BONUS = 0.05
export const PERK_BASE_LEVEL = 20
export const PERK_STEP_LEVEL = 5
export const STREAK_MILESTONES = [3, 7, 30, 100]
export const UNBOUND_ID = 'unbound'

export const today = (d = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export const yesterdayOf = (day: string): string => {
  const d = new Date(day + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  return today(d)
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')) / 86_400_000)

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
export const maxHealth = (f: GameFile) => f.containers * 4
export const isOverdue = (q: Quest, day = today()) => q.kind !== 'misc' && !q.doneAt && !!q.due && q.due < day
export const miscDoneToday = (q: Quest, day = today()) => q.kind === 'misc' && q.lastDone === day
export const dragonReady = (q: Quest) => q.kind === 'main' && !!q.objectives && q.objectives.length > 0 && q.objectives.every((o) => o.done)

type Result = { file: GameFile; events: GameEvent[] }
const clone = (f: GameFile): GameFile => structuredClone(f)

// ---------- creation ----------

export function newFile(slot: number, name: string, race: string, now = Date.now()): GameFile {
  const r = raceByName(race)
  const skills = Object.fromEntries(SKILL_KEYS.map((k) => {
    const bonus = k === r.major ? 10 : r.minor.includes(k) ? 5 : 0
    return [k, { level: 15 + bonus, xp: 0, xpToNext: 100 }]
  })) as GameFile['skills']
  return {
    slot, name, race: r.name, createdAt: now, updatedAt: now,
    level: 1, xp: 0, xpToNext: 100, pendingLevels: 0, perkPoints: 0, perks: [],
    skills,
    health: 12, containers: 3, magicka: 70, magickaMax: 100, stamina: 1, staminaMax: 5,
    gold: 0, souls: 0, shoutWords: { fus: 0, tiid: 0, feim: 0 }, stone: null,
    holds: ['riverwood'], hold: 'riverwood',
    quests: [unboundQuest(now)],
    chronicles: [], streak: 0, bestStreak: 0, lastTick: today(new Date(now)), tips: [], deaths: 0,
    items: [], equipped: null, surgeUntil: 0, slowUntil: 0, zen: false,
  }
}

/** The tutorial main quest. Its first objective is done the moment you are named. */
export function unboundQuest(now = Date.now()): Quest {
  return {
    id: UNBOUND_ID, kind: 'main', title: 'Unbound', skill: 'SPEECH', hold: 'riverwood', size: 'large', createdAt: now,
    lore: 'You awake bound in a cart, headed for the block. Fate has other plans. Learn the ways of this land before the road opens to Whiterun.',
    objectives: [
      { id: 'unbound-name', title: 'Name yourself', done: true },
      { id: 'unbound-side', title: 'Accept a side quest', done: false },
      { id: 'unbound-misc', title: 'Mark a misc objective done', done: false },
      { id: 'unbound-chronicle', title: 'Scribe your first chronicle', done: false },
    ],
    dragon: 'Reach Whiterun',
  }
}

// ---------- helpers ----------

/** How fast a skill trains right now: stone, perks owned in its tree, gear, and a Focus shout. */
export function xpMultiplier(f: GameFile, skill: SkillKey, now = Date.now()): number {
  let m = 1
  const stone = STONES.find((s) => s.id === f.stone)
  if (stone && stone.skills.includes(skill)) m *= STONE_BONUS
  const con = CONSTELLATIONS.find((c) => c.skillKey === skill)
  const owned = con ? con.perks.filter((p) => f.perks.includes(p.id)).length : 0
  if (owned) m *= 1 + PERK_BONUS * owned
  if (f.equipped) {
    const gear = itemById(f.equipped)
    if (gear.boost && (!gear.boost.skill || gear.boost.skill === skill)) m *= gear.boost.multiplier
  }
  if (f.surgeUntil > now) m *= 2
  return m
}

function grantXP(f: GameFile, skill: SkillKey, base: number, events: GameEvent[], now: number) {
  const amount = Math.floor(base * xpMultiplier(f, skill, now))
  const s = f.skills[skill]
  s.xp += amount
  events.push({ type: 'xp', skill, amount })
  while (s.xp >= s.xpToNext) {
    s.xp -= s.xpToNext
    s.level += 1
    s.xpToNext = Math.floor(s.xpToNext * 1.2)
    f.xp += s.level * 10
    events.push({ type: 'skillUp', skill, level: s.level })
  }
  while (f.xp >= f.xpToNext) {
    f.xp -= f.xpToNext
    f.xpToNext = Math.floor(f.xpToNext * 1.5)
    f.pendingLevels += 1
    events.push({ type: 'levelUp', level: f.level + f.pendingLevels })
  }
}

/** A Speech perk (Truth-Teller) pays 10% more gold. */
export const hasPerk = (f: GameFile, id: string) => f.perks.includes(id)

function addGold(f: GameFile, amount: number, events: GameEvent[]) {
  const paid = Math.round(amount * (hasPerk(f, 'speech_4') ? 1.1 : 1))
  f.gold += paid
  events.push({ type: 'gold', amount: paid })
}

function heal(f: GameFile, quarters: number, events: GameEvent[]) {
  const before = f.health
  f.health = Math.min(maxHealth(f), f.health + quarters)
  if (f.health > before) events.push({ type: 'heal', quarters: f.health - before })
}

function addStamina(f: GameFile, segments: number, events: GameEvent[]) {
  const before = f.stamina
  f.stamina = Math.min(f.staminaMax, f.stamina + segments)
  if (f.stamina > before) events.push({ type: 'stamina', segments: f.stamina - before })
}

function completeObjectiveById(f: GameFile, questId: string, objId: string, events: GameEvent[], now: number) {
  const q = f.quests.find((x) => x.id === questId)
  const o = q?.objectives?.find((x) => x.id === objId)
  if (!q || !o || o.done || q.doneAt) return
  o.done = true
  heal(f, 2, events)
  grantXP(f, q.skill, OBJECTIVE_XP, events, now)
  const remaining = q.objectives!.filter((x) => !x.done).length
  if (remaining === 0) events.push({ type: 'dragon', quest: q.title, dragon: q.dragon ?? 'the dragon' })
  else events.push({ type: 'objective', quest: q.title, remaining })
}

function checkHolds(f: GameFile, events: GameEvent[]) {
  for (const h of HOLDS) {
    if (!f.holds.includes(h.id) && h.unlocked(f)) {
      f.holds.push(h.id)
      events.push({ type: 'hold', hold: h.id })
    }
  }
}

// ---------- quests ----------

export function addQuest(file: GameFile, q: Omit<Quest, 'id' | 'createdAt'>, now = Date.now()): Result {
  const f = clone(file)
  const events: GameEvent[] = []
  f.quests.unshift({ ...q, id: uid(), createdAt: now })
  if (q.kind === 'side') completeObjectiveById(f, UNBOUND_ID, 'unbound-side', events, now)
  return { file: f, events }
}

export function updateQuest(file: GameFile, id: string, patch: Partial<Quest>): GameFile {
  const f = clone(file)
  f.quests = f.quests.map((q) => (q.id === id ? { ...q, ...patch } : q))
  return f
}

export function removeQuest(file: GameFile, id: string): GameFile {
  const f = clone(file)
  f.quests = f.quests.filter((q) => q.id !== id)
  return f
}

export function completeSide(file: GameFile, id: string, now = Date.now()): Result {
  const f = clone(file)
  const events: GameEvent[] = []
  const q = f.quests.find((x) => x.id === id)
  if (!q || q.kind !== 'side' || q.doneAt) return { file, events }
  q.doneAt = now
  addGold(f, GOLD[q.size], events)
  grantXP(f, q.skill, SIDE_XP[q.size], events, now)
  heal(f, 1, events)
  checkHolds(f, events)
  return { file: f, events }
}

export function markMisc(file: GameFile, id: string, day = today(), now = Date.now()): Result {
  const f = clone(file)
  const events: GameEvent[] = []
  const q = f.quests.find((x) => x.id === id)
  if (!q || q.kind !== 'misc' || q.lastDone === day) return { file, events }
  q.lastDone = day
  q.completions = (q.completions ?? 0) + 1
  grantXP(f, q.skill, MISC_XP, events, now)
  addStamina(f, 1, events)
  heal(f, 1, events)
  completeObjectiveById(f, UNBOUND_ID, 'unbound-misc', events, now)
  checkHolds(f, events)
  return { file: f, events }
}

export function clearObjective(file: GameFile, questId: string, objId: string, now = Date.now()): Result {
  const f = clone(file)
  const events: GameEvent[] = []
  const before = events.length
  completeObjectiveById(f, questId, objId, events, now)
  return events.length === before ? { file, events } : { file: f, events }
}

export function slayDragon(file: GameFile, questId: string, now = Date.now(), random = Math.random): Result {
  const f = clone(file)
  const events: GameEvent[] = []
  const q = f.quests.find((x) => x.id === questId)
  if (!q || q.kind !== 'main' || q.doneAt || !dragonReady(q)) return { file, events }
  q.doneAt = now
  grantXP(f, q.skill, DRAGON_XP, events, now)
  addGold(f, DRAGON_GOLD, events)
  f.souls += 1
  events.push({ type: 'soul', total: f.souls })
  unlockWord(f, events)
  f.containers += 1
  f.health = maxHealth(f)
  events.push({ type: 'container' })
  const drop = DRAGON_DROPS[Math.floor(random() * DRAGON_DROPS.length)]
  f.items.push({ uid: uid(), id: drop })
  events.push({ type: 'item', item: drop })
  checkHolds(f, events)
  return { file: f, events }
}

/** Each soul teaches the next word: first word of every shout, then the second, then the third. */
function unlockWord(f: GameFile, events: GameEvent[]) {
  const order: ShoutId[] = ['fus', 'tiid', 'feim']
  for (let tier = 1; tier <= 3; tier++) {
    for (const s of order) {
      if (f.shoutWords[s] < tier) {
        f.shoutWords[s] = tier
        events.push({ type: 'word', shout: s, words: tier })
        return
      }
    }
  }
}

// ---------- the chronicle ----------

export function scribeChronicle(file: GameFile, entry: Omit<Chronicle, 'day' | 'at'>, day = today(), now = Date.now()): Result {
  if (file.chronicles.some((c) => c.day === day)) return { file, events: [] }
  const f = clone(file)
  const events: GameEvent[] = []
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const c: Chronicle = {
    day, at: now,
    mood: clamp(Math.round(entry.mood), 1, 10), energy: clamp(Math.round(entry.energy), 1, 10),
    rest: clamp(entry.rest, 0, 24), triumphs: entry.triumphs.map((t) => t.trim()).filter(Boolean).slice(0, 3),
  }
  f.chronicles = [...f.chronicles, c].slice(-3650)  // ten years of nights; the rules allow 5000
  const last = file.chronicles[file.chronicles.length - 1]
  f.streak = last && last.day === yesterdayOf(day) ? f.streak + 1 : 1
  f.bestStreak = Math.max(f.bestStreak, f.streak)
  f.magicka = Math.min(f.magickaMax, f.magicka + Math.round((Math.min(c.rest, 8) / 8) * f.magickaMax))
  addStamina(f, 1, events)
  if (STREAK_MILESTONES.includes(f.streak)) events.push({ type: 'streak', days: f.streak })
  completeObjectiveById(f, UNBOUND_ID, 'unbound-chronicle', events, now)
  checkHolds(f, events)
  return { file: f, events }
}

// ---------- vitals and the daily tick ----------

/** Runs once per day: each overdue quest costs a quarter heart per day, capped so an absence never costs more than three hearts. */
export function dailyTick(file: GameFile, day = today()): Result {
  if (file.lastTick >= day) return { file, events: [] }
  const f = clone(file)
  const events: GameEvent[] = []
  const days = Math.min(7, Math.max(1, daysBetween(f.lastTick, day)))
  const overdue = f.quests.filter((q) => isOverdue(q, day)).length
  f.lastTick = day
  // A missed chronicle breaks the streak.
  const last = f.chronicles[f.chronicles.length - 1]
  if (f.streak > 0 && (!last || daysBetween(last.day, day) > 1)) f.streak = 0
  if (overdue > 0 && f.health > 0) {
    const quarters = Math.min(12, Math.min(overdue, 4) * days, f.health)
    f.health -= quarters
    events.push({ type: 'damage', quarters, overdue })
    if (f.health <= 0) events.push({ type: 'died' })
  }
  return { file: f, events }
}

export function loadLastSave(file: GameFile): GameFile {
  const f = clone(file)
  f.health = Math.max(4, Math.ceil(maxHealth(f) / 2))
  f.deaths += 1
  return f
}

// ---------- levels, perks, stones ----------

export function advanceLevel(file: GameFile, attr: 'health' | 'magicka' | 'stamina'): Result {
  if (file.pendingLevels <= 0) return { file, events: [] }
  const f = clone(file)
  f.pendingLevels -= 1
  f.level += 1
  f.perkPoints += 1
  if (attr === 'health') { f.containers += 1; f.health = maxHealth(f) }
  if (attr === 'magicka') { f.magickaMax += 10; f.magicka = f.magickaMax }
  if (attr === 'stamina') { f.staminaMax = Math.min(10, f.staminaMax + 1); f.stamina = f.staminaMax }
  return { file: f, events: [] }
}

export interface PerkStatus { owned: boolean; linked: boolean; need: number; have: number; available: boolean }

/** A perk needs a point, a path through its constellation, and a skill level: 20 for the root star, +5 per star after it. */
export function perkStatus(f: GameFile, perkId: string): PerkStatus {
  const con = CONSTELLATIONS.find((c) => c.perks.some((p) => p.id === perkId))
  if (!con) return { owned: false, linked: false, need: 0, have: 0, available: false }
  const idx = con.perks.findIndex((p) => p.id === perkId)
  const owned = f.perks.includes(perkId)
  const linked = idx === 0 || con.lines.some(([s, e]) => (e === idx && f.perks.includes(con.perks[s].id)) || (s === idx && f.perks.includes(con.perks[e].id)))
  const need = PERK_BASE_LEVEL + idx * PERK_STEP_LEVEL
  const have = f.skills[con.skillKey as SkillKey]?.level ?? 0
  return { owned, linked, need, have, available: !owned && linked && have >= need && f.perkPoints > 0 }
}

export function unlockPerk(file: GameFile, perkId: string): Result {
  if (!perkStatus(file, perkId).available) return { file, events: [] }
  const f = clone(file)
  f.perkPoints -= 1
  f.perks.push(perkId)
  return { file: f, events: [{ type: 'perk', perk: perkId }] }
}

export function chooseStone(file: GameFile, stone: StoneId): Result {
  if (file.stone === stone) return { file, events: [] }
  const f = clone(file)
  f.stone = stone
  return { file: f, events: [{ type: 'stone', stone }] }
}

// ---------- magic ----------

export const spellCost = (f: GameFile, id: SpellId) => {
  const s = SPELLS.find((x) => x.id === id)!
  return id === 'heal' && hasPerk(f, 'rest_4') ? Math.round(s.cost / 2) : s.cost
}

export function castSpell(file: GameFile, id: SpellId): Result {
  const cost = spellCost(file, id)
  if (file.magicka < cost) return { file, events: [] }
  const f = clone(file)
  f.magicka -= cost
  return { file: f, events: [] }
}

/** The exercise behind the spell was finished: grant its XP and effect. */
export function finishSpell(file: GameFile, id: SpellId, now = Date.now()): Result {
  const f = clone(file)
  const events: GameEvent[] = []
  const s = SPELLS.find((x) => x.id === id)!
  grantXP(f, s.skill, s.xp, events, now)
  if (id === 'heal') heal(f, 8, events)
  if (id === 'calm' && hasPerk(f, 'alt_3')) addStamina(f, 1, events)
  return { file: f, events }
}

export function shout(file: GameFile, id: ShoutId, now = Date.now()): Result {
  const words = file.shoutWords[id]
  const def = SHOUTS.find((s) => s.id === id)!
  if (words < 1 || file.stamina < def.cost) return { file, events: [] }
  const f = clone(file)
  f.stamina -= def.cost
  const until = now + SHOUT_MINUTES[words] * 60_000
  if (id === 'fus') f.surgeUntil = until
  if (id === 'tiid') f.slowUntil = until
  if (id === 'feim') f.zen = !f.zen
  return { file: f, events: [] }
}

// ---------- items ----------

export function buyItem(file: GameFile, id: ItemId): Result {
  const item = itemById(id)
  if (file.gold < item.price) return { file, events: [] }
  const f = clone(file)
  f.gold -= item.price
  f.items.push({ uid: uid(), id })
  return { file: f, events: [{ type: 'item', item: id }] }
}

export function consumeItem(file: GameFile, itemUid: string, now = Date.now()): Result {
  const inst = file.items.find((i) => i.uid === itemUid)
  if (!inst) return { file, events: [] }
  const item = itemById(inst.id)
  const f = clone(file)
  const events: GameEvent[] = []
  if (item.kind === 'gear') {
    f.equipped = f.equipped === item.id ? null : item.id
    return { file: f, events }
  }
  f.items = f.items.filter((i) => i.uid !== itemUid)
  if (item.restore?.health) heal(f, item.restore.health, events)
  if (item.restore?.magicka) f.magicka = Math.min(f.magickaMax, f.magicka + Math.round(f.magickaMax * item.restore.magicka))
  if (item.restore?.stamina) addStamina(f, item.restore.stamina, events)
  if (item.book) grantXP(f, item.book.skill, item.book.xp, events, now)
  return { file: f, events }
}

// ---------- misc ----------

export function travel(file: GameFile, hold: HoldId): GameFile {
  if (!file.holds.includes(hold) || file.hold === hold) return file
  const f = clone(file)
  f.hold = hold
  return f
}

export function markTip(file: GameFile, tip: string): GameFile {
  if (file.tips.includes(tip)) return file
  const f = clone(file)
  f.tips.push(tip)
  return f
}

export const isBigEvent = (e: GameEvent) => !['gold', 'xp', 'heal', 'stamina', 'objective'].includes(e.type)
