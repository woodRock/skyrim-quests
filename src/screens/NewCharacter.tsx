import { useState } from 'react'
import { RACES } from '../game/races'
import { SKILL_MEANING } from '../game/spells'
import { play } from '../lib/sfx'
import { useGame } from '../store'

export function NewCharacter() {
  const { newSlot, createFile, go } = useGame()
  const [name, setName] = useState('')
  const [race, setRace] = useState(RACES[0].name)
  const r = RACES.find((x) => x.name === race)!

  const begin = () => {
    const clean = name.trim().slice(0, 16)
    if (!clean || !newSlot) return play('close')
    play('quest')
    createFile(newSlot, clean, race)
  }

  return (
    <div className="screen menu-bg scroll">
      <h2 className="menu-title skyrim-font">NEW CHARACTER</h2>
      <div className="panel form">
        <label className="skyrim-font field" htmlFor="name">NAME</label>
        <input id="name" className="input" autoFocus maxLength={16} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && begin()} placeholder="Dragonborn" />
        <label className="skyrim-font field">RACE</label>
        <div className="race-grid">
          {RACES.map((x) => <button key={x.name} type="button" className={`chip skyrim-font ${race === x.name ? 'on' : ''}`} onClick={() => { play('click'); setRace(x.name) }}>{x.name}</button>)}
        </div>
        <p className="serif race-blurb">{r.blurb}</p>
        <p className="serif muted"><b className="gold">+10</b> {r.major} <i>({SKILL_MEANING[r.major]})</i> · <b className="gold">+5</b> {r.minor.map((m) => `${m} (${SKILL_MEANING[m]})`).join(', ')}</p>
        <div className="row">
          <button className="btn gold skyrim-font" onClick={begin} disabled={!name.trim()}>BEGIN</button>
          <button className="btn skyrim-font" onClick={() => { play('close'); go('menu') }}>BACK</button>
        </div>
      </div>
    </div>
  )
}
