import { CONSTELLATIONS } from './constellations'
import { holdById } from './holds'
import { itemById } from './items'
import { SHOUTS, STONES } from './spells'
import type { GameEvent } from './types'

const perkName = (id: string) => CONSTELLATIONS.flatMap((c) => c.perks).find((p) => p.id === id)?.name ?? id

/** Text for an event's dialog box. Words between pipes are highlighted gold. */
export function eventText(e: GameEvent): string {
  switch (e.type) {
    case 'skillUp': return `Your |${e.skill}| skill increased to |${e.level}|.`
    case 'levelUp': return `You have reached level |${e.level}|. Choose an attribute to advance.`
    case 'perk': return `|${perkName(e.perk)}| learned. That skill now trains faster.`
    case 'dragon': return `Every objective of |${e.quest}| is clear. |${e.dragon}| awaits.`
    case 'soul': return `You absorbed a |Dragon Soul|. You now hold |${e.total}|.`
    case 'container': return `Your |Health| has grown. A new container, filled to the brim.`
    case 'word': { const s = SHOUTS.find((x) => x.id === e.shout)!; return `A word of power learned: |${s.words[e.words - 1]}|. ${s.name} now ${e.words === 1 ? 'can be used' : `lasts ${[5, 10, 15][e.words - 1]} minutes`}.` }
    case 'hold': return `A new hold has opened on your map: |${holdById(e.hold).name}|. ${holdById(e.hold).hint}.`
    case 'item': return `You received |${itemById(e.item).name}|. ${itemById(e.item).text}`
    case 'streak': return `|${e.days}| nights chronicled in a row. The Divines take notice.`
    case 'damage': return `${e.overdue} overdue ${e.overdue === 1 ? 'quest has' : 'quests have'} worn you down. Finish or abandon them to recover.`
    case 'stone': return `${STONES.find((s) => s.id === e.stone)!.text}`
    case 'died': return ''
    case 'gold': case 'xp': case 'heal': case 'stamina': case 'objective': return ''
  }
}
