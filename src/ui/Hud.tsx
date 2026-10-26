import { maxHealth, today } from '../game/logic'
import { holdById } from '../game/holds'
import type { GameFile } from '../game/types'

/** Skyrim's three bars: magicka left, health centre, stamina right as segments. */
export function Bars({ file }: { file: GameFile }) {
  const pct = (v: number, m: number) => `${Math.max(0, Math.min(100, (v / m) * 100))}%`
  if (file.zen) return null
  return (
    <div className="bars" aria-label="Vitals">
      <div className="bar" title={`Magicka ${file.magicka}/${file.magickaMax}`}><div className="bg"><div className="fill magicka" style={{ width: pct(file.magicka, file.magickaMax) }} /></div></div>
      <div className="bar" title={`Health ${file.health / 4}/${file.containers}`}><div className={`bg ${file.health <= 4 ? 'low' : ''}`}><div className="fill health" style={{ width: pct(file.health, maxHealth(file)) }} /></div></div>
      <div className="bar segs" title={`Stamina ${file.stamina}/${file.staminaMax}`}>
        {Array.from({ length: file.staminaMax }, (_, i) => <span key={i} className={`seg ${i < file.stamina ? 'on' : ''}`} />)}
      </div>
    </div>
  )
}

/** The compass strip: the hold you stand in, with how many quests wait here. */
export function Compass({ file }: { file: GameFile }) {
  const here = file.quests.filter((q) => q.hold === file.hold)
  const open = here.filter((q) => (q.kind === 'misc' ? q.lastDone !== today() : !q.doneAt)).length
  return (
    <div className="compass">
      <span className="mark">W</span><span className="tick" /><span className="mark">NW</span><span className="tick" />
      <span className="hold-name skyrim-font">{holdById(file.hold).name}{open > 0 && <b className="count">{open}</b>}</span>
      <span className="tick" /><span className="mark">NE</span><span className="tick" /><span className="mark">E</span>
      <span className="needle" />
    </div>
  )
}
