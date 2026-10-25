import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { holdById } from '../game/holds'
import { play } from '../lib/sfx'
import { useGame } from '../store'

/** Three save files. Tap an empty one to begin, a filled one to continue. */
export function Files() {
  const { slots, slotsLoaded, startFile, eraseFile, go } = useGame()
  const [selected, setSelected] = useState<number | null>(null)
  const [erasing, setErasing] = useState(false)
  const [confirm, setConfirm] = useState<number | null>(null)

  const choose = (slot: number) => {
    const file = slots[slot - 1]
    if (erasing) { if (!file) return play('close'); play('click'); return setConfirm(slot) }
    if (!file) { play('open'); useGame.setState({ newSlot: slot }); return go('new') }
    play('click'); setSelected(selected === slot ? null : slot)
  }

  return (
    <div className="screen menu-bg">
      <h2 className="menu-title skyrim-font">{erasing ? 'ERASE WHICH SAVE?' : 'LOAD GAME'}</h2>
      <div className="files">
        {[1, 2, 3].map((slot) => {
          const file = slots[slot - 1]
          return (
            <div key={slot}>
              <button className={`panel file ${selected === slot || confirm === slot ? 'selected' : ''}`} onClick={() => choose(slot)} disabled={!slotsLoaded}>
                <span className="num skyrim-font">{slot}</span>
                {file ? (
                  <span className="info">
                    <span className="name skyrim-font">{file.name}</span>
                    <span className="meta serif">Level {file.level} · {holdById(file.hold).name} · {file.streak} night streak</span>
                  </span>
                ) : <span className="empty serif">{slotsLoaded ? 'Empty' : '...'}</span>}
              </button>
              <AnimatePresence>
                {selected === slot && file && !erasing && (
                  <motion.div className="panel confirm" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <p className="serif">{file.quests.filter((q) => q.doneAt).length} quests done · {file.souls} dragon souls · {file.chronicles.length} chronicles</p>
                    <div className="row"><button className="btn gold skyrim-font" onClick={() => startFile(slot)}>CONTINUE</button><button className="btn skyrim-font" onClick={() => { play('close'); setSelected(null) }}>BACK</button></div>
                  </motion.div>
                )}
                {confirm === slot && file && (
                  <motion.div className="panel confirm" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <p className="serif">Erase <span className="hl">{file.name}</span> forever? There is no resurrection.</p>
                    <div className="row"><button className="btn danger skyrim-font" onClick={() => { play('damage'); void eraseFile(slot); setConfirm(null); setErasing(false) }}>ERASE</button><button className="btn skyrim-font" onClick={() => { play('close'); setConfirm(null) }}>KEEP</button></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
        <div className="row">
          <button className="btn skyrim-font" onClick={() => { play(erasing ? 'close' : 'click'); setErasing(!erasing); setConfirm(null); setSelected(null) }}>{erasing ? 'CANCEL' : 'ERASE'}</button>
          <button className="btn skyrim-font" onClick={() => { play('close'); go('menu') }}>BACK</button>
        </div>
      </div>
    </div>
  )
}
