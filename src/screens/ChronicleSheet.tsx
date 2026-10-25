import { useState } from 'react'
import { motion } from 'framer-motion'
import { scribeChronicle } from '../game/logic'
import { play } from '../lib/sfx'
import { useGame } from '../store'

export const moodEmoji = (v: number) => ['😭', '😞', '😐', '🙂', '😄', '🤩'][Math.min(5, Math.floor((v - 1) / 2))]
export const energyEmoji = (v: number) => ['😴', '🥱', '😐', '🔋', '⚡', '🚀'][Math.min(5, Math.floor((v - 1) / 2))]

/** Resting at the inn: the nightly chronicle. */
export function ChronicleSheet({ onClose }: { onClose: () => void }) {
  const { file, commit } = useGame()
  const [mood, setMood] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [rest, setRest] = useState('7')
  const [triumphs, setTriumphs] = useState(['', '', ''])
  const restNum = parseFloat(rest)
  const valid = Number.isFinite(restNum) && restNum >= 0 && restNum <= 24

  const scribe = () => {
    if (!file || !valid) return play('close')
    const r = scribeChronicle(file, { mood, energy, rest: restNum, triumphs })
    play('quest')
    commit(r.file, r.events)
    onClose()
  }

  return (
    <>
      <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        <h2 className="skyrim-font">REST AT THE INN</h2>
        <p className="note serif">Scribe tonight's chronicle. Rest restores your Magicka and keeps the streak alive.</p>
        <label className="skyrim-font field" htmlFor="c-mood">MOOD <span className="meaning">health</span><span className="val">{moodEmoji(mood)} {mood}</span></label>
        <input id="c-mood" type="range" min={1} max={10} value={mood} onChange={(e) => setMood(Number(e.target.value))} className="range health" />
        <label className="skyrim-font field" htmlFor="c-energy">ENERGY <span className="meaning">stamina</span><span className="val">{energyEmoji(energy)} {energy}</span></label>
        <input id="c-energy" type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="range stamina" />
        <label className="skyrim-font field" htmlFor="c-rest">REST <span className="meaning">hours slept, restores magicka</span></label>
        <input id="c-rest" className="input" type="number" inputMode="decimal" min={0} max={24} step={0.5} value={rest} onChange={(e) => setRest(e.target.value)} aria-invalid={!valid} />
        <label className="skyrim-font field">TRIUMPHS <span className="meaning">optional</span></label>
        {triumphs.map((t, i) => <input key={i} className="input" value={t} maxLength={120} placeholder={`Triumph ${i + 1}...`} aria-label={`Triumph ${i + 1}`} onChange={(e) => setTriumphs(triumphs.map((x, j) => (j === i ? e.target.value : x)))} />)}
        <div className="row"><button className="btn skyrim-font" onClick={() => { play('close'); onClose() }}>LATER</button><button className="btn gold skyrim-font" onClick={scribe} disabled={!valid}>SCRIBE</button></div>
      </motion.div>
    </>
  )
}
