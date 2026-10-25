import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { backend } from '../lib/backend'
import { isMuted, play, setMuted } from '../lib/sfx'
import { useGame } from '../store'

/** Title screen: logo over fog and mountains, press any key, then Skyrim's menu. */
export function Title() {
  const { user, screen, go, slots, slotsLoaded, startFile, signOut } = useGame()
  const [ready, setReady] = useState(false)
  const [settings, setSettings] = useState(false)
  const [muted, setMute] = useState(isMuted())
  const menu = screen === 'menu'
  const stars = useMemo(() => Array.from({ length: 80 }, () => ({ x: Math.random() * 100, y: Math.random() * 55, r: 0.2 + Math.random() * 0.5, d: 2 + Math.random() * 4 })), [])

  useEffect(() => { const t = setTimeout(() => setReady(true), 1500); return () => clearTimeout(t) }, [])

  const press = () => {
    if (!ready || user === undefined || menu) return
    play('open')
    go(user ? 'menu' : 'login')
  }
  useEffect(() => {
    const onKey = () => press()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const latest = slots.filter(Boolean).sort((a, b) => b!.updatedAt - a!.updatedAt)[0]
  const empty = slots.findIndex((s) => !s)

  return (
    <div className="screen title" onClick={press}>
      <svg className="stars" viewBox="0 0 100 100" preserveAspectRatio="none">
        {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r / 4} fill="#fff"><animate attributeName="opacity" values="1;.2;1" dur={`${s.d}s`} repeatCount="indefinite" /></circle>)}
      </svg>
      <div className="aurora" />
      <svg className="mountains" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 120 60 60 110 100 170 30 230 90 290 50 340 95 400 60V200H0Z" fill="#141826" />
        <path d="M0 150 50 110 120 140 190 90 250 130 320 100 400 140V200H0Z" fill="#0b0d16" />
        <path d="M0 175 80 150 160 170 240 145 320 165 400 150V200H0Z" fill="#050609" />
      </svg>
      <div className="fog" /><div className="fog two" />

      <motion.div className="logo" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.6, delay: 0.3 }}>
        <div className="emblem">◈</div>
        <h1 className="skyrim-font">SKYRIM</h1>
        <div className="sub skyrim-font">QUESTS</div>
      </motion.div>

      {!menu && ready && <div className="press skyrim-font">{user === undefined ? 'LOADING...' : 'PRESS ANY KEY'}</div>}

      {menu && (
        <motion.nav className="main-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={(e) => e.stopPropagation()}>
          {settings ? (
            <>
              <button className="mm skyrim-font" onClick={() => { setMuted(!muted); setMute(!muted); play('click') }}>SOUND {muted ? 'OFF' : 'ON'}</button>
              <button className="mm skyrim-font" onClick={() => { play('close'); void signOut() }}>SIGN OUT</button>
              <button className="mm skyrim-font" onClick={() => { play('close'); setSettings(false) }}>BACK</button>
              <p className="note serif">{user?.email} · {backend.mode === 'cloud' ? 'synced across devices' : 'saved on this device only'}</p>
            </>
          ) : (
            <>
              <button className="mm skyrim-font" disabled={!slotsLoaded || !latest} onClick={() => { play('open'); if (latest) startFile(latest.slot) }}>CONTINUE{latest ? ` · ${latest.name}` : ''}</button>
              <button className="mm skyrim-font" disabled={!slotsLoaded} onClick={() => { play('open'); if (empty >= 0) { useGame.setState({ newSlot: empty + 1 }); go('new') } else go('files') }}>NEW</button>
              <button className="mm skyrim-font" disabled={!slotsLoaded} onClick={() => { play('open'); go('files') }}>LOAD</button>
              <button className="mm skyrim-font" onClick={() => { play('open'); setSettings(true) }}>SETTINGS</button>
            </>
          )}
        </motion.nav>
      )}
      <div className="copyright serif">A fan-made quest log for real life. Not affiliated with Bethesda.</div>
    </div>
  )
}
