import type { SkillKey } from './types'

export interface Race { name: string; major: SkillKey; minor: SkillKey[]; blurb: string }

/** Skyrim's +10 / +5 starting skill bonuses, mapped onto the eight real-life skills. */
export const RACES: Race[] = [
  { name: 'Nord', major: 'TWO-HANDED', minor: ['ONE-HANDED', 'SMITHING'], blurb: 'Hardy and strong. Training comes naturally.' },
  { name: 'Imperial', major: 'SPEECH', minor: ['RESTORATION', 'ENCHANTING'], blurb: 'Diplomats and traders. Words carry further.' },
  { name: 'Breton', major: 'ALTERATION', minor: ['RESTORATION', 'SPEECH'], blurb: 'Born to the arcane. A calm, deliberate mind.' },
  { name: 'Redguard', major: 'ONE-HANDED', minor: ['TWO-HANDED', 'SMITHING'], blurb: 'The finest warriors in Tamriel. Movement is life.' },
  { name: 'Altmer', major: 'ENCHANTING', minor: ['ALTERATION', 'RESTORATION'], blurb: 'Scholars of the arcane. Focus is a discipline.' },
  { name: 'Bosmer', major: 'ALCHEMY', minor: ['ONE-HANDED', 'SPEECH'], blurb: 'Hunters of the forest. What you eat matters.' },
  { name: 'Dunmer', major: 'ALCHEMY', minor: ['ALTERATION', 'ENCHANTING'], blurb: 'Ashlanders. Resilient through hardship.' },
  { name: 'Orc', major: 'SMITHING', minor: ['TWO-HANDED', 'ONE-HANDED'], blurb: 'Smiths and warriors. Maintenance is strength.' },
  { name: 'Khajiit', major: 'ONE-HANDED', minor: ['ALCHEMY', 'SPEECH'], blurb: 'Quick and curious. Always moving.' },
  { name: 'Argonian', major: 'RESTORATION', minor: ['ALTERATION', 'ALCHEMY'], blurb: 'Children of the Hist. Rest heals all.' },
]

export const raceByName = (name: string): Race => RACES.find((r) => r.name === name) ?? RACES[0]
