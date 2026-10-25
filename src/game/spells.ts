import type { ShoutId, SkillKey, SpellId, StoneId } from './types'

export interface Spell { id: SpellId; name: string; school: string; cost: number; skill: SkillKey; xp: number; description: string; effect: string }

export const SPELLS: Spell[] = [
  { id: 'heal', name: 'Heal Self', school: 'Restoration', cost: 30, skill: 'RESTORATION', xp: 50, description: 'A basic mending of the spirit.', effect: 'Name three things you value about today. Restores two hearts.' },
  { id: 'calm', name: 'Calm', school: 'Illusion', cost: 40, skill: 'ALTERATION', xp: 50, description: 'Soothe the racing mind.', effect: 'Three rounds of 4-7-8 breathing.' },
  { id: 'transmute', name: 'Transmute Thought', school: 'Alteration', cost: 50, skill: 'ALTERATION', xp: 100, description: 'Turn iron worries into golden lessons.', effect: 'The scribe reframes a heavy thought.' },
  { id: 'familiar', name: 'Summon Familiar', school: 'Conjuration', cost: 30, skill: 'SPEECH', xp: 30, description: 'Call upon a trusted ally.', effect: 'A reminder to reach out to someone you trust.' },
]

export interface Shout { id: ShoutId; name: string; words: [string, string, string]; cost: number; description: string; effect: string }

export const SHOUTS: Shout[] = [
  { id: 'fus', name: 'Unrelenting Focus', words: ['FUS', 'RO', 'DAH'], cost: 2, description: 'Force your will upon the world and crush procrastination.', effect: 'Quests grant double XP for 5 / 10 / 15 minutes per word known.' },
  { id: 'tiid', name: 'Slow Time', words: ['TIID', 'KLO', 'UL'], cost: 2, description: 'Bend time to your will and silence the noise of the world.', effect: 'Pauses all messages for 5 / 10 / 15 minutes per word known.' },
  { id: 'feim', name: 'Ethereal Peace', words: ['FEIM', 'ZII', 'GRON'], cost: 1, description: 'The Voice is that of the spirit, not the body.', effect: 'Toggles Zen mode: the bars vanish, leaving only your focus.' },
]

/** Minutes a shout lasts per word known. */
export const SHOUT_MINUTES = [0, 5, 10, 15]

export interface Stone { id: StoneId; name: string; skills: SkillKey[]; text: string; icon: string }

export const STONES: Stone[] = [
  { id: 'warrior', name: 'The Warrior Stone', skills: ['ONE-HANDED', 'TWO-HANDED', 'SMITHING'], text: 'Those under the sign of the Warrior learn combat skills 20% faster.', icon: '⚔️' },
  { id: 'mage', name: 'The Mage Stone', skills: ['ALTERATION', 'RESTORATION', 'ENCHANTING'], text: 'Those under the sign of the Mage learn magic skills 20% faster.', icon: '🔮' },
  { id: 'thief', name: 'The Thief Stone', skills: ['SPEECH', 'ALCHEMY'], text: 'Those under the sign of the Thief learn stealth skills 20% faster.', icon: '🗝️' },
]

export const STONE_BONUS = 1.2

export const SKILL_MEANING: Record<SkillKey, string> = {
  RESTORATION: 'rest & recovery', ENCHANTING: 'work & focus', SMITHING: 'self-care & hygiene', SPEECH: 'relationships & honesty',
  ALCHEMY: 'food & nourishment', 'ONE-HANDED': 'daily movement', 'TWO-HANDED': 'hard training', ALTERATION: 'mindfulness',
}

export const LOADING_TIPS = [
  "Restoration is a perfectly valid school of magic. Don't let anyone tell you otherwise.",
  'A quest left overdue chips away at your health each dawn. Finish any quest to recover.',
  'Scribe a chronicle each night. It rests your Magicka and keeps your streak alive.',
  'Misc objectives are your dailies. Each one done fills a segment of Stamina, which Shouts spend.',
  'Every main quest ends with a dragon. Slay it for a Dragon Soul and a new word of power.',
  'Perks need a point and a skill level. Each one makes that skill train faster.',
  'Belethor in Whiterun sells potions, lore books and gear for gold.',
  'The Guardian Stones can be visited again from the map, if you wish to change your sign.',
  'Even the Dragonborn needs a consistent bedtime to keep their Magicka high.',
  'A sweetroll a day keeps the Thalmor away. Or at least makes the afternoon better.',
]

export const LYDIA_TIPS: Record<string, string[]> = {
  welcome: [
    'I am sworn to carry your burdens.',
    'Every task you take on is a |quest|. Finish quests to earn |gold|, recover |health| and train your |skills|.',
    'The quest |Unbound| will show you the way. Press |NEW QUEST| when you are ready to take something on.',
  ],
  overdue: ['A quest has gone |overdue|. Each dawn it will cost you a quarter heart until it is done or abandoned.'],
  misc: ['|Misc objectives| are daily. Mark one each day to fill your |Stamina|, which the Voice spends.'],
  main: ['A |main quest| is a long road: clear each objective and a |dragon| waits at the end. Slay it for a |Dragon Soul|.'],
  chronicle: ['Rest at the inn each night: a |chronicle| restores your |Magicka| and keeps your |streak| alive.'],
}
