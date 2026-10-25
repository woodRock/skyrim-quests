import { useState } from 'react'
import { motion } from 'framer-motion'
import { holdById } from '../game/holds'
import { clearObjective, dragonReady, slayDragon } from '../game/logic'
import type { Quest } from '../game/types'
import { play } from '../lib/sfx'
import { useGame } from '../store'

/** A main quest: objectives as doors, the dragon at the end. */
export function MainQuestView({ quest, onEdit, onClose }: { quest: Quest; onEdit: () => void; onClose: () => void }) {
  const { file, commit } = useGame()
  const [facing, setFacing] = useState(false)
  const objs = quest.objectives ?? []
  const cleared = objs.filter((o) => o.done).length
  const ready = dragonReady(quest)

  const clear = (id: string) => {
    if (!file) return
    const r = clearObjective(file, quest.id, id)
    if (r.file === file) return
    play(r.events.some((e) => e.type === 'dragon') ? 'swish' : 'quest')
    commit(r.file, r.events)
  }
  const slay = () => { if (!file) return; const r = slayDragon(file, quest.id); play('levelup'); commit(r.file, r.events); onClose() }

  return (
    <>
      <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        <h2 className="skyrim-font">{quest.title}</h2>
        <p className="note serif">{holdById(quest.hold).name} · {cleared}/{objs.length} objectives · trains {quest.skill}</p>
        {quest.lore && <p className="lore serif">{quest.lore}</p>}
        {objs.map((o, i) => (
          <button key={o.id} className={`door ${o.done ? 'done' : ''}`} onClick={() => clear(o.id)} disabled={o.done || !!quest.doneAt}>
            <span className="diamond" /><span className="body"><span className="meaning">OBJECTIVE {i + 1}</span>{o.title}</span>{!o.done && <span className="meaning">clear</span>}
          </button>
        ))}
        {!quest.doneAt && (facing ? (
          <div className="panel confirm"><p className="serif">The dragon: <span className="hl">{quest.dragon}</span>. Is it slain?</p>
            <div className="row"><button className="btn gold skyrim-font" onClick={slay}>SLAIN</button><button className="btn skyrim-font" onClick={() => { play('close'); setFacing(false) }}>NOT YET</button></div></div>
        ) : (
          <button className={`dragon-door ${ready ? 'open' : ''}`} disabled={!ready} onClick={() => { play('open'); setFacing(true) }}>
            <span className="skyrim-font">{ready ? 'FACE THE DRAGON' : 'THE DRAGON WAITS'}</span>
            <span className="serif sub">{ready ? quest.dragon : 'Clear every objective first.'}</span>
          </button>
        ))}
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn skyrim-font" onClick={() => { play('close'); onClose() }}>LEAVE</button>
          {!quest.doneAt && <button className="btn skyrim-font" onClick={() => { play('click'); onEdit() }}>EDIT</button>}
        </div>
      </motion.div>
    </>
  )
}
