import type { ItemId, SkillKey } from './types'

export interface Item {
  id: ItemId
  name: string
  icon: string
  kind: 'potion' | 'book' | 'gear'
  price: number
  text: string
  /** Potions: what they restore. */
  restore?: { health?: number; magicka?: number; stamina?: number }
  /** Books: skill XP granted when read. */
  book?: { skill: SkillKey; xp: number }
  /** Gear: XP multiplier while equipped, optionally for one skill. */
  boost?: { multiplier: number; skill?: SkillKey }
}

export const ITEMS: Item[] = [
  { id: 'potion-health', name: 'Potion of Healing', icon: '🍷', kind: 'potion', price: 25, text: 'Restores two hearts.', restore: { health: 8 } },
  { id: 'potion-magicka', name: 'Potion of Magicka', icon: '💙', kind: 'potion', price: 25, text: 'Restores half your Magicka.', restore: { magicka: 0.5 } },
  { id: 'potion-stamina', name: 'Potion of Stamina', icon: '💚', kind: 'potion', price: 25, text: 'Fills two Stamina segments.', restore: { stamina: 2 } },
  { id: 'book-restoration', name: 'The Book of Ancient Peace', icon: '📖', kind: 'book', price: 120, text: 'Reading it grants 60 Restoration XP.', book: { skill: 'RESTORATION', xp: 60 } },
  { id: 'book-enchanting', name: 'Catalogue of Armor Enchantments', icon: '📘', kind: 'book', price: 120, text: 'Reading it grants 60 Enchanting XP.', book: { skill: 'ENCHANTING', xp: 60 } },
  { id: 'book-smithing', name: "The Armorer's Challenge", icon: '📙', kind: 'book', price: 120, text: 'Reading it grants 60 Smithing XP.', book: { skill: 'SMITHING', xp: 60 } },
  { id: 'book-speech', name: 'A Dance in Fire', icon: '📗', kind: 'book', price: 120, text: 'Reading it grants 60 Speech XP.', book: { skill: 'SPEECH', xp: 60 } },
  { id: 'book-alchemy', name: 'Herbalist’s Guide to Skyrim', icon: '📕', kind: 'book', price: 120, text: 'Reading it grants 60 Alchemy XP.', book: { skill: 'ALCHEMY', xp: 60 } },
  { id: 'book-one-handed', name: 'Fire and Darkness', icon: '📔', kind: 'book', price: 120, text: 'Reading it grants 60 One-Handed XP.', book: { skill: 'ONE-HANDED', xp: 60 } },
  { id: 'book-two-handed', name: 'Words and Philosophy', icon: '📓', kind: 'book', price: 120, text: 'Reading it grants 60 Two-Handed XP.', book: { skill: 'TWO-HANDED', xp: 60 } },
  { id: 'book-alteration', name: 'Reality and Other Falsehoods', icon: '📒', kind: 'book', price: 120, text: 'Reading it grants 60 Alteration XP.', book: { skill: 'ALTERATION', xp: 60 } },
  { id: 'amulet-akatosh', name: 'Amulet of Akatosh', icon: '📿', kind: 'gear', price: 500, text: 'Every skill trains 10% faster while worn.', boost: { multiplier: 1.1 } },
  { id: 'gauntlets-scribe', name: 'Gauntlets of the Scribe', icon: '🧤', kind: 'gear', price: 600, text: 'Speech trains 25% faster while worn.', boost: { multiplier: 1.25, skill: 'SPEECH' } },
  { id: 'skeleton-key', name: 'Skeleton Key', icon: '🗝️', kind: 'gear', price: 2500, text: 'Nocturnal’s artifact. Every skill trains 30% faster while worn.', boost: { multiplier: 1.3 } },
]

export const itemById = (id: ItemId): Item => ITEMS.find((i) => i.id === id) ?? ITEMS[0]

/** What a dragon can drop. */
export const DRAGON_DROPS: ItemId[] = ['potion-health', 'potion-magicka', 'potion-stamina', 'book-restoration', 'book-speech', 'amulet-akatosh', 'gauntlets-scribe']
