import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { holdById } from '../game/holds'
import { itemById } from '../game/items'
import { isBigEvent } from '../game/logic'
import { eventText } from '../game/text'
import type { GameEvent } from '../game/types'
import { play } from '../lib/sfx'
import { useGame } from '../store'
import { TextBox } from './TextBox'

/** The Skyrim loading screen: spinning cube, a tip, a bar; tap to continue once the realm is ready. */
export function LoadingScreen() {
  const loading = useGame((s) => s.loading)
  const skip = useGame((s) => s.skipLoading)
  useEffect(() => {
    if (!loading?.ready) return
    const onKey = () => skip()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading?.ready, skip])
  return (
    <AnimatePresence>
      {loading && (
        <motion.div className="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} onClick={skip} aria-busy={!loading.ready}>
          <div className="loading-scene"><div className="cube">
            <div className="face f1">✨</div><div className="face f2">💎</div><div className="face f3">📜</div>
            <div className="face f4">🍷</div><div className="face f5">⚔️</div><div className="face f6">🛡️</div>
          </div></div>
          {loading.hold && <div className="loading-hold skyrim-font">{holdById(loading.hold).name}</div>}
          <div className="loading-tip"><h2 className="skyrim-font">DID YOU KNOW?</h2><p className="serif">“{loading.tip}”</p></div>
          <div className="loading-bar">
            <div className="skyrim-font label">{loading.ready ? 'TAP TO CONTINUE' : 'LOADING...'}</div>
            <div className="track"><div className="fill" /></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const ICON: Partial<Record<GameEvent['type'], string>> = {
  skillUp: '✦', levelUp: '⬆', perk: '★', dragon: '🐉', soul: '🌀', container: '❤️', word: '🗣', hold: '🗺', streak: '🔥', damage: '💔', stone: '🪨',
}

/** Plays queued events one at a time: small ones as sounds, big ones as an item-get scene with a dialog box. */
export function EventPlayer() {
  const { events, shiftEvent, loading } = useGame()
  const e = events[0]
  const big = e && isBigEvent(e)

  useEffect(() => {
    if (!e || loading) return
    if (!big) {
      if (e.type === 'gold') play('item')
      else if (e.type === 'heal') play('click')
      else if (e.type === 'objective') play('objective')
      shiftEvent()
      return
    }
    if (e.type === 'died') { shiftEvent(); return }
    play(e.type === 'levelUp' ? 'levelup' : e.type === 'skillUp' ? 'skillup' : e.type === 'damage' ? 'damage' : e.type === 'hold' ? 'travel' : 'item')
  }, [e, big, shiftEvent, loading])

  if (!e || !big || loading || e.type === 'died') return null
  const icon = e.type === 'item' ? itemById(e.item).icon : ICON[e.type]
  return (
    <motion.div className="item-get" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {icon && (
        <>
          <div className="rays" />
          <motion.div className="item" initial={{ y: 60, scale: 0.3, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 120 }}>{icon}</motion.div>
        </>
      )}
      <TextBox key={events.length + e.type} pages={[eventText(e)]} onDone={shiftEvent} speaker={e.type === 'damage' ? 'Lydia' : undefined} />
    </motion.div>
  )
}

/** A word about your save: a newer one arrived from another device, or this one could not be written. */
export function Notice() {
  const notice = useGame((s) => s.notice)
  const clear = useGame((s) => s.clearNotice)
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(clear, 6000)
    return () => clearTimeout(t)
  }, [notice, clear])
  return (
    <AnimatePresence>
      {notice && (
        <motion.div key={notice} className="notice serif" role="status" onClick={clear} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{notice}</motion.div>
      )}
    </AnimatePresence>
  )
}

export function YouDied() {
  const { died, events, continueAfterDeath, quitToMenu } = useGame()
  const show = died && events.length === 0
  useEffect(() => { if (show) play('died') }, [show])
  if (!show) return null
  return (
    <motion.div className="died" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}>
      <h1 className="skyrim-font">YOU DIED</h1>
      <p className="serif">Overdue quests took the last of your health. Nothing is lost: the realm remembers everything.</p>
      <div className="stack">
        <button className="btn gold skyrim-font" onClick={() => { play('open'); continueAfterDeath() }}>LOAD LAST SAVE</button>
        <button className="btn skyrim-font" onClick={() => { play('close'); continueAfterDeath(); quitToMenu() }}>QUIT TO MENU</button>
      </div>
    </motion.div>
  )
}
