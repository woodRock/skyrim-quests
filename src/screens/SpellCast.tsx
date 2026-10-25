import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { finishSpell } from '../game/logic'
import type { SpellId } from '../game/types'
import { reframe } from '../lib/lore'
import { play } from '../lib/sfx'
import { useGame } from '../store'

const BREATH: { step: string; ms: number }[] = [{ step: 'IN', ms: 4000 }, { step: 'HOLD', ms: 7000 }, { step: 'OUT', ms: 8000 }]
const ROUNDS = 3

/** The exercise behind each spell. Magicka was already spent; finishing grants the effect. */
export function SpellCast({ spell, onDone }: { spell: SpellId; onDone: () => void }) {
  const { file, commit } = useGame()
  const [values, setValues] = useState(['', '', ''])
  const [breath, setBreath] = useState({ idx: 0, round: 1 })
  const [thought, setThought] = useState('')
  const [lesson, setLesson] = useState('')
  const [busy, setBusy] = useState(false)

  const finish = () => { if (!file) return; const r = finishSpell(file, spell); play('spell'); commit(r.file, r.events); onDone() }

  useEffect(() => {
    if (spell !== 'calm') return
    let idx = 0, round = 1
    let t: ReturnType<typeof setTimeout>
    const next = () => { t = setTimeout(() => { idx += 1; if (idx >= BREATH.length) { idx = 0; round += 1 } if (round > ROUNDS) { finish(); return } setBreath({ idx, round }); next() }, BREATH[idx].ms) }
    next()
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spell])

  const forge = async () => { if (!thought.trim() || busy) return; setBusy(true); try { setLesson(await reframe(thought)) } finally { setBusy(false) } }

  return (
    <motion.div className={`cast ${spell === 'calm' ? 'opaque' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {spell === 'heal' && (
        <div className="panel sheet-like">
          <h2 className="skyrim-font">MEND SPIRIT</h2>
          <p className="serif">Name three things you value about today.</p>
          {values.map((v, i) => <input key={i} className="input" value={v} maxLength={120} placeholder={`Blessing ${i + 1}...`} aria-label={`Blessing ${i + 1}`} onChange={(e) => setValues(values.map((x, j) => (j === i ? e.target.value : x)))} />)}
          <div className="row"><button className="btn skyrim-font" onClick={onDone}>CANCEL</button><button className="btn gold skyrim-font" disabled={!values.every((v) => v.trim().length > 2)} onClick={finish}>RESTORE</button></div>
        </div>
      )}
      {spell === 'calm' && (
        <div className="breathing">
          <motion.div className="orb" animate={{ scale: BREATH[breath.idx].step === 'OUT' ? 1 : 1.5 }} transition={{ duration: BREATH[breath.idx].ms / 1000, ease: 'easeInOut' }} />
          <h1 className="skyrim-font">{BREATH[breath.idx].step}</h1>
          <p className="serif">Round {breath.round} of {ROUNDS} · Release the weight of the realm.</p>
          <button className="btn skyrim-font" onClick={onDone}>END EARLY</button>
        </div>
      )}
      {spell === 'transmute' && (
        <div className="panel sheet-like">
          <h2 className="skyrim-font">THOUGHT FORGE</h2>
          {!lesson ? (
            <>
              <p className="serif">Place your leaden worry into the fire.</p>
              <textarea className="input" rows={4} maxLength={500} value={thought} onChange={(e) => setThought(e.target.value)} placeholder="What weighs on your soul?" aria-label="Your thought" />
              <div className="row"><button className="btn skyrim-font" onClick={onDone}>CANCEL</button><button className="btn gold skyrim-font" disabled={busy || !thought.trim()} onClick={() => void forge()}>{busy ? 'FORGING...' : 'FORGE'}</button></div>
            </>
          ) : (
            <><p className="lesson serif">“{lesson}”</p><button className="btn gold wide skyrim-font" onClick={finish}>COLLECT WISDOM</button></>
          )}
        </div>
      )}
      {spell === 'familiar' && (
        <div className="panel sheet-like center">
          <h2 className="skyrim-font">SUMMON ALLY</h2>
          <div className="big-icon">🦅</div>
          <p className="serif">A true Dragonborn never walks alone. Send a message to someone you trust.</p>
          <div className="row"><button className="btn skyrim-font" onClick={onDone}>NOT NOW</button><button className="btn gold skyrim-font" onClick={finish}>I SHALL REACH OUT</button></div>
        </div>
      )}
    </motion.div>
  )
}
