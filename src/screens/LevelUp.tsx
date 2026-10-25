import { motion } from 'framer-motion'
import { advanceLevel } from '../game/logic'
import { play } from '../lib/sfx'
import { useGame } from '../store'

const COLORS = { magicka: '#3d8de0', health: '#e05a4e', stamina: '#3fae3c' } as const

/** Skyrim's level-up screen. Shows whenever a level is waiting and nothing else is on screen. */
export function LevelUp() {
  const { file, commit } = useGame()
  if (!file) return null
  const pick = (a: keyof typeof COLORS) => { play('levelup'); commit(advanceLevel(file, a).file) }
  return (
    <motion.div className="levelup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="dialog" aria-label="Level up">
      <h1 className="skyrim-font">LEVEL UP</h1>
      <p className="serif">Level {file.level + 1}. Choose an attribute to advance; a perk point is yours either way.</p>
      <div className="choices">
        {(['magicka', 'health', 'stamina'] as const).map((a) => (
          <button key={a} className="choice" style={{ color: COLORS[a] }} onClick={() => pick(a)}>
            <span className="cur serif">{a === 'health' ? `${file.containers} hearts` : a === 'magicka' ? file.magickaMax : `${file.staminaMax} segments`}</span>
            <span className="skyrim-font name">{a.toUpperCase()}</span>
            <span className="delta serif">{a === 'health' ? '+1 heart' : a === 'magicka' ? '+10' : '+1 segment'}</span>
          </button>
        ))}
      </div>
      {file.pendingLevels > 1 && <p className="meaning">{file.pendingLevels} levels waiting</p>}
    </motion.div>
  )
}
