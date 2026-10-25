import type { Constellation as Con } from '../game/constellations'
import { perkStatus } from '../game/logic'
import type { GameFile } from '../game/types'

/** A constellation star chart; stars are clickable when a perk id is focused. */
export function Constellation({ con, file, focused, onStar, size = 300 }: { con: Con; file: GameFile; focused?: string | null; onStar?: (id: string) => void; size?: number }) {
  const maxY = Math.max(...con.perks.map((p) => p.y), 450)
  return (
    <svg width={size} height={size} viewBox={`0 0 500 ${maxY + 50}`} className="constellation" aria-label={`${con.name} constellation`}>
      {con.spectralPaths.map((d, i) => <path key={i} d={d} className="art" />)}
      {con.lines.map(([s, e], i) => {
        const a = con.perks[s], b = con.perks[e]
        const lit = file.perks.includes(a.id) && file.perks.includes(b.id)
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`line ${lit ? 'lit' : ''}`} />
      })}
      {con.perks.map((p) => {
        const st = perkStatus(file, p.id)
        return (
          <g key={p.id} className={`star ${st.owned ? 'owned' : st.available ? 'available' : ''} ${focused === p.id ? 'focused' : ''}`} onClick={() => onStar?.(p.id)} role={onStar ? 'button' : undefined}>
            <circle cx={p.x} cy={p.y} r={st.owned ? 13 : 9} />
            {focused === p.id && <circle cx={p.x} cy={p.y} r={22} className="ring" />}
          </g>
        )
      })}
    </svg>
  )
}
