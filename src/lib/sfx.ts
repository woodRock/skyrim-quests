/** Sound effects from /public/sounds, unlocked by the first tap. */
export type Sfx = 'click' | 'open' | 'close' | 'quest' | 'accept' | 'objective' | 'levelup' | 'skillup' | 'spell' | 'item' | 'travel' | 'page' | 'damage' | 'died'

const FILES: Record<Sfx, { file: string; gain: number }> = {
  click: { file: 'click.mp3', gain: 0.2 }, open: { file: 'click.mp3', gain: 0.3 }, close: { file: 'click.mp3', gain: 0.25 },
  // Quest sounds are synthesised drums and horns (scratch script, not game audio): a war drum and low horn swell
  // when a quest resolves, a single drum when one is taken on, a muted thud for an objective.
  quest: { file: 'quest-complete.mp3', gain: 0.7 }, accept: { file: 'quest-new.mp3', gain: 0.55 }, objective: { file: 'objective.mp3', gain: 0.5 },
  levelup: { file: 'levelup.mp3', gain: 0.8 }, skillup: { file: 'skillup.mp3', gain: 0.45 },
  spell: { file: 'spell.mp3', gain: 0.35 }, item: { file: 'item.mp3', gain: 0.4 },
  travel: { file: 'travel.mp3', gain: 0.5 },  // a deep felt piano note: setting out for, or arriving at, a hold
  page: { file: 'page.mp3', gain: 0.4 },  // a felt-wrapped low piano note for turning between skills
  damage: { file: 'item.mp3', gain: 0.5 }, died: { file: 'spell.mp3', gain: 0.6 },
}
const KEY = 'skyrim.muted'
let muted = (() => { try { return localStorage.getItem(KEY) === '1' } catch { return false } })()
let unlocked = false
const cache = new Map<string, HTMLAudioElement>()

if (typeof window !== 'undefined') {
  const unlock = () => { unlocked = true }
  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock, { passive: true })
}

export const isMuted = () => muted
export const setMuted = (m: boolean) => { muted = m; try { localStorage.setItem(KEY, m ? '1' : '0') } catch { /* ignore */ } }

export function play(sfx: Sfx) {
  if (muted || !unlocked || typeof Audio === 'undefined') return
  try {
    const { file, gain } = FILES[sfx]
    const src = `${import.meta.env.BASE_URL}sounds/${file}`
    let base = cache.get(src)
    if (!base) { base = new Audio(src); base.preload = 'auto'; cache.set(src, base) }
    const a = base.cloneNode(true) as HTMLAudioElement
    a.volume = gain
    a.play().catch(() => {})
  } catch { /* never let audio break play */ }
}
