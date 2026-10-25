import { describe, it, expect } from 'vitest'
import {
  addQuest, advanceLevel, buyItem, castSpell, chooseStone, clearObjective, completeSide, dailyTick, finishSpell,
  loadLastSave, markMisc, maxHealth, newFile, perkStatus, scribeChronicle, shout, slayDragon, today, unlockPerk,
  consumeItem, xpMultiplier, UNBOUND_ID, yesterdayOf,
} from './logic'
import { CONSTELLATIONS } from './constellations'
import type { GameFile, Quest } from './types'

const base = () => newFile(1, 'Lydia', 'Nord', 1_000)
const side = (f: GameFile, size: Quest['size'] = 'medium') => addQuest(f, { kind: 'side', title: 'T', skill: 'SPEECH', hold: 'riverwood', size }, 1_000)
const misc = (f: GameFile) => addQuest(f, { kind: 'misc', title: 'D', skill: 'ALCHEMY', hold: 'riverwood', size: 'small' }, 1_000)

describe('new file', () => {
  it('applies race bonuses and starts with Unbound', () => {
    const f = base()
    expect(f.skills['TWO-HANDED'].level).toBe(25)
    expect(f.skills['ONE-HANDED'].level).toBe(20)
    expect(f.skills.SPEECH.level).toBe(15)
    expect(f.quests[0].id).toBe(UNBOUND_ID)
    expect(f.quests[0].objectives?.[0].done).toBe(true)
    expect(f.holds).toEqual(['riverwood'])
  })
})

describe('side quests', () => {
  it('accepting one clears the Unbound objective; completing pays gold, XP and a quarter heart', () => {
    let { file: f, events } = side(base())
    expect(events.some((e) => e.type === 'objective')).toBe(true)
    f.health = 4
    const id = f.quests[0].id
    ;({ file: f, events } = completeSide(f, id))
    expect(f.gold).toBe(25)
    expect(f.skills.SPEECH.xp).toBe(65) // 25 for the Unbound objective, 40 for the quest
    expect(f.health).toBe(5)
    expect(events.map((e) => e.type)).toEqual(['gold', 'xp', 'heal'])
    expect(completeSide(f, id).file).toBe(f) // idempotent
  })
  it('a Speech perk pays more gold', () => {
    let { file: f } = side(base(), 'large')
    f.perks = ['speech_4']
    ;({ file: f } = completeSide(f, f.quests[0].id))
    expect(f.gold).toBe(110)
  })
})

describe('misc objectives', () => {
  it('fill stamina once per day and clear the Unbound objective', () => {
    let { file: f } = misc(base())
    const id = f.quests[0].id
    f.stamina = 0
    ;({ file: f } = markMisc(f, id, '2026-10-25'))
    expect(f.stamina).toBe(1)
    expect(f.quests.find((q) => q.id === UNBOUND_ID)!.objectives!.find((o) => o.id === 'unbound-misc')!.done).toBe(true)
    expect(markMisc(f, id, '2026-10-25').file).toBe(f)
    expect(markMisc(f, id, '2026-10-26').file.stamina).toBe(2)
  })
})

describe('skill and character levels', () => {
  it('a skill levelling adds character XP and a level becomes pending at 100', () => {
    let f = base()
    f.skills.SPEECH.xp = 90
    const r = side(f, 'large')
    f = r.file
    ;({ file: f } = completeSide(f, f.quests[0].id))
    expect(f.skills.SPEECH.level).toBe(16)
    // 90 + 25 (objective) crosses 100 → Speech 16, +160 character XP → one level pending, 60 left over.
    expect(f.xp).toBe(60)
    expect(f.pendingLevels).toBe(1)
  })
  it('advancing a level grants a perk point and a vital', () => {
    let f = base(); f.pendingLevels = 1
    ;({ file: f } = advanceLevel(f, 'health'))
    expect(f.level).toBe(2); expect(f.perkPoints).toBe(1); expect(f.containers).toBe(4); expect(f.health).toBe(16)
    expect(advanceLevel(f, 'magicka').file).toBe(f)
  })
})

describe('perks', () => {
  const con = CONSTELLATIONS[0]
  it('need a point, a linked star and a skill level', () => {
    let f = base()
    expect(perkStatus(f, con.perks[0].id)).toMatchObject({ linked: true, need: 20, available: false })
    f.perkPoints = 1
    f.skills[con.skillKey as 'RESTORATION'].level = 20
    expect(perkStatus(f, con.perks[0].id).available).toBe(true)
    ;({ file: f } = unlockPerk(f, con.perks[0].id))
    expect(f.perks).toEqual([con.perks[0].id]); expect(f.perkPoints).toBe(0)
    expect(perkStatus(f, con.perks[1].id)).toMatchObject({ linked: true, need: 25, available: false })
    expect(xpMultiplier(f, 'RESTORATION', 0)).toBeCloseTo(1.05)
  })
})

describe('main quests and dragons', () => {
  it('clearing objectives heals and the dragon pays a soul, a word, a container and a drop', () => {
    let f = base()
    f.health = 4
    let r = clearObjective(f, UNBOUND_ID, 'unbound-side'); f = r.file
    expect(r.events.some((e) => e.type === 'objective')).toBe(true)
    expect(f.health).toBe(6)
    expect(slayDragon(f, UNBOUND_ID).file).toBe(f) // not ready
    f = clearObjective(f, UNBOUND_ID, 'unbound-misc').file
    r = clearObjective(f, UNBOUND_ID, 'unbound-chronicle'); f = r.file
    expect(r.events.some((e) => e.type === 'dragon')).toBe(true)
    r = slayDragon(f, UNBOUND_ID, 2_000, () => 0); f = r.file
    expect(f.souls).toBe(1); expect(f.shoutWords.fus).toBe(1); expect(f.containers).toBe(4); expect(f.health).toBe(16)
    expect(f.items).toHaveLength(1); expect(f.gold).toBe(100)
    expect(f.holds).toContain('whiterun'); expect(f.holds).toContain('stones')
    const types = r.events.map((e) => e.type)
    expect(types).toEqual(expect.arrayContaining(['soul', 'word', 'container', 'item', 'hold']))
  })
})

describe('chronicle', () => {
  it('restores magicka by rest, builds a streak, and only once a day', () => {
    let f = base(); f.magicka = 0; f.stamina = 0
    let r = scribeChronicle(f, { mood: 7, energy: 6, rest: 4, triumphs: ['a', '', 'b'] }, '2026-10-24'); f = r.file
    expect(f.magicka).toBe(50); expect(f.streak).toBe(1); expect(f.stamina).toBe(1)
    expect(f.chronicles[0].triumphs).toEqual(['a', 'b'])
    expect(scribeChronicle(f, { mood: 5, energy: 5, rest: 8, triumphs: [] }, '2026-10-24').file).toBe(f)
    f = scribeChronicle(f, { mood: 5, energy: 5, rest: 8, triumphs: [] }, '2026-10-25').file
    expect(f.streak).toBe(2)
    r = scribeChronicle(f, { mood: 5, energy: 5, rest: 8, triumphs: [] }, '2026-10-26'); f = r.file
    expect(f.streak).toBe(3); expect(r.events.some((e) => e.type === 'streak')).toBe(true)
    f = scribeChronicle(f, { mood: 5, energy: 5, rest: 8, triumphs: [] }, '2026-10-30').file
    expect(f.streak).toBe(1)
  })
  it('yesterdayOf crosses months', () => { expect(yesterdayOf('2026-11-01')).toBe('2026-10-31') })
})

describe('daily tick', () => {
  it('overdue quests cost a quarter heart per day, capped, and can kill', () => {
    let f = base(); f.lastTick = '2026-10-20'
    f = addQuest(f, { kind: 'side', title: 'late', skill: 'SPEECH', hold: 'riverwood', size: 'small', due: '2026-10-21' }, 1_000).file
    let r = dailyTick(f, '2026-10-22'); f = r.file
    expect(f.health).toBe(10); expect(r.events[0]).toMatchObject({ type: 'damage', quarters: 2, overdue: 1 })
    expect(dailyTick(f, '2026-10-22').file).toBe(f)
    f.lastTick = '2026-10-01'; f.health = 12
    r = dailyTick(f, '2026-10-30'); f = r.file
    expect(f.health).toBe(5) // capped at 7 days × 1 overdue
    f.lastTick = '2026-10-01'; f.health = 3
    r = dailyTick(f, '2026-11-20'); f = r.file
    expect(f.health).toBe(0); expect(r.events.some((e) => e.type === 'died')).toBe(true)
    f = loadLastSave(f)
    expect(f.health).toBe(6); expect(f.deaths).toBe(1)
  })
  it('a missed night breaks the streak', () => {
    let f = scribeChronicle(base(), { mood: 5, energy: 5, rest: 8, triumphs: [] }, '2026-10-20').file
    f.lastTick = '2026-10-20'
    f = dailyTick(f, '2026-10-22').file
    expect(f.streak).toBe(0)
  })
})

describe('magic', () => {
  it('spells cost magicka, perks discount Heal Self, finishing grants XP and effect', () => {
    let f = base(); f.magicka = 30; f.health = 4
    expect(castSpell(f, 'calm').file).toBe(f)
    f = castSpell(f, 'heal').file; expect(f.magicka).toBe(0)
    f = finishSpell(f, 'heal').file; expect(f.health).toBe(12); expect(f.skills.RESTORATION.xp).toBe(50)
    f.perks = ['rest_4']; f.magicka = 15
    expect(castSpell(f, 'heal').file.magicka).toBe(0)
  })
  it('shouts need a word and stamina, last longer with more words', () => {
    let f = base(); f.stamina = 5
    expect(shout(f, 'fus').file).toBe(f)
    f.shoutWords.fus = 2
    f = shout(f, 'fus', 0).file
    expect(f.stamina).toBe(3); expect(f.surgeUntil).toBe(10 * 60_000)
    expect(xpMultiplier(f, 'SPEECH', 1)).toBe(2)
    f.shoutWords.feim = 1; f = shout(f, 'feim').file; expect(f.zen).toBe(true)
  })
})

describe('merchant and items', () => {
  it('buys with gold, potions restore, books teach, gear equips', () => {
    let f = base(); f.gold = 160; f.health = 2; f.stamina = 0
    expect(buyItem(f, 'skeleton-key').file).toBe(f)
    f = buyItem(f, 'potion-health').file; f = buyItem(f, 'book-speech').file
    expect(f.gold).toBe(15); expect(f.items).toHaveLength(2)
    f = consumeItem(f, f.items[0].uid).file; expect(f.health).toBe(10); expect(f.items).toHaveLength(1)
    f = consumeItem(f, f.items[0].uid).file; expect(f.skills.SPEECH.xp).toBe(60); expect(f.items).toHaveLength(0)
    f.items.push({ uid: 'g', id: 'amulet-akatosh' })
    f = consumeItem(f, 'g').file; expect(f.equipped).toBe('amulet-akatosh'); expect(xpMultiplier(f, 'ALCHEMY', 0)).toBeCloseTo(1.1)
    f = consumeItem(f, 'g').file; expect(f.equipped).toBeNull()
  })
  it('stones boost their trees', () => {
    const f = chooseStone(base(), 'thief').file
    expect(xpMultiplier(f, 'SPEECH', 0)).toBeCloseTo(1.2); expect(xpMultiplier(f, 'SMITHING', 0)).toBe(1)
    expect(maxHealth(f)).toBe(12); expect(today().length).toBe(10)
  })
})
